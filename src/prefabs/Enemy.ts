import Phaser from 'phaser';
import { Entity } from './Entity';
import { StateMachine, State } from '../../lib/StateMachine';
import { listen, createLootInterfaceWindow } from '../../lib/HelperFunc';
import GameConfig from '../config/GameConfig';
import { Item } from './Item';

// Enemy States
class EnemyPatrolState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.setVelocity(0, 0);
        enemy.patrolTimer = 0;
        enemy.patrolDirection = Math.random() > 0.5 ? 1 : -1; // Random initial direction
        
        // Check if animation exists before playing
        if (enemy.anims.exists('enemy-1-walk')) {
            enemy.anims.play('enemy-1-walk', true);
        } else {
            console.warn('Animation "enemy-1-walk" not found');
        }
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        // Check if player is detected (with safety check)
        try {
            if (listen(scene as any, enemy)) {
                console.log(`Enemy ${enemy.entity_type} detected player, transitioning to alert`);
                enemy.animsFSM.transition('alert');
                return;
            }
        } catch (error) {
            console.warn('Error in listen function for enemy patrolling:', error);
        }
        
        // Enhanced patrol movement with more dynamic behavior
        enemy.patrol();
    }
}

class EnemyAlertState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.setVelocity(0, 0);
        enemy.alertTimer = 0;
        
        // Play alert animation or sound
        if (enemy.anims.exists('enemy-1-idle')) {
            enemy.anims.play('enemy-1-idle', true);
        }
        
        // Show alert indicator (could be a visual effect)
        enemy.showAlertIndicator();
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.alertTimer += scene.game.loop.delta;
        
        // Check if player is still in detection range
        try {
            if (!listen(scene as any, enemy)) {
                console.log(`Enemy ${enemy.entity_type} lost player, returning to patrol`);
                enemy.animsFSM.transition('patrolling');
                return;
            }
        } catch (error) {
            console.warn('Error in listen function for enemy alert:', error);
        }
        
        // After alert period, transition to pursuing
        if (enemy.alertTimer > 500) { // 0.5 second alert period
            console.log(`Enemy ${enemy.entity_type} transitioning from alert to pursuing`);
            enemy.animsFSM.transition('pursuing');
        }
    }
}

class EnemyPursuingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.pursuitTimer = 0;
        enemy.lastPlayerPosition = { x: 0, y: 0 };
        
        // Check if animation exists before playing
        if (enemy.anims.exists('enemy-1-walk')) {
            enemy.anims.play('enemy-1-walk', true);
        } else {
            console.warn('Animation "enemy-1-walk" not found');
        }
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.pursuitTimer += scene.game.loop.delta;
        
        // Check if player is out of range (with safety check)
        try {
            if (!listen(scene as any, enemy)) {
                enemy.animsFSM.transition('searching');
                return;
            }
        } catch (error) {
            console.warn('Error in listen function for enemy pursuing:', error);
        }
        
        // Check if close enough to attack
        if (enemy.isPlayerInAttackRange()) {
            enemy.animsFSM.transition('attacking');
            return;
        }
        
        // Enhanced pursuit with pathfinding-like behavior
        enemy.pursuePlayer();
        
        // If pursuing for too long without reaching player, try different approach
        if (enemy.pursuitTimer > 5000) { // 5 seconds
            enemy.animsFSM.transition('flanking');
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
        if (enemy.anims.exists('enemy-1-idle')) {
            enemy.anims.play('enemy-1-idle', true);
        }
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.searchTimer += scene.game.loop.delta;
        
        // Check if player is detected again
        try {
            if (listen(scene as any, enemy)) {
                enemy.animsFSM.transition('pursuing');
                return;
            }
        } catch (error) {
            console.warn('Error in listen function for enemy searching:', error);
        }
        
        // Search behavior - move towards last known position
        if (enemy.lastKnownPlayerPosition) {
            const dx = enemy.lastKnownPlayerPosition.x - enemy.x;
            const dy = enemy.lastKnownPlayerPosition.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                const vx = (dx / distance) * (enemy.getVelocity() * 0.5); // Slower search speed
                const vy = (dy / distance) * (enemy.getVelocity() * 0.5);
                enemy.setVelocity(vx, vy);
            } else {
                // Reached last known position, give up and patrol
                enemy.animsFSM.transition('patrolling');
            }
        } else {
            // No last known position, just patrol
            enemy.animsFSM.transition('patrolling');
        }
        
        // Give up searching after a while
        if (enemy.searchTimer > 3000) { // 3 seconds
            enemy.animsFSM.transition('patrolling');
        }
    }
}

class EnemyFlankingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.flankTimer = 0;
        enemy.flankDirection = Math.random() > 0.5 ? 1 : -1;
        
        // Play different animation for flanking
        if (enemy.anims.exists('enemy-1-walk')) {
            enemy.anims.play('enemy-1-walk', true);
        }
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.flankTimer += scene.game.loop.delta;
        
        // Check if player is out of range
        try {
            if (!listen(scene as any, enemy)) {
                enemy.animsFSM.transition('patrolling');
                return;
            }
        } catch (error) {
            console.warn('Error in listen function for enemy flanking:', error);
        }
        
        // Check if close enough to attack
        if (enemy.isPlayerInAttackRange()) {
            enemy.animsFSM.transition('attacking');
            return;
        }
        
        // Flanking behavior - try to approach from the side
        enemy.flankPlayer();
        
        // Return to normal pursuit after flanking attempt
        if (enemy.flankTimer > 2000) { // 2 seconds
            enemy.animsFSM.transition('pursuing');
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
            enemy.animsFSM.transition('pursuing');
            return;
        }
        
        // Check if player is out of detection range
        try {
            if (!listen(scene as any, enemy)) {
                enemy.animsFSM.transition('patrolling');
                return;
            }
        } catch (error) {
            console.warn('Error in listen function for enemy attacking:', error);
        }
        
        // Attack cooldown and combo system
        if (!enemy.isAttackOnCooldown()) {
            // Chance for combo attack
            if (enemy.attackTimer > 1000 && Math.random() < 0.3) {
                enemy.performComboAttack();
            } else {
                enemy.animsFSM.transition('pursuing');
            }
        }
    }
}

class EnemyDeadState extends State {
    enter(scene: Phaser.Scene, enemy: Enemy): void {
        // Check if animation exists before playing
        if (enemy.anims.exists('enemy-1-death')) {
            enemy.anims.play('enemy-1-death', true);
        } else {
            console.warn('Animation "enemy-1-death" not found');
        }
        
        enemy.setVelocity(0, 0);
        
        // Set death timer
        scene.time.delayedCall(GameConfig.TIMING.ENEMY_DEATH_DELAY, () => {
            enemy.animsFSM.transition('fading');
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
                enemy.animsFSM.transition('reviving');
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
            enemy.animsFSM.transition('patrolling');
        });
    }

    execute(_scene: Phaser.Scene, _enemy: Enemy): void {
        // Wait for revive timer
    }
}

export class Enemy extends Entity {
    public animsFSM!: StateMachine;
    private player: any;
    public patrolDirection: number = 1;
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
    public FSM: any; // StateMachine
    public INTERVAL_ID: any;
    
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

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        // Set enemy-specific properties
        this.HIT_POINTS = 50;
        this.MAX_HIT_POINTS = 50;
        this.VELOCITY = GameConfig.MOVEMENT.ENEMY_BASE_VELOCITY;
        
        // Set detection distance based on enemy type
        this.setDetectionDistance();
        
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

    private setupStateMachine(): void {
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
    }

    private setupPhysics(): void {
        this.setCollideWorldBounds(false);
        this.setSize(16, 16);
        this.setOffset(8, 8);
    }

