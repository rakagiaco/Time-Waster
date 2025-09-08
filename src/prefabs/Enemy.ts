import Phaser from 'phaser';
import { Entity } from './Entity';
import { StateMachine, State } from '../lib/StateMachine';
import { listen, createLootInterfaceWindow } from '../lib/HelperFunc';
import GameConfig from '../config/GameConfig';
import { Item } from './Item';

// Enemy States
class EnemyPatrolState extends State {
    enter(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.setVelocity(0, 0);
        enemy.patrolTimer = 0;
        enemy.patrolDirection = Math.random() > 0.5 ? 1 : -1; // Random initial direction

        // Start with idle animation
        const idleAnim = enemy.getIdleAnimationName('right');
        if (scene.anims.exists(idleAnim)) {
            enemy.anims.play(idleAnim, true);
        }
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        // Check if player is detected (with safety check)
        try {
            if (listen(scene as any, enemy)) {
                enemy.safeTransitionToState('alert');
                return;
            }
        } catch (error) {
            // Silently handle listen function errors during patrolling
        }

        // Enhanced patrol movement with more dynamic behavior
        enemy.patrol();
        
        // Update animation based on movement direction
        const direction = enemy.getDirectionFromVelocity();
        const isMoving = enemy.body && (Math.abs(enemy.body.velocity.x) > 1 || Math.abs(enemy.body.velocity.y) > 1);
        
        if (isMoving) {
            // Use run animation when moving
            const runAnim = enemy.getWalkAnimationName(direction);
            console.log(`Enemy moving - direction: ${direction}, runAnim: ${runAnim}, exists: ${scene.anims.exists(runAnim)}`);
            if (scene.anims.exists(runAnim)) {
                enemy.anims.play(runAnim, true);
            }
        } else {
            // Use idle animation when not moving
            const idleAnim = enemy.getIdleAnimationName(direction);
            console.log(`Enemy idle - direction: ${direction}, idleAnim: ${idleAnim}, exists: ${scene.anims.exists(idleAnim)}`);
            if (scene.anims.exists(idleAnim)) {
                enemy.anims.play(idleAnim, true);
            }
        }
    }
}

class EnemyAlertState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.setVelocity(0, 0);
        enemy.alertTimer = 0;

        // Play alert animation or sound
        const direction = enemy.getDirectionFromVelocity();
        const idleAnim = enemy.getIdleAnimationName(direction);
        enemy.safePlayAnimation(idleAnim);

        // Show alert indicator (could be a visual effect)
        enemy.showAlertIndicator();
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.alertTimer += scene.game.loop.delta;

        // Check if player is still in detection range
        try {
            if (!listen(scene as any, enemy)) {
                // console.log(`Enemy ${enemy.entity_type} lost player, returning to patrol`);
                enemy.safeTransitionToState('patrolling');
                return;
            }
        } catch (error) {
            // Silently handle listen function errors during alert
        }

        // After alert period, transition to pursuing
        if (enemy.alertTimer > 500) { // 0.5 second alert period
            // console.log(`Enemy ${enemy.entity_type} transitioning from alert to pursuing`);
            enemy.safeTransitionToState('pursuing');
        }
    }
}

class EnemyPursuingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.pursuitTimer = 0;
        enemy.lastPlayerPosition = { x: 0, y: 0 };

        // Start with run animation since we're pursuing
        const direction = enemy.getDirectionFromVelocity();
        const runAnim = enemy.getWalkAnimationName(direction);
        enemy.safePlayAnimation(runAnim);
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.pursuitTimer += scene.game.loop.delta;

        // Check if player is out of range (with safety check)
        try {
            if (!listen(scene as any, enemy)) {
                enemy.safeTransitionToState('searching');
                return;
            }
        } catch (error) {
            // Silently handle listen function errors during pursuing
        }

        // Check if close enough to attack
        if (enemy.isPlayerInAttackRange()) {
            enemy.safeTransitionToState('attacking');
            return;
        }

        // Enhanced pursuit with pathfinding-like behavior
        enemy.pursuePlayer();

        // Update animation based on movement direction
        const direction = enemy.getDirectionFromVelocity();
        const isMoving = enemy.body && (Math.abs(enemy.body.velocity.x) > 1 || Math.abs(enemy.body.velocity.y) > 1);
        
        if (isMoving) {
            // Use run animation when pursuing
            const runAnim = enemy.getWalkAnimationName(direction);
            if (scene.anims.exists(runAnim)) {
                enemy.anims.play(runAnim, true);
            }
        } else {
            // Use idle animation when not moving
            const idleAnim = enemy.getIdleAnimationName(direction);
            if (scene.anims.exists(idleAnim)) {
                enemy.anims.play(idleAnim, true);
            }
        }

        // If pursuing for too long without reaching player, try different approach
        if (enemy.pursuitTimer > 5000) { // 5 seconds
            enemy.safeTransitionToState('flanking');
        }
    }
}

class EnemySearchingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.setVelocity(0, 0);
        enemy.searchTimer = 0;
        enemy.searchDirection = Math.random() > 0.5 ? 1 : -1;
        enemy.lastKnownPlayerPosition = enemy.lastPlayerPosition;

        // Play search animation
        const direction = enemy.getDirectionFromVelocity();
        const idleAnim = enemy.getIdleAnimationName(direction);
        enemy.safePlayAnimation(idleAnim);
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.searchTimer += scene.game.loop.delta;

        // Check if player is detected again
        try {
            if (listen(scene as any, enemy)) {
                enemy.safeTransitionToState('pursuing');
                return;
            }
        } catch (error) {
            // Silently handle listen function errors during searching
        }

        // Search behavior - move towards last known position
        if (enemy.lastKnownPlayerPosition) {
            const dx = enemy.lastKnownPlayerPosition.x - enemy.x;
            const dy = enemy.lastKnownPlayerPosition.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 10 && enemy.body) {
                const vx = (dx / distance) * (enemy.getVelocity() * 0.5); // Slower search speed
                const vy = (dy / distance) * (enemy.getVelocity() * 0.5);
                enemy.setVelocity(vx, vy);
            } else {
                // Reached last known position, give up and patrol
                enemy.safeTransitionToState('patrolling');
            }
        } else {
            // No last known position, just patrol
            enemy.safeTransitionToState('patrolling');
        }

        // Give up searching after a while
        if (enemy.searchTimer > 3000) { // 3 seconds
            enemy.safeTransitionToState('patrolling');
        }
    }
}

class EnemyFlankingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.flankTimer = 0;
        enemy.flankDirection = Math.random() > 0.5 ? 1 : -1;

        // Play run animation for flanking
        const direction = enemy.getDirectionFromVelocity();
        const runAnim = enemy.getWalkAnimationName(direction);
        enemy.safePlayAnimation(runAnim);
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.flankTimer += scene.game.loop.delta;

        // Check if player is out of range
        try {
            if (!listen(scene as any, enemy)) {
                enemy.safeTransitionToState('patrolling');
                return;
            }
        } catch (error) {
            // Silently handle listen function errors during flanking
        }

        // Check if close enough to attack
        if (enemy.isPlayerInAttackRange()) {
            enemy.safeTransitionToState('attacking');
            return;
        }

        // Flanking behavior - try to approach from the side
        enemy.flankPlayer();

        // Update animation based on movement direction
        const direction = enemy.getDirectionFromVelocity();
        const isMoving = enemy.body && (Math.abs(enemy.body.velocity.x) > 1 || Math.abs(enemy.body.velocity.y) > 1);
        
        if (isMoving) {
            // Use run animation when flanking
            const runAnim = enemy.getWalkAnimationName(direction);
            if (scene.anims.exists(runAnim)) {
                enemy.anims.play(runAnim, true);
            }
        } else {
            // Use idle animation when not moving
            const idleAnim = enemy.getIdleAnimationName(direction);
            if (scene.anims.exists(idleAnim)) {
                enemy.anims.play(idleAnim, true);
            }
        }

        // Return to normal pursuit after flanking attempt
        if (enemy.flankTimer > 2000) { // 2 seconds
            enemy.safeTransitionToState('pursuing');
        }
    }
}

class EnemyAttackingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.attackTimer = 0;
        enemy.attackPlayer();
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.attackTimer += scene.game.loop.delta;

        // Check if player is still in attack range
        if (!enemy.isPlayerInAttackRange()) {
            enemy.safeTransitionToState('pursuing');
            return;
        }

        // Check if player is out of detection range
        try {
            if (!listen(scene as any, enemy)) {
                enemy.safeTransitionToState('patrolling');
                return;
            }
        } catch (error) {
            // Silently handle listen function errors during attacking
        }

        // Attack cooldown and combo system
        if (!enemy.isAttackOnCooldown()) {
            // Chance for combo attack
            if (enemy.attackTimer > 1000 && Math.random() < 0.3) {
                enemy.performComboAttack();
            } else {
                enemy.safeTransitionToState('pursuing');
            }
        }
    }
}

class EnemyDeadState extends State {
    enter(scene: Phaser.Scene, enemy: Enemy): void {
        // Check if animation exists before playing
        const direction = enemy.getDirectionFromVelocity();
        const deathAnim = enemy.getDeathAnimationName(direction);
        enemy.safePlayAnimation(deathAnim);

        enemy.setVelocity(0, 0);

        // Set death timer
        scene.time.delayedCall(GameConfig.TIMING.ENEMY_DEATH_DELAY, () => {
            enemy.safeTransitionToState('fading');
        });
    }

    execute(_scene: Phaser.Scene, _enemy: Enemy): void {
        // Wait for death animation
    }
}

class EnemyFadingState extends State {
    enter(scene: Phaser.Scene, enemy: Enemy): void {
        // Start fade out
        scene.tweens.add({
            targets: enemy,
            alpha: 0,
            duration: GameConfig.TIMING.ENEMY_FADE_DELAY,
            onComplete: () => {
                enemy.safeTransitionToState('reviving');
            }
        });
    }

