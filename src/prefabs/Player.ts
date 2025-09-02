import Phaser from 'phaser';
import { Entity } from './Entity';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { StateMachine, State } from '../../lib/StateMachine';
import { updatePlayerMovement } from '../../lib/HelperFunc';
import GameConfig from '../config/GameConfig';


export let keyUp: Phaser.Input.Keyboard.Key;
export let keyDown: Phaser.Input.Keyboard.Key;
export let keyLeft: Phaser.Input.Keyboard.Key;
export let keyRight: Phaser.Input.Keyboard.Key;
export let keyAttackLight: Phaser.Input.Keyboard.Key;
export let keyAttackHeavy: Phaser.Input.Keyboard.Key;
export let keyInventory: Phaser.Input.Keyboard.Key;
export let keySprint: Phaser.Input.Keyboard.Key;
export let keyInteract: Phaser.Input.Keyboard.Key;

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
            console.log("here")
            player.animsFSM.transition('walking');
        }

        // Check for attack input (with null checks)
        if (keyAttackLight && keyAttackLight.isDown && !player.attackLightCooldown) {
            player.animsFSM.transition('attacking-light');
        }

        if (keyAttackHeavy && keyAttackHeavy.isDown && !player.attackHeavyCooldown) {
            player.animsFSM.transition('attacking-heavy');
        }

        // Check for proximity pickup input
        if (keyInteract && keyInteract.isDown && !player.pickupCooldown) {
            player.performProximityPickup();
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

        // Check for proximity pickup input
        if (keyInteract && keyInteract.isDown && !player.pickupCooldown) {
            player.performProximityPickup();
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
    public pickupCooldown: boolean = false;


    constructor(scene: Phaser.Scene, x: number, y: number, inventory?: any, questData?: any) {
        super(scene, x, y, 'player');
        try {
            console.log('=== PLAYER CONSTRUCTOR START ===');
            console.log('Scene:', scene);
            console.log('Position:', x, y);
            console.log('Inventory:', inventory);
            console.log('Quest data:', questData);

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
            this.initializeInputKeys(scene);
            console.log('Input setup successfully');

            // health bar
            this.setupHealthBar()

            // player size
            this.setScale(GameConfig.SCALE.PLAYER)

            console.log('=== PLAYER CONSTRUCTOR COMPLETE ===');
        } catch (error) {
            console.error('=== CRITICAL ERROR IN PLAYER CONSTRUCTOR ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('===========================================');
        }
    }

    private setupHealthBar(): void {
        // Initialize health bar after everything else is set up
        console.log('Initializing health bar...');
        this.initializeHealthBar();

        // jank for now need to fix
        this.healthBar.setScrollFactor(0)
        this.healthBarText.setAlpha(0) // hide the text on players ? preference thing...
        this.healthBar.setX(GameConfig.UI.HEALTH_BAR_OFFSET_X);
        this.healthBar.setY(GameConfig.UI.HEALTH_BAR_OFFSET_Y);
        console.log('Health bar initialized successfully');
    }
    // Initialize keys after game is created
    private initializeInputKeys(scene: Phaser.Scene): void {

        const keyboard = scene.input.keyboard
        if (keyboard) {
            keyUp = keyboard.addKey("W")
            keyDown = (keyboard as any).addKey('S');
            keyLeft = (keyboard as any).addKey('A');
            keyRight = (keyboard as any).addKey('D');
            keyAttackLight = (keyboard as any).addKey('ONE');
            keyAttackHeavy = (keyboard as any).addKey('TWO');
            keyInventory = (keyboard as any).addKey('I');
            keySprint = (keyboard as any).addKey('SHIFT');
            keyInteract = (keyboard as any).addKey('E');

            console.log('Input keys initialized successfully');
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

    public update(): void {
        // Update state machine
        this.animsFSM.step();

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

    public getPosition(): [number, number] {
        return [this.x, this.y];
    }

    public heal(amount: number): void {
        this.HIT_POINTS = Math.min(this.HIT_POINTS + amount, this.MAX_HIT_POINTS);
        console.log(`Player healed for ${amount} HP. Current HP: ${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`);
    }

    public getQuestStatus(): any {
        return this.questStatus;
    }

    public setQuestStatus(status: any): void {
        this.questStatus = status;
    }

    public performProximityPickup(): void {
        const pickupRadius = 60; // Proximity radius for pickup
        let itemsCollected = 0;

        // Set pickup cooldown
        this.pickupCooldown = true;
        this.scene.time.delayedCall(1000, () => { // 1 second cooldown
            this.pickupCooldown = false;
        });

        // Find all collectible items in the scene
        this.scene.children.list.forEach(child => {
            if (child instanceof Item) {
                const item = child as Item;
                const distance = Phaser.Math.Distance.Between(this.x, this.y, item.x, item.y);
                
                if (distance <= pickupRadius) {
                    // Check if it's a fruit item
                    const itemType = item.getItemType();
                    if (this.isFruitItem(itemType)) {
                        // Add to inventory
                        this.p1Inventory.add(itemType, 1);
                        
                        // Play collection sound
                        const soundEffect = item.getSoundEffect();
                        if (soundEffect) {
                            this.scene.sound.play(soundEffect.sound, { volume: soundEffect.volume });
                        }
                        
                        // Show pickup feedback
                        this.showPickupFeedback(itemType, item.x, item.y);
                        
                        // Destroy the item
                        item.destroy();
                        itemsCollected++;
                    }
                }
            }
        });

        // Show general pickup feedback if items were collected
        if (itemsCollected > 0) {
            console.log(`Collected ${itemsCollected} items via proximity pickup`);
        } else {
            console.log('No items found in pickup range');
        }
    }

    private isFruitItem(itemType: string): boolean {
        const fruitTypes = ['apple', 'pinecone', 'ancient-fruit', 'cherry', 'fruit'];
        return fruitTypes.includes(itemType);
    }

    private showPickupFeedback(itemType: string, x: number, y: number): void {
        // Create floating text showing item pickup
        const pickupText = this.scene.add.bitmapText(
            x + Phaser.Math.Between(-10, 10),
            y - 20,
            'pixel-white',
            `+${itemType}`,
            12
        );
        pickupText.setOrigin(0.5);

        // Animate the text floating up and fading out
        this.scene.tweens.add({
            targets: pickupText,
            y: pickupText.y - 20,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                pickupText.destroy();
            }
        });
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