    private findPlayer(): void {
        // Find player in the scene - try multiple approaches
        this.player = this.scene.children.getByName('player') || 
                     this.scene.children.getByName('Player') ||
                     (this.scene as any).player ||
                     (this.scene as any).p1;
        
        // If still not found, search through all children
        if (!this.player) {
            this.scene.children.list.forEach(child => {
                if (child.constructor.name === 'Player') {
                    this.player = child;
                }
            });
        }
        
        console.log('Enemy found player:', !!this.player, this.player?.constructor.name);
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
                        enemy.animsFSM.transition('alert');
                    }
                }
            });
        }
    }

    public reset(): void {
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
        if (this.alertIndicator) {
            this.alertIndicator.destroy();
            this.alertIndicator = null;
        }
        
        this.animsFSM.transition('patrolling');
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
        // Enemy death logic is handled by state machine
    }

    public patrol(): void {
        // Enhanced patrol movement with more dynamic behavior
        if (this.patrolTimer > 2000 + Math.random() * 1000) { // Random patrol duration
            this.patrolDirection *= -1;
            this.patrolTimer = 0;
            
            // Occasionally pause during patrol
            if (Math.random() < 0.3) {
                this.setVelocity(0, 0);
                return;
            }
        }
        
        // Add slight vertical movement for more natural patrol
        const verticalMovement = Math.sin(this.patrolTimer * 0.001) * 10;
        this.setVelocity(this.VELOCITY * 0.7 * this.patrolDirection, verticalMovement);
    }

    public pursuePlayer(): void {
        if (!this.player) return;
        
        // Update last known player position
        this.lastPlayerPosition = { x: this.player.x, y: this.player.y };
        
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
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
    
    public flankPlayer(): void {
        if (!this.player) return;
        
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Flanking: approach from the side
            const angle = Math.atan2(dy, dx);
            const flankAngle = angle + (this.flankDirection * Math.PI / 2); // 90 degrees to the side
            
            const vx = Math.cos(flankAngle) * this.VELOCITY * 0.8;
            const vy = Math.sin(flankAngle) * this.VELOCITY * 0.8;
            this.setVelocity(vx, vy);
        }
    }
    
    public showAlertIndicator(): void {
        if (this.alertIndicator) {
            this.alertIndicator.destroy();
        }
        
        // Create a small visual indicator above the enemy
        this.alertIndicator = this.scene.add.graphics();
        this.alertIndicator.fillStyle(0xff0000, 0.8);
        this.alertIndicator.fillCircle(0, -30, 3);
        this.alertIndicator.setDepth(1000);
        
        // Make it follow the enemy
        this.scene.tweens.add({
            targets: this.alertIndicator,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                if (this.alertIndicator) {
                    this.alertIndicator.destroy();
                    this.alertIndicator = null;
                }
            }
        });
    }
    
    public performComboAttack(): void {
        if (!this.player || this.isAttackOnCooldown()) return;
        
        // Combo attack - multiple hits
        this.attackCooldown = true;
        
        // First hit
        this.player.takeDamage(GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE);
        this.scene.sound.play('attack-light', { volume: 0.5 });
        
        // Second hit after short delay
        this.scene.time.delayedCall(300, () => {
            if (this.player && this.isPlayerInAttackRange()) {
                this.player.takeDamage(GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE * 0.7);
                this.scene.sound.play('attack-light', { volume: 0.3 });
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
        
        // Deal damage to player
        this.player.takeDamage(GameConfig.COMBAT.ENEMY_ATTACK_DAMAGE);
        
        // Play attack sound
        this.scene.sound.play('attack-light', { volume: 0.5 });
        
        // Reset cooldown after delay
        this.scene.time.delayedCall(GameConfig.TIMING.ENEMY_ATTACK_DELAY, () => {
            this.attackCooldown = false;
        });
    }

    public isAttackOnCooldown(): boolean {
        return this.attackCooldown;
    }

    // Reset method is already defined above
}
