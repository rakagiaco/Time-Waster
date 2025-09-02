import Phaser from 'phaser';
import { Entity } from './Entity';
import { Inventory } from './Inventory';
import { StateMachine, State } from '../../lib/StateMachine';
import { updatePlayerMovement } from '../../lib/HelperFunc';
import GameConfig from '../config/GameConfig';
import { keyUp, keyDown, keyLeft, keyRight, keyAttackLight, keyAttackHeavy, keySprint } from '../input/InputManager';

// Player States
class PlayerIdleState extends State {
    enter(_scene: Phaser.Scene, player: Player): void {
        player.setVelocity(0, 0);
        
        // Check if animation exists before playing
        if (player.anims.exists('player-walk-down')) {
            player.anims.play('player-walk-down', true);
            player.anims.stop();
        } else {
            console.warn('Animation "player-walk-down" not found');
        }
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Check for movement input (with null checks)
        if ((keyUp && keyUp.isDown) || (keyDown && keyDown.isDown) || (keyLeft && keyLeft.isDown) || (keyRight && keyRight.isDown)) {
            player.animsFSM.transition('walking');
        }
        
        // Check for attack input (with null checks)
        if (keyAttackLight && keyAttackLight.isDown && !player.attackLightCooldown) {
            player.animsFSM.transition('attacking-light');
        }
        
        if (keyAttackHeavy && keyAttackHeavy.isDown && !player.attackHeavyCooldown) {
            player.animsFSM.transition('attacking-heavy');
        }
    }
}

class PlayerWalkingState extends State {
    enter(_scene: Phaser.Scene, _player: Player): void {
        // State entered when movement keys are pressed
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Handle movement (with null checks)
        if (keyUp && keyDown && keyLeft && keyRight) {
            updatePlayerMovement(player, keyUp, keyDown, keyLeft, keyRight);
        } else {
            // If keys aren't ready yet, just stop movement
            player.setVelocity(0, 0);
        }
        
        // Check for sprint
        if (keySprint && keySprint.isDown && !player.sprintCooldown) {
            player.animsFSM.transition('sprinting');
        }
        
        // Check if no movement keys are pressed
        if ((!keyUp || !keyUp.isDown) && (!keyDown || !keyDown.isDown) && (!keyLeft || !keyLeft.isDown) && (!keyRight || !keyRight.isDown)) {
            player.animsFSM.transition('idle');
        }
        
        // Check for attack input
        if (keyAttackLight && keyAttackLight.isDown && !player.attackLightCooldown) {
            player.animsFSM.transition('attacking-light');
        }
        
        if (keyAttackHeavy && keyAttackHeavy.isDown && !player.attackHeavyCooldown) {
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
        // Handle sprint movement (faster) - with null checks
        if (keyUp && keyDown && keyLeft && keyRight) {
            updatePlayerMovement(player, keyUp, keyDown, keyLeft, keyRight, true);
        } else {
            // If keys aren't ready yet, just stop movement
            player.setVelocity(0, 0);
        }
        
        // Check if sprint key is released
        if (!keySprint || !keySprint.isDown) {
            player.animsFSM.transition('walking');
        }
        
        // Check if no movement keys are pressed
        if ((!keyUp || !keyUp.isDown) && (!keyDown || !keyDown.isDown) && (!keyLeft || !keyLeft.isDown) && (!keyRight || !keyRight.isDown)) {
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
        
        // Check if animation exists before playing
        if (player.anims.exists('player-heavy-attack')) {
            player.anims.play('player-heavy-attack', true);
        } else {
            console.warn('Animation "player-heavy-attack" not found');
        }
        
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
    public p1Inventory!: Inventory;
    public questStatus: any;
    public animsFSM!: StateMachine;
    public windowOpen: boolean = false;
    public currentWindow: any = { objs: [] };
    
    public attackLightCooldown: boolean = false;
    public attackHeavyCooldown: boolean = false;
    public sprintCooldown: boolean = false;


    constructor(scene: Phaser.Scene, x: number, y: number, inventory?: any, questData?: any) {
        try {
            console.log('=== PLAYER CONSTRUCTOR START ===');
            console.log('Scene:', scene);
            console.log('Position:', x, y);
            console.log('Inventory:', inventory);
            console.log('Quest data:', questData);
            
            super(scene, x, y, 'player');
            console.log('Player sprite created successfully');
            
            // Initialize inventory
            console.log('Initializing inventory...');
            this.p1Inventory = new Inventory();
            if (inventory) {
                this.p1Inventory.loadFromData(inventory);
            }
            console.log('Inventory initialized successfully');
            
            // Initialize quest status
            console.log('Initializing quest status...');
            this.questStatus = questData || { finished: false, currentQuest: null };
            console.log('Quest status initialized successfully');
            
            // Setup state machine
            console.log('Setting up state machine...');
            this.setupStateMachine();
            console.log('State machine setup successfully');
            
            // Setup physics
            console.log('Setting up physics...');
            this.setupPhysics();
            console.log('Physics setup successfully');
            
            // Setup input
            console.log('Setting up input...');
            this.setupInput();
            console.log('Input setup successfully');
            
            // Initialize health bar after everything else is set up
            console.log('Initializing health bar...');
            this.initializeHealthBar();
            console.log('Health bar initialized successfully');
            
            console.log('=== PLAYER CONSTRUCTOR COMPLETE ===');
        } catch (error) {
            console.error('=== CRITICAL ERROR IN PLAYER CONSTRUCTOR ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('===========================================');
        }
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