    execute(_scene: Phaser.Scene, _enemy: Enemy): void {
        // Wait for fade to complete
    }
}

class EnemyRevivingState extends State {
    enter(scene: Phaser.Scene, enemy: Enemy): void {
        // Reset enemy properties
        enemy.reset();

        // Set revive timer
        scene.time.delayedCall(GameConfig.TIMING.ENEMY_REVIVE_DELAY, () => {
            enemy.safeTransitionToState('patrolling');
        });
    }

    execute(_scene: Phaser.Scene, _enemy: Enemy): void {
        // Wait for revive timer
    }
}

export class Enemy extends Entity {
    public animsFSM!: StateMachine;
    private player: any; // TODO: Replace with proper Player type when available
    public patrolDirection: number = 0; // Now stores angle in radians
    public patrolTimer: number = 0;
    private attackCooldown: boolean = false;
    public looted: boolean = false;
    public is_lootable: boolean = false;
    public entity_type: string = 'Nepian Scout';
    public isAttacking: boolean = false;
    public isBoss: boolean = false;
    public attackPower: number = 10;
    public lightAttack_dmg: number = 0;
    public heavyAttack_dmg: number = 0;

    // Enhanced AI properties
    public alertTimer: number = 0;
    public pursuitTimer: number = 0;
    public searchTimer: number = 0;
    public flankTimer: number = 0;
    public attackTimer: number = 0;
    public lastPlayerPosition: { x: number; y: number } = { x: 0, y: 0 };
    public lastKnownPlayerPosition: { x: number; y: number } | null = null;
    public searchDirection: number = 1;
    public flankDirection: number = 1;
    public detectionDistance: number = GameConfig.DETECTION.DEFAULT_DISTANCE;
    public alertIndicator: Phaser.GameObjects.Graphics | null = null;

    // Night-time stat modifiers
    private baseVelocity: number = 0;
    private baseAttackPower: number = 0;
    private isNightTime: boolean = false;
    private nightStatsApplied: boolean = false;

    // Pathfinding properties
    private currentPath: { x: number; y: number }[] = [];
    private currentWaypointIndex: number = 0;
    private pathfindingEnabled: boolean = true;
    
