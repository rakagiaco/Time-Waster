import Phaser from 'phaser';
import { Entity } from './Entity';
import { Inventory } from './Inventory';
import { StateMachine, State } from '../../lib/StateMachine';
import { updatePlayerMovement } from '../../lib/HelperFunc';
import GameConfig from '../config/GameConfig';
import { keyUp, keyDown, keyLeft, keyRight, keyAttackLight, keyAttackHeavy, keySprint } from '../main';

// Player States
class PlayerIdleState extends State {
    enter(_scene: Phaser.Scene, player: Player): void {
        player.setVelocity(0, 0);
        player.anims.play('player-walk-down', true);
        player.anims.stop();
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Check for movement input
        if (keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown) {
            player.animsFSM.transition('walking');
        }
        
        // Check for attack input
        if (keyAttackLight.isDown && !player.attackLightCooldown) {
            player.animsFSM.transition('attacking-light');
        }
        
        if (keyAttackHeavy.isDown && !player.attackHeavyCooldown) {
            player.animsFSM.transition('attacking-heavy');
        }
    }
}

class PlayerWalkingState extends State {
    enter(_scene: Phaser.Scene, _player: Player): void {
        // State entered when movement keys are pressed
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Handle movement
        updatePlayerMovement(player, keyUp, keyDown, keyLeft, keyRight);
        
        // Check for sprint
        if (keySprint.isDown && !player.sprintCooldown) {
            player.animsFSM.transition('sprinting');
        }
        
        // Check if no movement keys are pressed
        if (!keyUp.isDown && !keyDown.isDown && !keyLeft.isDown && !keyRight.isDown) {
            player.animsFSM.transition('idle');
        }
        
        // Check for attack input
        if (keyAttackLight.isDown && !player.attackLightCooldown) {
            player.animsFSM.transition('attacking-light');
        }
        
        if (keyAttackHeavy.isDown && !player.attackHeavyCooldown) {
            player.animsFSM.transition('attacking-heavy');
        }
    }
}

class PlayerSprintingState extends State {
    enter(scene: Phaser.Scene, player: Player): void {
        player.sprintCooldown = true;
        scene.time.delayedCall(GameConfig.TIMING.SPRINT_INTERVAL, () => {
            player.sprintCooldown = false;
        });
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Handle sprint movement (faster)
        updatePlayerMovement(player, keyUp, keyDown, keyLeft, keyRight, true);
        
        // Check if sprint key is released
        if (!keySprint.isDown) {
            player.animsFSM.transition('walking');
        }
        
        // Check if no movement keys are pressed
        if (!keyUp.isDown && !keyDown.isDown && !keyLeft.isDown && !keyRight.isDown) {
            player.animsFSM.transition('idle');
        }
    }
}

class PlayerAttackingLightState extends State {
    enter(scene: Phaser.Scene, player: Player): void {
        player.attackLightCooldown = true;
        
        // Check if animation exists before playing
        if (player.anims.exists('player-light-attack')) {
            player.anims.play('player-light-attack', true);
        } else {
            console.warn('Animation "player-light-attack" not found');
        }
        
        // Play attack sound
        scene.sound.play('attack-light', { volume: 0.5 });
        
        // Set cooldown
        scene.time.delayedCall(GameConfig.TIMING.ATTACK_LIGHT_COOLDOWN, () => {
            player.attackLightCooldown = false;
        });
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Check if animation is complete
        if (!player.anims.isPlaying) {
            player.animsFSM.transition('idle');
        }
    }
}

class PlayerAttackingHeavyState extends State {
    enter(scene: Phaser.Scene, player: Player): void {
        player.attackHeavyCooldown = true;
        player.anims.play('player-heavy-attack', true);
        
        // Play attack sound
        scene.sound.play('attack-heavy', { volume: 0.5 });
        
        // Set cooldown
        scene.time.delayedCall(GameConfig.TIMING.ATTACK_HEAVY_COOLDOWN, () => {
            player.attackHeavyCooldown = false;
        });
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Check if animation is complete
        if (!player.anims.isPlaying) {
            player.animsFSM.transition('idle');
        }
    }
}

export class Player extends Entity {
    public p1Inventory: Inventory;
    public questStatus: any;
    public animsFSM!: StateMachine;
    public windowOpen: boolean = false;
    public currentWindow: any = { objs: [] };
    
    public attackLightCooldown: boolean = false;
    public attackHeavyCooldown: boolean = false;
    public sprintCooldown: boolean = false;


    constructor(scene: Phaser.Scene, x: number, y: number, inventory?: any, questData?: any) {
        super(scene, x, y, 'player');
        
        // Initialize inventory
        this.p1Inventory = new Inventory();
        if (inventory) {
            this.p1Inventory.loadFromData(inventory);
        }
        
        // Initialize quest status
        this.questStatus = questData || { finished: false, currentQuest: null };
        
        // Setup state machine
        this.setupStateMachine();
        
        // Setup physics
        this.setupPhysics();
        
        // Setup input
        this.setupInput();
    }

    private setupStateMachine(): void {
        const states = {
            'idle': new PlayerIdleState(),
            'walking': new PlayerWalkingState(),
            'sprinting': new PlayerSprintingState(),
            'attacking-light': new PlayerAttackingLightState(),
            'attacking-heavy': new PlayerAttackingHeavyState()
        };
        
        this.animsFSM = new StateMachine('idle', states, [this.scene, this]);
    }

    private setupPhysics(): void {
        this.setCollideWorldBounds(true);
        this.setSize(16, 16);
        this.setOffset(8, 16);
    }

    private setupInput(): void {
        // Input keys are imported from main.ts
    }

    public update(): void {
        // Update state machine
        this.animsFSM.step();
        
        // Update health bar position
        this.updateHealthBar();
    }

    public takeDamage(amount: number): void {
        super.takeDamage(amount);
        
        // Play damage sound
        this.scene.sound.play('enemy-hit', { volume: 0.5 });
        
        // Check if player is dead
        if (this.isDead()) {
            this.scene.scene.start('GameOver');
        }
    }

    protected die(): void {
        // Player death logic
        this.scene.scene.start('GameOver');
    }

    public getInventory(): Inventory {
        return this.p1Inventory;
    }

    public getQuestStatus(): any {
        return this.questStatus;
    }

    public setQuestStatus(status: any): void {
        this.questStatus = status;
    }

    public saveGame(): void {
        // Save quest status
        if (this.questStatus) {
            window.localStorage.setItem('existing_quest', JSON.stringify(this.questStatus));
        }
        
        // Save inventory
        if (this.p1Inventory) {
            window.localStorage.setItem('existing_inv', JSON.stringify(this.p1Inventory.getData()));
        }
    }
}
