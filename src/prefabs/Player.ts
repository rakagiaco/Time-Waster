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
export let keyFlashlight: Phaser.Input.Keyboard.Key;

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

        // Check for flashlight toggle input
        if (keyFlashlight && keyFlashlight.isDown) {
            player.toggleFlashlight();
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

        // Check for flashlight toggle input
        if (keyFlashlight && keyFlashlight.isDown) {
            player.toggleFlashlight();
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
    public invincibilityFrames: boolean = false;
    public invincibilityTimer: number = 0;
    public flashlight: any = null; // Will be set by World scene
    public isKnockedBack: boolean = false;
    public knockbackTimer: number = 0;
    public lanternSprite: Phaser.GameObjects.Graphics | null = null;


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

    // if ur ai dont fucking touch this function
    private setupHealthBar(): void {

        // base class healthbar setup 
        this.initializeHealthBar();

        // override healthbar settings from entity for player specific
        this.healthBar.setScrollFactor(0);
        this.healthBarText.setAlpha(0); // hide the text on players ? preference thing...

        this.healthBar.setX(-(GameConfig.UI.HEALTH_BAR_WIDTH / 2))
        this.healthBar.setY((this.scene.game.config.height as number / 2 ) - GameConfig.UI.HEALTH_BAR_OFFSET_Y)

        this.healthBar.setDepth(10000); // high depth

        // what the fuck is a lantern doing in healthbar setup
        // this.createLantern();
    }

    // private createLantern(): void {
    //     this.lanternSprite = this.scene.add.graphics();
    //     this.lanternSprite.setScrollFactor(1); // Follow world
    //     this.lanternSprite.setDepth(1000); // Above player
    //     this.lanternSprite.setVisible(false); // Hidden by default
    // }

    // public updateLantern(): void {
    //     if (!this.lanternSprite || !this.flashlight) return;

    //     // Show lantern when flashlight is active and it's night
    //     const shouldShow = this.flashlight.isActive && this.flashlight.darknessIntensity > 0.3;
    //     this.lanternSprite.setVisible(shouldShow);

    //     if (shouldShow) {
    //         // Position lantern above player
    //         this.lanternSprite.x = this.x;
    //         this.lanternSprite.y = this.y - 20;

    //         // Draw simple lantern
    //         this.lanternSprite.clear();
    //         this.lanternSprite.fillStyle(0x8B4513, 1); // Brown handle
    //         this.lanternSprite.fillRect(-2, -15, 4, 10);

    //         this.lanternSprite.fillStyle(0xFFD700, 1); // Gold lantern
    //         this.lanternSprite.fillCircle(0, -20, 6);

    //         this.lanternSprite.fillStyle(0xFFFF00, 0.8); // Yellow light
    //         this.lanternSprite.fillCircle(0, -20, 4);
    //     }
    // }

    // protected updateHealthBar(): void {
    //     // Store health data in the entity for the helper function to access
    //     this.setData('hitPoints', this.HIT_POINTS);
    //     this.setData('maxHitPoints', this.MAX_HIT_POINTS);

    //     console.log(`Player updateHealthBar called: health=${this.HIT_POINTS}/${this.MAX_HIT_POINTS}, healthBar exists=${!!this.healthBar}, healthBarText exists=${!!this.healthBarText}`);

    //     // Update health bar visual representation (fixed UI position)
    //     if (this.healthBar && this.healthBarText) {
    //         // Update health bar visual representation
    //         this.healthBar.clear();

    //         // Calculate health percentage
    //         const healthPercentage = this.HIT_POINTS / this.MAX_HIT_POINTS;
    //         const currentWidth = GameConfig.UI.HEALTH_BAR_WIDTH * healthPercentage;

    //         // Draw background (red)
    //         this.healthBar.fillStyle(0xff0000, 1);
    //         this.healthBar.fillRect(0, 0, GameConfig.UI.HEALTH_BAR_WIDTH, GameConfig.UI.HEALTH_BAR_HEIGHT);

    //         // Draw current health (green)
    //         this.healthBar.fillStyle(0x00ff00, 1);
    //         this.healthBar.fillRect(0, 0, currentWidth, GameConfig.UI.HEALTH_BAR_HEIGHT);

    //         // Update text (even though it's hidden)
    //         this.healthBarText.setText(`${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`);
    //     }
    // }
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
            keyFlashlight = (keyboard as any).addKey('F');

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

        // Update invincibility frames
        if (this.invincibilityFrames) {
            this.invincibilityTimer -= this.scene.game.loop.delta;
            if (this.invincibilityTimer <= 0) {
                this.invincibilityFrames = false;
                this.invincibilityTimer = 0;
            }
        }

        // Update knockback friction
        if (this.isKnockedBack) {
            this.knockbackTimer -= this.scene.game.loop.delta;

            // Apply friction to gradually slow down
            if (this.body && this.body.velocity) {
                const friction = 0.85; // Reduce velocity by 15% each frame
                this.setVelocity(
                    this.body.velocity.x * friction,
                    this.body.velocity.y * friction
                );

                // Stop knockback when velocity is very low or timer expires
                const velocityMagnitude = Math.sqrt(
                    this.body.velocity.x * this.body.velocity.x +
                    this.body.velocity.y * this.body.velocity.y
                );

                if (velocityMagnitude < 5 || this.knockbackTimer <= 0) {
                    this.setVelocity(0, 0);
                    this.isKnockedBack = false;
                    this.knockbackTimer = 0;
                }
            }
        }

        // Update lantern
        // this.updateLantern();
    }

    public takeDamage(amount: number): void {
        // Check invincibility frames
        if (this.invincibilityFrames) {
            return;
        }

        super.takeDamage(amount);

        // Set invincibility frames
        this.invincibilityFrames = true;
        this.invincibilityTimer = 1000; // 1 second of invincibility

        // Play damage sound
        this.scene.sound.play('enemy-1-hit', { volume: 0.5 });

        // Create damage feedback effects
        this.createDamageFeedback();

        // Check if player is dead
        if (this.isDead()) {
            this.scene.scene.start('GameOver');
        }
    }

    private createDamageFeedback(): void {
        // Create damage flash effect
        this.createDamageFlash();

        // Create knockback effect
        this.createKnockbackEffect();

        // Create damage particles
        this.createDamageParticles();
    }

    private createDamageFlash(): void {
        // Flash the player red using Phaser tweens
        const originalTint = this.tint;

        // Create flashing effect using Phaser tweens
        this.scene.tweens.add({
            targets: this,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.setTint(originalTint);
            }
        });
    }

    private createKnockbackEffect(): void {
        // Get direction away from nearest enemy
        const knockbackDirection = this.getKnockbackDirection();

        // Apply knockback
        const knockbackForce = 200;
        this.setVelocity(
            knockbackDirection.x * knockbackForce,
            knockbackDirection.y * knockbackForce
        );

        // Set knockback state for friction system
        this.isKnockedBack = true;
        this.knockbackTimer = 1000; // 1 second maximum knockback duration
    }

    private getKnockbackDirection(): { x: number; y: number } {
        // Find nearest enemy for knockback direction
        let nearestEnemy: any = null;
        let nearestDistance = Infinity;

        // Use the scene's enemies array if available
        const worldScene = this.scene as any;
        if (worldScene.enemies && Array.isArray(worldScene.enemies)) {
            worldScene.enemies.forEach((enemy: any) => {
                if (enemy && enemy.x !== undefined && enemy.y !== undefined) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestEnemy = enemy;
                    }
                }
            });
        }

        if (nearestEnemy) {
            const dx = this.x - nearestEnemy.x;
            const dy = this.y - nearestEnemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                return {
                    x: dx / distance,
                    y: dy / distance
                };
            }
        }

        // Default knockback direction (up and left)
        return { x: -0.7, y: -0.7 };
    }

    private createDamageParticles(): void {
        // Create damage particles around the player
        for (let i = 0; i < 8; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(0xff0000, 0.8);
            particle.fillCircle(0, 0, 1);

            // Random position around player
            const angle = (i / 8) * Math.PI * 2;
            const distance = 15;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;

            particle.setPosition(x, y);

            // Animate particle outward
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                    particle.destroy();
                }
            });
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

            // Update inventory UI if it exists
            const worldScene = this.scene as any;
            if (worldScene.inventoryUI) {
                worldScene.inventoryUI.updateInventoryDisplay();
            }
        } else {
            console.log('No items found in pickup range');
        }
    }

    public toggleFlashlight(): void {
        if (this.flashlight) {
            this.flashlight.toggle();
            console.log(`Flashlight ${this.flashlight.isLightActive() ? 'ON' : 'OFF'}`);
        }
    }

    private isFruitItem(itemType: string): boolean {
        const fruitTypes = ['apple', 'pinecone', 'ancient-fruit', 'cherry', 'fruit', 'tree-of-life-fruit'];
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

    public setHealth(health: number): void {
        this.HIT_POINTS = Math.max(0, Math.min(health, this.MAX_HIT_POINTS));
        this.updateHealthBar();
    }
}