    // Enhanced AI properties
    private patrolPattern: 'horizontal' | 'circular' | 'random' | 'stationary' = 'horizontal';
    private patrolCenter: { x: number; y: number } = { x: 0, y: 0 };
    private patrolRadius: number = 50;
    private lastDirection: string = 'right';

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'orc-shaman-idle') {
        super(scene, x, y, texture);

        // Set enemy-specific properties
        this.HIT_POINTS = 50;
        this.MAX_HIT_POINTS = 50;
        this.VELOCITY = GameConfig.MOVEMENT.ENEMY_BASE_VELOCITY;

        // Store base stats for night-time modifications
        this.baseVelocity = GameConfig.MOVEMENT.ENEMY_BASE_VELOCITY;
        this.baseAttackPower = this.attackPower;

        // Set detection distance based on enemy type
        this.setDetectionDistance();

        // Setup patrol pattern and center
        this.setupPatrolPattern();

        // Setup state machine
        this.setupStateMachine();

        // Setup physics
        this.setupPhysics();

        // Find player reference
        this.findPlayer();

        // Create name tag
        this.createNameTag();
    }

    private setDetectionDistance(): void {
        // Set different detection distances for different enemy types
        if (this.entity_type === 'Nepian Observer') {
            this.detectionDistance = GameConfig.DETECTION.ENEMY_OBSERVER_DETECTION;
        } else if (this.isBoss) {
            this.detectionDistance = GameConfig.DETECTION.BOSS_DETECTION;
        } else {
            this.detectionDistance = GameConfig.DETECTION.DEFAULT_DISTANCE;
        }
    }

    private setupPatrolPattern(): void {
        // Set patrol center to current position
        this.patrolCenter = { x: this.x, y: this.y };
        
        // Randomly assign patrol pattern for variety
        const patterns: ('horizontal' | 'circular' | 'random' | 'stationary')[] = 
            ['horizontal', 'circular', 'random', 'stationary'];
        this.patrolPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // Initialize patrol direction based on pattern
        this.initializePatrolDirection();
        
        // Set patrol radius based on enemy type
        if (this.isBoss) {
            this.patrolRadius = 80;
        } else if (this.entity_type === 'Nepian Observer') {
            this.patrolRadius = 60;
        } else {
            this.patrolRadius = 40 + Math.random() * 30; // Random radius between 40-70
        }
        
        // console.log(`Enemy ${this.entity_type} using ${this.patrolPattern} patrol pattern with radius ${this.patrolRadius}`);
    }

    private initializePatrolDirection(): void {
        switch (this.patrolPattern) {
            case 'horizontal':
                this.patrolDirection = Math.random() > 0.5 ? 0 : Math.PI; // Left or right
                break;
            case 'circular':
                this.patrolDirection = 0; // Will be calculated dynamically
                break;
            case 'random':
                this.patrolDirection = Math.random() * Math.PI * 2; // Random angle
                break;
            case 'stationary':
                this.patrolDirection = 0; // Not used for stationary
                break;
        }
    }

    private setupStateMachine(): void {
        try {
            const states = {
                'patrolling': new EnemyPatrolState(),
                'alert': new EnemyAlertState(),
                'pursuing': new EnemyPursuingState(),
                'searching': new EnemySearchingState(),
                'flanking': new EnemyFlankingState(),
                'attacking': new EnemyAttackingState(),
                'dead': new EnemyDeadState(),
                'fading': new EnemyFadingState(),
                'reviving': new EnemyRevivingState()
            };

            this.animsFSM = new StateMachine('patrolling', states, [this.scene, this]);
            // console.log(`State machine initialized for ${this.entity_type}`);
        } catch (error) {
            console.error('Error setting up state machine:', error);
            // Create a minimal fallback state machine
            this.animsFSM = new StateMachine('patrolling', {
                'patrolling': new EnemyPatrolState()
            }, [this.scene, this]);
        }
    }

    /**
     * Safely transition to a new state with validation
     */
    public safeTransitionToState(stateName: string): boolean {
        try {
            if (this.animsFSM) {
                this.animsFSM.transition(stateName);
                return true;
            } else {
                // State machine not initialized
                return false;
            }
        } catch (error) {
            console.error(`Error transitioning to state ${stateName}:`, error);
            return false;
        }
    }

    private setupPhysics(): void {
        this.setCollideWorldBounds(true); // Enable world bounds collision
        this.setSize(16, 16);
        this.setOffset(8, 8);
    }

    private findPlayer(): void {
        // Find player in the scene - try multiple approaches with proper validation
        try {
            // Try scene properties first
            if ((this.scene as any).player) {
                this.player = (this.scene as any).player;
            } else if ((this.scene as any).p1) {
                this.player = (this.scene as any).p1;
            } else {
                // Search through children by name
                this.player = this.scene.children.getByName('player') ||
                    this.scene.children.getByName('Player');
            }

            // If still not found, search through all children by constructor name
            if (!this.player) {
                this.scene.children.list.forEach(child => {
                    if (child.constructor.name === 'Player' && !this.player) {
                        this.player = child;
                    }
                });
            }

            // Validate player object
            if (this.player) {
                // Check if player has required methods
                if (typeof this.player.x !== 'number' || typeof this.player.y !== 'number') {
                    // Player found but missing position properties
                    this.player = null;
                }
            }

            // console.log('Enemy found player:', !!this.player, this.player?.constructor.name);
        } catch (error) {
            console.error('Error finding player:', error);
            this.player = null;
        }
    }

    public update(): void {
        // Update state machine
        this.animsFSM.step();

        // Update health bar position
        this.updateHealthBar();

        // Update name tag position
        this.updateNameTag();

        // Update patrol timer
        this.patrolTimer += this.scene.game.loop.delta;

        // Update alert indicator position if it exists
        if (this.alertIndicator) {
            this.alertIndicator.setPosition(this.x, this.y - 30);
        }

        // Check for nearby enemies for group behavior
        this.checkForNearbyEnemies();

        // Update night-time stats
        this.updateNightTimeStats();
    }

    private checkForNearbyEnemies(): void {
        // Find other enemies in the scene
        const nearbyEnemies: Enemy[] = [];
        this.scene.children.list.forEach(child => {
            if (child instanceof Enemy && child !== this) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
                if (distance < 100) { // Within 100 pixels
                    nearbyEnemies.push(child);
                }
            }
        });

        // If this enemy is in pursuit and there are nearby enemies, they might join the hunt
        if (this.animsFSM.state === 'pursuing' && nearbyEnemies.length > 0) {
            nearbyEnemies.forEach(enemy => {
                if (enemy.animsFSM.state === 'patrolling') {
                    // Chance for nearby enemies to join the pursuit
                    if (Math.random() < 0.3) {
                        enemy.safeTransitionToState('alert');
                    }
                }
            });
        }
    }

    private updateNightTimeStats(): void {
        // Check if day/night cycle exists in the scene
        const scene = this.scene as any;
        if (!scene.dayNightCycle) return;

        const dayNightCycle = scene.dayNightCycle;
        const currentlyNight = dayNightCycle.isCurrentlyNight();

        // Only update if night status has changed
        if (currentlyNight !== this.isNightTime) {
            this.isNightTime = currentlyNight;

            if (this.isNightTime) {
                // Apply night-time stat bonuses
                this.applyNightStats();
            } else {
                // Remove night-time stat bonuses
                this.removeNightStats();
            }
        }
    }

    private applyNightStats(): void {
        if (this.nightStatsApplied) {
            // console.log(`${this.entity_type} night stats already applied, skipping`);
            return;
        }

        try {
            // Apply speed bonus
            this.VELOCITY = this.baseVelocity * GameConfig.COMBAT.NIGHT_SPEED_MULTIPLIER;

            // Apply damage bonus
            this.attackPower = this.baseAttackPower * GameConfig.COMBAT.NIGHT_DAMAGE_MULTIPLIER;

            this.nightStatsApplied = true;

            // Visual indicator for night-time enhancement
            this.setTint(0x6666ff); // Slight blue tint to indicate night enhancement

            // console.log(`${this.entity_type} enhanced for night time - Speed: ${this.VELOCITY}, Attack: ${this.attackPower}`);
        } catch (error) {
            console.error('Error applying night stats:', error);
            this.nightStatsApplied = false;
        }
    }

    private removeNightStats(): void {
        if (!this.nightStatsApplied) {
            // console.log(`${this.entity_type} night stats not applied, skipping removal`);
            return;
        }

        try {
            // Restore base stats
            this.VELOCITY = this.baseVelocity;
            this.attackPower = this.baseAttackPower;

            this.nightStatsApplied = false;

            // Remove visual indicator
            this.clearTint();

            // console.log(`${this.entity_type} restored to day time stats - Speed: ${this.VELOCITY}, Attack: ${this.attackPower}`);
        } catch (error) {
            console.error('Error removing night stats:', error);
            this.nightStatsApplied = false;
        }
    }

    // Pathfinding methods
    public setPath(path: { x: number; y: number }[]): void {
        this.currentPath = [...path];
        this.currentWaypointIndex = 0;
    }

    public clearPath(): void {
        this.currentPath = [];
        this.currentWaypointIndex = 0;
    }

    public getNextWaypoint(): { x: number; y: number } | null {
        if (this.currentPath.length === 0 || this.currentWaypointIndex >= this.currentPath.length) {
            return null;
        }
        return this.currentPath[this.currentWaypointIndex];
    }

    public moveToWaypoint(): boolean {
        const waypoint = this.getNextWaypoint();
        if (!waypoint) return false;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, waypoint.x, waypoint.y);

        // If we're close enough to the waypoint, move to the next one
        if (distance < 15) {
            this.currentWaypointIndex++;
            return this.currentWaypointIndex < this.currentPath.length;
        }

        // Move towards the waypoint
        if (this.body) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, waypoint.x, waypoint.y);
            const velocity = this.VELOCITY;

            this.setVelocity(
                Math.cos(angle) * velocity,
                Math.sin(angle) * velocity
            );
        }

        return true;
    }

    public isPathfindingEnabled(): boolean {
        return this.pathfindingEnabled;
    }

    public setPathfindingEnabled(enabled: boolean): void {
        this.pathfindingEnabled = enabled;
        if (!enabled) {
            this.clearPath();
        }
    }

    public setHealth(health: number): void {
        this.HIT_POINTS = Math.max(0, Math.min(health, this.MAX_HIT_POINTS));
        this.updateHealthBar();
    }

    public reset(): void {
        try {
            this.HIT_POINTS = this.MAX_HIT_POINTS;
            this.isAttacking = false;
            this.alpha = 1;

            // Reset AI timers and states
            this.alertTimer = 0;
            this.pursuitTimer = 0;
            this.searchTimer = 0;
            this.flankTimer = 0;
            this.attackTimer = 0;
            this.lastPlayerPosition = { x: 0, y: 0 };
            this.lastKnownPlayerPosition = null;
            this.patrolTimer = 0;
            this.attackCooldown = false;

            // Clean up alert indicator
            this.cleanupAlertIndicator();

            // Reset night stats if applied
            if (this.nightStatsApplied) {
                this.removeNightStats();
            }

            // Safely transition to patrolling state
            this.safeTransitionToState('patrolling');
            
            // console.log(`${this.entity_type} reset successfully`);
        } catch (error) {
            console.error('Error resetting enemy:', error);
        }
    }

    public loot(): void {
        if (this.animsFSM.state === 'dead' && !this.looted) {
            let x: any = undefined;

            if (this.entity_type === 'Electro Lord Kealthis') { // the boss
                x = new Item(this.scene, this.x, this.y, 'frozen-heart').setAlpha(0);
            } else if (this.entity_type === 'Nepian Observer' && this.is_lootable) {
                x = new Item(this.scene, this.x, this.y, 'nepian-blood').setScale(0.5).setAlpha(0);
            }

            // Cast scene to GameScene to access custom properties
            const gameScene = this.scene as any;
            if (x !== undefined && !gameScene.p1?.windowOpen && !this.looted) {
                const player = gameScene.p1;
                const miniMapCamera = gameScene.miniMapCamera;
                if (player && miniMapCamera) {
                    createLootInterfaceWindow(x, gameScene, player, miniMapCamera);
                    this.looted = true;
                }
            }
        }
    }

    public takeDamage(amount: number): void {
        super.takeDamage(amount);

        // Play damage sound
        this.scene.sound.play('enemy-hit', { volume: 0.5 });

        // Check if enemy is dead
        if (this.isDead()) {
            this.animsFSM.transition('dead');
        }
    }

    protected die(): void {
        // Update quest progress when enemy is killed
        if (this.scene && this.scene.data && this.scene.data.get('questSystem')) {
            const questSystem = this.scene.data.get('questSystem');
            const enemyType = this.entity_type || 'enemy';
            questSystem.updateQuestProgress(enemyType, 1);
        }
        
        // Enemy death logic is handled by state machine
    }

    public patrol(): void {
        // Enhanced patrol movement with multiple patterns
        switch (this.patrolPattern) {
            case 'horizontal':
                this.patrolHorizontal();
                break;
            case 'circular':
                this.patrolCircular();
                break;
            case 'random':
                this.patrolRandom();
                break;
            case 'stationary':
                this.patrolStationary();
                break;
        }
    }

    private patrolHorizontal(): void {
        // Traditional horizontal patrol with direction changes
        if (this.patrolTimer > 4000 + Math.random() * 2000) { // 4-6 seconds between direction changes
            // Toggle between left (π) and right (0) directions
            this.patrolDirection = this.patrolDirection === 0 ? Math.PI : 0;
            this.patrolTimer = 0;

            // Occasionally pause during patrol
            if (Math.random() < 0.2) { // Reduced pause chance
                if (this.body) {
                    this.setVelocity(0, 0);
                }
                return;
            }
        }

        const baseVelocity = this.VELOCITY * 0.7 * Math.cos(this.patrolDirection);
        const verticalVariation = Math.sin(this.patrolTimer * 0.0005) * 5;
        
        if (this.body) {
            this.setVelocity(baseVelocity, verticalVariation);
        }
    }

    private patrolCircular(): void {
        // Circular patrol around the center point
        const angle = (this.patrolTimer * 0.001) % (Math.PI * 2);
        const radius = this.patrolRadius;
        
        const targetX = this.patrolCenter.x + Math.cos(angle) * radius;
        const targetY = this.patrolCenter.y + Math.sin(angle) * radius;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.body) {
            if (distance > 5) {
                const vx = (dx / distance) * this.VELOCITY * 0.5;
                const vy = (dy / distance) * this.VELOCITY * 0.5;
                this.setVelocity(vx, vy);
            } else {
                this.setVelocity(0, 0);
            }
        }
    }

    private patrolRandom(): void {
        // Random movement with occasional direction changes
        if (this.patrolTimer > 3000 + Math.random() * 2000) { // 3-5 seconds between direction changes
            // Pick a new random direction and stick with it
            const angle = Math.random() * Math.PI * 2; // Random angle 0-2π
            this.patrolDirection = angle; // Store the angle instead of just 1/-1
            this.patrolTimer = 0;
            
            // Sometimes pause
            if (Math.random() < 0.3) { // Reduced pause chance
                if (this.body) {
                    this.setVelocity(0, 0);
                }
                return;
            }
        }

        // Move in the chosen direction (not random every frame)
        if (this.body) {
            const vx = Math.cos(this.patrolDirection) * this.VELOCITY * 0.6;
            const vy = Math.sin(this.patrolDirection) * this.VELOCITY * 0.6;
            
            this.setVelocity(vx, vy);
        }
    }

    private patrolStationary(): void {
        // Stationary enemies that only move when player is nearby
        const distanceToCenter = Phaser.Math.Distance.Between(
            this.x, this.y, 
            this.patrolCenter.x, this.patrolCenter.y
        );
        
        if (this.body) {
            // If too far from center, move back
            if (distanceToCenter > this.patrolRadius) {
                const dx = this.patrolCenter.x - this.x;
                const dy = this.patrolCenter.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const vx = (dx / distance) * this.VELOCITY * 0.3;
                    const vy = (dy / distance) * this.VELOCITY * 0.3;
                    this.setVelocity(vx, vy);
                }
            } else {
                // Small random movements to stay active
                if (this.patrolTimer > 3000) {
                    const vx = (Math.random() - 0.5) * this.VELOCITY * 0.2;
                    const vy = (Math.random() - 0.5) * this.VELOCITY * 0.2;
                    this.setVelocity(vx, vy);
                    this.patrolTimer = 0;
                } else {
                    this.setVelocity(0, 0);
                }
            }
        }
    }

    public pursuePlayer(): void {
        if (!this.player) return;

        // Update last known player position
        this.lastPlayerPosition = { x: this.player.x, y: this.player.y };

        // Use pathfinding if enabled and pathfinding system is available
        const scene = this.scene as any;
        if (this.pathfindingEnabled && scene.pathfinding) {
            // Check if we need to recalculate path
            if (this.currentPath.length === 0 || this.shouldRecalculatePath()) {
                const path = scene.pathfinding.findPath(this.x, this.y, this.player.x, this.player.y);
                this.setPath(path);
            }

            // Move along the path
            if (this.moveToWaypoint()) {
                return; // Successfully moving along path
            } else {
                // Path completed or failed, fall back to direct movement
                this.clearPath();
            }
        }

        // Fallback to direct pursuit
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && this.body) {
            // Enhanced pursuit with slight prediction
            const predictionFactor = 0.1; // Predict player movement
            const predictedX = this.player.x + (this.player.body?.velocity.x || 0) * predictionFactor;
            const predictedY = this.player.y + (this.player.body?.velocity.y || 0) * predictionFactor;

            const predDx = predictedX - this.x;
            const predDy = predictedY - this.y;
            const predDistance = Math.sqrt(predDx * predDx + predDy * predDy);

            if (predDistance > 0) {
                const vx = (predDx / predDistance) * this.VELOCITY;
                const vy = (predDy / predDistance) * this.VELOCITY;
                this.setVelocity(vx, vy);
            }
        }
    }

    private shouldRecalculatePath(): boolean {
        // Recalculate path if player has moved significantly
        if (this.currentPath.length === 0) return true;

        const lastWaypoint = this.currentPath[this.currentPath.length - 1];
        const distanceToTarget = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            lastWaypoint.x, lastWaypoint.y
        );

        return distanceToTarget > 50; // Recalculate if player moved more than 50 pixels
    }

    public flankPlayer(): void {
        if (!this.player) return;

        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && this.body) {
            // Flanking: approach from the side
            const angle = Math.atan2(dy, dx);
            const flankAngle = angle + (this.flankDirection * Math.PI / 2); // 90 degrees to the side

            const vx = Math.cos(flankAngle) * this.VELOCITY * 0.8;
            const vy = Math.sin(flankAngle) * this.VELOCITY * 0.8;
            this.setVelocity(vx, vy);
        }
    }

    public showAlertIndicator(): void {
        // Alert indicator disabled to prevent visual issues
        // The red circle was causing graphical problems
        return;
    }

    /**
     * Safely clean up alert indicator to prevent memory leaks
     */
    private cleanupAlertIndicator(): void {
        if (this.alertIndicator) {
            try {
                // Stop any active tweens on the indicator
                this.scene.tweens.killTweensOf(this.alertIndicator);
                this.alertIndicator.destroy();
            } catch (error) {
                // Error cleaning up alert indicator
            } finally {
                this.alertIndicator = null;
            }
        }
    }

    public performComboAttack(): void {
        if (!this.player || this.isAttackOnCooldown()) return;

        // Combo attack - multiple hits
        this.attackCooldown = true;

        // First hit with effects
        this.createAttackEffects();
        this.scene.sound.play('attack-light', { volume: 0.5 });

        this.scene.time.delayedCall(200, () => {
            if (this.player && this.isPlayerInAttackRange()) {
                // Use enhanced attack power if night stats are applied
                const damage = this.nightStatsApplied ? this.attackPower : GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE;
                this.player.takeDamage(damage);
                this.createPlayerDamageEffect();
            }
        });

        // Second hit after short delay
        this.scene.time.delayedCall(500, () => {
            if (this.player && this.isPlayerInAttackRange()) {
                // Create second attack effect
                this.createAttackEffects();
                this.scene.sound.play('attack-light', { volume: 0.3 });

                this.scene.time.delayedCall(200, () => {
                    if (this.player && this.isPlayerInAttackRange()) {
                        // Use enhanced attack power if night stats are applied (reduced for second hit)
                        const baseDamage = this.nightStatsApplied ? this.attackPower : GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE;
                        this.player.takeDamage(baseDamage * 0.7);
                        this.createPlayerDamageEffect();
                    }
                });
            }
        });

        // Reset cooldown
        this.scene.time.delayedCall(GameConfig.TIMING.ENEMY_ATTACK_DELAY * 1.5, () => {
            this.attackCooldown = false;
        });
    }

    public isPlayerInAttackRange(): boolean {
        if (!this.player) return false;

        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < GameConfig.DETECTION.ENEMY_ATTACK_RANGE;
    }

    public isPlayerInDetectionRange(): boolean {
        if (!this.player) return false;

        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.detectionDistance;
    }

    public getDistanceToPlayer(): number {
        if (!this.player) return Infinity;

        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public attackPlayer(): void {
        if (!this.player || this.isAttackOnCooldown()) return;

        // Set attack cooldown
        this.attackCooldown = true;

        // Create attack visual effects
        this.createAttackEffects();

        // Play attack sound
        this.scene.sound.play('attack-light', { volume: 0.5 });

        // Deal damage to player with slight delay for effect timing
        this.scene.time.delayedCall(200, () => {
            if (this.player && this.isPlayerInAttackRange()) {
                // Use enhanced attack power if night stats are applied
                const damage = this.nightStatsApplied ? this.attackPower : GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE;
                this.player.takeDamage(damage);
                this.createPlayerDamageEffect();
            }
        });

        // Reset cooldown after delay
        this.scene.time.delayedCall(GameConfig.TIMING.ENEMY_ATTACK_DELAY, () => {
            this.attackCooldown = false;
        });
    }

    private createAttackEffects(): void {
        // Simplified attack effects - removed slash and impact effects
        // Only keep screen shake for feedback
        
        // Create screen shake effect
        this.createScreenShake();
    }

    private createPlayerDamageEffect(): void {
        if (!this.player) return;

        // Calculate actual damage dealt
        const actualDamage = this.nightStatsApplied ? this.attackPower : GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE;

        // Create damage text effect
        const damageText = this.scene.add.bitmapText(
            this.player.x,
            this.player.y - 30,
            'pixel-red',
            `-${actualDamage}`,
            24
        ).setOrigin(0.5);

        // Animate damage text
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                damageText.destroy();
            }
        });

        // Create player hit flash effect
        const originalTint = this.player.tint;
        this.player.setTint(0xff0000); // Red flash

        this.scene.time.delayedCall(100, () => {
            this.player.setTint(originalTint);
        });

        // Blood splatter effect removed - using player's damage particles instead
        // this.createBloodSplatter();
    }

    // Blood splatter method removed - using player's damage particles instead
    // private createBloodSplatter(): void { ... }

    private createScreenShake(): void {
        // Get the main camera only - minimap camera should not be affected
        const camera = this.scene.cameras.main;
        
        // Store original scroll position
        const originalScrollX = camera.scrollX;
        const originalScrollY = camera.scrollY;

        // Create screen shake effect using scroll position instead of camera position
        this.scene.tweens.add({
            targets: camera,
            scrollX: originalScrollX + (Math.random() - 0.5) * 10,
            scrollY: originalScrollY + (Math.random() - 0.5) * 10,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                // Reset to original scroll position
                camera.setScroll(originalScrollX, originalScrollY);
            }
        });
    }



    public isAttackOnCooldown(): boolean {
        return this.attackCooldown;
    }

    /**
     * Get the appropriate walk animation name based on enemy type and direction
     */
    public getWalkAnimationName(direction?: string): string {
        if (this.isBoss) {
            return 'boss-1-walk';
        } else if (this.entity_type === 'Nepian Observer') {
            return 'enemy-2-walk';
        } else {
            // Use Orc Shaman run animations (replacing walk)
            return this.getOrcShamanRunAnimation(direction);
        }
    }

    /**
     * Get the appropriate idle animation name based on enemy type and direction
     */
    public getIdleAnimationName(direction?: string): string {
        if (this.isBoss) {
            return 'boss-1-idle';
        } else if (this.entity_type === 'Nepian Observer') {
            return 'enemy-2-idle';
        } else {
            // Use Orc Shaman idle animations
            return this.getOrcShamanIdleAnimation(direction);
        }
    }

    /**
     * Get the appropriate death animation name based on enemy type and direction
     */
    public getDeathAnimationName(direction?: string): string {
        if (this.isBoss) {
            return 'boss-1-death';
        } else if (this.entity_type === 'Nepian Observer') {
            return 'enemy-2-death';
        } else {
            // Use Orc Shaman death animations
            return this.getOrcShamanDeathAnimation(direction);
        }
    }

    /**
     * Get Orc Shaman idle animation based on direction
     */
    private getOrcShamanIdleAnimation(direction?: string): string {
        switch (direction) {
            case 'left':
                return 'orc-shaman-idle-left';
            case 'right':
                return 'orc-shaman-idle-right';
            case 'up':
                return 'orc-shaman-idle-up';
            case 'down':
                return 'orc-shaman-idle-down';
            default:
                return 'orc-shaman-idle-right';
        }
    }

    /**
     * Get Orc Shaman run animation based on direction
     */
    private getOrcShamanRunAnimation(direction?: string): string {
        switch (direction) {
            case 'left':
                return 'orc-shaman-run-left';
            case 'right':
                return 'orc-shaman-run-right';
            case 'up':
                return 'orc-shaman-run-up';
            case 'down':
                return 'orc-shaman-run-down';
            default:
                return 'orc-shaman-run-right';
        }
    }

    /**
     * Get Orc Shaman death animation based on direction
     */
    private getOrcShamanDeathAnimation(direction?: string): string {
        switch (direction) {
            case 'left':
                return 'orc-shaman-death-left';
            case 'right':
                return 'orc-shaman-death-right';
            default:
                return 'orc-shaman-death-right';
        }
    }

    /**
     * Determine direction based on velocity
     */
    public getDirectionFromVelocity(): string {
        if (!this.body) return this.lastDirection;
        
        const velocity = this.body.velocity;
        const absX = Math.abs(velocity.x);
        const absY = Math.abs(velocity.y);
        
        // If not moving, return last direction
        if (absX < 1 && absY < 1) {
            return this.lastDirection;
        }
        
        // Determine primary direction
        if (absX > absY) {
            // Horizontal movement
            this.lastDirection = velocity.x > 0 ? 'right' : 'left';
        } else {
            // Vertical movement
            this.lastDirection = velocity.y > 0 ? 'down' : 'up';
        }
        
        // Debug logging
        console.log(`Enemy direction: ${this.lastDirection}, velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)})`);
        
        return this.lastDirection;
    }

    /**
     * Safely play animation with validation
     */
    public safePlayAnimation(animationName: string, ignoreIfMissing: boolean = false): boolean {
        if (this.anims.exists(animationName)) {
            this.anims.play(animationName, true);
            return true;
        } else {
            if (!ignoreIfMissing) {
                // Animation not found
            }
            return false;
        }
    }
}
