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
        enemy.anims.play('enemy-1-walk', true);
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        // Check if player is detected
        if (listen(scene as any, enemy)) {
            enemy.animsFSM.transition('pursuing');
        }
        
        // Simple patrol movement
        enemy.patrol();
    }
}

class EnemyPursuingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.anims.play('enemy-1-walk', true);
    }

    execute(scene: Phaser.Scene, enemy: Enemy): void {
        // Move towards player
        enemy.pursuePlayer();
        
        // Check if player is out of range
        if (!listen(scene as any, enemy)) {
            enemy.animsFSM.transition('patrolling');
        }
        
        // Check if close enough to attack
        if (enemy.isPlayerInAttackRange()) {
            enemy.animsFSM.transition('attacking');
        }
    }
}

class EnemyAttackingState extends State {
    enter(_scene: Phaser.Scene, enemy: Enemy): void {
        enemy.attackPlayer();
    }

    execute(_scene: Phaser.Scene, enemy: Enemy): void {
        // Attack cooldown
        if (!enemy.isAttackOnCooldown()) {
            enemy.animsFSM.transition('pursuing');
        }
    }
}

class EnemyDeadState extends State {
    enter(scene: Phaser.Scene, enemy: Enemy): void {
        enemy.anims.play('enemy-1-death', true);
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
    private patrolDirection: number = 1;
    private patrolTimer: number = 0;
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
    public entity_text!: Phaser.GameObjects.BitmapText;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'enemy-1');
        
        // Set enemy-specific properties
        this.HIT_POINTS = 50;
        this.MAX_HIT_POINTS = 50;
        this.VELOCITY = GameConfig.MOVEMENT.ENEMY_BASE_VELOCITY;
        
        // Setup state machine
        this.setupStateMachine();
        
        // Setup physics
        this.setupPhysics();
        
        // Find player reference
        this.findPlayer();
    }

    private setupStateMachine(): void {
        const states = {
            'patrolling': new EnemyPatrolState(),
            'pursuing': new EnemyPursuingState(),
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
        // Find player in the scene
        this.player = this.scene.children.getByName('player') || this.scene.children.getByName('Player');
    }

    public update(): void {
        // Update state machine
        this.animsFSM.step();
        
        // Update health bar position
        this.updateHealthBar();
        
        // Update patrol timer
        this.patrolTimer += this.scene.game.loop.delta;
    }

    public reset(): void {
        this.HIT_POINTS = this.MAX_HIT_POINTS;
        this.isAttacking = false;
        this.alpha = 1;
        this.animsFSM.transition('patrolling');
    }

    public loot(): void {
        if (this.animsFSM.state === 'dead' && !this.looted) {
            let x: any = undefined;
            
            if (this.entity_type === 'Electro Lord Kealthis') { // the boss
                x = new Item(this.scene, this.x, this.y, 'Frozen Heart').setAlpha(0);
            } else if (this.entity_type === 'Nepian Observer' && this.is_lootable) {
                x = new Item(this.scene, this.x, this.y, 'lesser nepian blood').setScale(0.5).setAlpha(0);
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
        // Simple patrol movement
        if (this.patrolTimer > 2000) {
            this.patrolDirection *= -1;
            this.patrolTimer = 0;
        }
        
        this.setVelocityX(this.VELOCITY * this.patrolDirection);
    }

    public pursuePlayer(): void {
        if (!this.player) return;
        
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const vx = (dx / distance) * this.VELOCITY;
            const vy = (dy / distance) * this.VELOCITY;
            this.setVelocity(vx, vy);
        }
    }

    public isPlayerInAttackRange(): boolean {
        if (!this.player) return false;
        
        const dx = this.player.x - this.x;
        const dy = this.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < GameConfig.DETECTION.ENEMY_ATTACK_RANGE;
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
