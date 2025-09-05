import Phaser from 'phaser';
import { Entity } from './Entity';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { StateMachine, State } from '../lib/StateMachine';
import { updatePlayerMovement } from '../lib/HelperFunc';
import { Lantern } from '../systems/Lantern';
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
export let keyLantern: Phaser.Input.Keyboard.Key;

// Player States
class PlayerIdleState extends State {
    enter(_scene: Phaser.Scene, player: Player): void {
        player.setVelocity(0, 0);

        // Stop any currently playing animation to prevent infinite loops
        player.anims.stop();

        // Set idle frame directly based on last direction
        // Knight_1 idle frames: 0=down, 1=right, 2=left, 3=up (0-indexed!)
        let idleFrame = 0; // default to down
        switch (player.lastDirection) {
            case 'down':
                idleFrame = 0;
                break;
            case 'right':
                idleFrame = 1;
                break;
            case 'left':
                idleFrame = 2;
                break;
            case 'up':
                idleFrame = 3;
                break;
            default:
                idleFrame = 0; // default to down
                break;
        }
        
        player.setFrame(idleFrame);
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Don't process input if pause menu is open
        const worldScene = _scene as any;
        if (worldScene.pauseMenu && worldScene.pauseMenu.isMenuVisible()) {
            return;
        }

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

        // Check for proximity pickup input
        if (keyInteract && keyInteract.isDown && !player.pickupCooldown) {
            player.performProximityPickup();
        }

        // Check for lantern toggle input (single press only)
        if (keyLantern && Phaser.Input.Keyboard.JustDown(keyLantern)) {
            player.toggleLantern();
        }
    }
}

class PlayerWalkingState extends State {
    enter(_scene: Phaser.Scene, _player: Player): void {
        // State entered when movement keys are pressed
    }

    execute(_scene: Phaser.Scene, player: Player): void {
        // Don't process input if pause menu is open
        const worldScene = _scene as any;
        if (worldScene.pauseMenu && worldScene.pauseMenu.isMenuVisible()) {
            // Stop movement when pause menu is open
            player.setVelocity(0, 0);
            return;
        }

        // Don't process movement if player movement is locked (e.g., inventory open)
        if (player.isMovementLocked()) {
            player.setVelocity(0, 0);
            return;
        }

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
        const noKeysPressed = (!keyUp || !keyUp.isDown) && (!keyDown || !keyDown.isDown) && (!keyLeft || !keyLeft.isDown) && (!keyRight || !keyRight.isDown);
        
        if (noKeysPressed) {
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

        // Check for lantern toggle input (single press only)
        if (keyLantern && Phaser.Input.Keyboard.JustDown(keyLantern)) {
            player.toggleLantern();
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
        // Don't process input if pause menu is open
        const worldScene = _scene as any;
        if (worldScene.pauseMenu && worldScene.pauseMenu.isMenuVisible()) {
            // Stop movement when pause menu is open
            player.setVelocity(0, 0);
            return;
        }

        // Don't process movement if player movement is locked (e.g., inventory open)
        if (player.isMovementLocked()) {
            player.setVelocity(0, 0);
            return;
        }

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
    public lantern: Lantern | null = null; // Will be set by World scene
    public isKnockedBack: boolean = false;
    public knockbackTimer: number = 0;
    public lanternSprite: Phaser.GameObjects.Graphics | null = null;
    public lastDirection: string = 'down'; // Track last movement direction for idle animation
    public equippedWeapon: Phaser.GameObjects.Image | null = null;
    public movementLocked: boolean = false; // Track if player movement is locked

    constructor(scene: Phaser.Scene, x: number, y: number, inventory?: any, questData?: any) {
        super(scene, x, y, 'player');
        try {

            // Set initial frame to down idle (frame 0, 0-indexed!)
            this.setFrame(0);

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
            this.initializeInputKeys(scene);

            // health bar
            this.setupHealthBar()

            // player size
            this.setScale(GameConfig.SCALE.PLAYER)
        } catch (error) {
            console.error('=== CRITICAL ERROR IN PLAYER CONSTRUCTOR ===');
            console.error('Error:', error);
            console.error('Stack:', (error as any)?.stack);
            console.error('===========================================');
        }
    }

    private setupHealthBar(): void {
        this.healthBar = this.scene.add.graphics()
        this.healthBarText = this.scene.add.bitmapText(30, this.scene.cameras.main.height - 50, 'pixel-white', `${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`, 16)

        this.healthBar.setScrollFactor(0)
        this.healthBarText.setScrollFactor(0)

        this.healthBar.setDepth(10000)
        this.healthBarText.setDepth(10001)

        this.updateHealthBar()
    }



    protected updateHealthBar(): void {
        this.setData('hitPoints', this.HIT_POINTS);
        this.setData('maxHitPoints', this.MAX_HIT_POINTS);

        // Update health bar visual representation (fixed UI position)
        if (this.healthBar && this.healthBarText) {
            // Position health bar at bottom left of screen
            this.healthBar.setPosition(20, this.scene.cameras.main.height - 70);
            this.healthBarText.setPosition(30, this.scene.cameras.main.height - 50);
            
            // Update health bar visual representation
            this.healthBar.clear();

            // Calculate health percentage
            const healthPercentage = this.HIT_POINTS / this.MAX_HIT_POINTS;
            const currentWidth = GameConfig.UI.HEALTH_BAR_WIDTH * healthPercentage;

            // Draw background (red)
            this.healthBar.fillStyle(0xff0000, 1);
            this.healthBar.fillRect(0, 0, GameConfig.UI.HEALTH_BAR_WIDTH, GameConfig.UI.HEALTH_BAR_HEIGHT);

            // Draw current health (green)
            this.healthBar.fillStyle(0x00ff00, 1);
            this.healthBar.fillRect(0, 0, currentWidth, GameConfig.UI.HEALTH_BAR_HEIGHT);

            // Update text
            this.healthBarText.setText(`${this.HIT_POINTS}/${this.MAX_HIT_POINTS}`);
        }
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
            keyLantern = (keyboard as any).addKey('F');
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

        // Update weapon position continuously to follow player movement
        this.updateWeaponPosition();

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

    /**
     * Equip a weapon and attach it visually to the player
     */
    public equipWeapon(weaponName: string): void {
        // Remove existing equipped weapon
        this.unequipWeapon();
        
        // Create visual weapon attachment
        this.createWeaponAttachment(weaponName);
        
        console.log(`Player equipped weapon: ${weaponName}`);
    }

    /**
     * Unequip current weapon
     */
    public unequipWeapon(): void {
        if (this.equippedWeapon) {
            this.equippedWeapon.destroy();
            this.equippedWeapon = null;
        }
    }

    /**
     * Create visual weapon attachment on player
     */
    private createWeaponAttachment(weaponName: string): void {
        // Create weapon sprite attached to player
        this.equippedWeapon = this.scene.add.image(this.x, this.y, weaponName);
        this.equippedWeapon.setOrigin(0.5, 0.8); // Anchor at bottom center
        this.equippedWeapon.setScale(0.3); // Scale for w_longsword.png
        this.equippedWeapon.setDepth(this.depth + 1); // Above player
        
        // Position weapon on player's hip
        this.updateWeaponPosition();
    }

    /**
     * Update weapon position based on player direction
     */
    public updateWeaponPosition(): void {
        if (!this.equippedWeapon) return;
        
        // Position weapon on player's hip based on direction
        switch (this.lastDirection) {
            case 'down':
                this.equippedWeapon.setPosition(this.x + 8, this.y + 8); // Right hip
                this.equippedWeapon.setRotation(0);
                break;
            case 'up':
                this.equippedWeapon.setPosition(this.x - 8, this.y - 8); // Left shoulder/back
                this.equippedWeapon.setRotation(Math.PI);
                break;
            case 'left':
                this.equippedWeapon.setPosition(this.x - 8, this.y + 4); // Left hip
                this.equippedWeapon.setRotation(-Math.PI / 2);
                break;
            case 'right':
                this.equippedWeapon.setPosition(this.x + 8, this.y + 4); // Right hip
                this.equippedWeapon.setRotation(Math.PI / 2);
                break;
        }
    }

    public getPosition(): [number, number] {
        return [this.x, this.y];
    }

    public heal(amount: number): void {
        this.HIT_POINTS = Math.min(this.HIT_POINTS + amount, this.MAX_HIT_POINTS);
        
        // Update the health bar display immediately after healing
        this.updateHealthBar();
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
        const collectedItems = new Map<string, number>(); // Track items by type and count

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
                    const itemType = item.getItemType();
                    
                    // Check if it's a collectible item (fruit or mysterious herb)
                    if (this.isFruitItem(itemType) || this.isMysteriousHerb(itemType)) {
                        // Handle all items as regular items
                        this.p1Inventory.add(itemType, 1);
                        
                        // Track collected items for consolidated feedback
                        collectedItems.set(itemType, (collectedItems.get(itemType) || 0) + 1);

                        // Play collection sound
                        const soundEffect = item.getSoundEffect();
                        if (soundEffect) {
                            this.scene.sound.play(soundEffect.sound, { volume: soundEffect.volume });
                        }

                        // Emit item collected event for quest system
                        this.scene.events.emit('itemCollected', itemType, 1);

                        // Destroy the item
                        item.destroy();
                        itemsCollected++;
                    }
                }
            }
        });

        // Find all weapons in the scene (LongSword instances)
        this.scene.children.list.forEach(child => {
            if (child.constructor.name === 'LongSword') {
                const weapon = child as any; // LongSword instance
                const distance = Phaser.Math.Distance.Between(this.x, this.y, weapon.x, weapon.y);

                if (distance <= pickupRadius) {
                    const itemType = weapon.getItemType();
                    
                    // Handle weapon pickup
                    this.p1Inventory.add(itemType, 1);
                    
                    // Track collected items for consolidated feedback
                    collectedItems.set(itemType, (collectedItems.get(itemType) || 0) + 1);

                    // Play collection sound
                    const soundEffect = weapon.getSoundEffect();
                    if (soundEffect) {
                        this.scene.sound.play(soundEffect.sound, { volume: soundEffect.volume });
                    }

                    // Emit item collected event for quest system
                    this.scene.events.emit('itemCollected', itemType, 1);

                    // Destroy the weapon
                    weapon.destroy();
                    itemsCollected++;
                }
            }
        });

        // Show consolidated pickup feedback
        if (itemsCollected > 0) {
            this.showConsolidatedPickupFeedback(collectedItems);
        }

        // Show general pickup feedback if items were collected
        if (itemsCollected > 0) {
            // Update inventory UI if it exists
            const worldScene = this.scene as any;
            if (worldScene.inventoryUI) {
                worldScene.inventoryUI.updateInventoryDisplay();
            }
        }
    }

    public toggleLantern(): void {
        if (this.lantern) {
            this.lantern.toggle();
        }
    }

    private isFruitItem(itemType: string): boolean {
        const fruitTypes = ['apple', 'pinecone', 'ancient-fruit', 'cherry', 'fruit', 'tree-of-life-fruit'];
        return fruitTypes.includes(itemType);
    }

    private isMysteriousHerb(itemType: string): boolean {
        const herbTypes = ['mysterious herb', 'mysterious-herb', 'bush-1'];
        return herbTypes.includes(itemType);
    }



    private showConsolidatedPickupFeedback(collectedItems: Map<string, number>): void {
        // Create individual +1 messages for each item collected
        let yOffset = 0;
        
        collectedItems.forEach((count, itemType) => {
            // Create a separate +1 message for each individual item
            for (let i = 0; i < count; i++) {
                const pickupText = this.scene.add.bitmapText(
                    this.x + Phaser.Math.Between(-10, 10),
                    this.y - 50 - yOffset,
                    'pixel-white',
                    `+1 ${itemType}`,
                    12
                );
                pickupText.setOrigin(0.5);

                // Animate the text floating up and fading out
                this.scene.tweens.add({
                    targets: pickupText,
                    y: pickupText.y - 30,
                    alpha: 0,
                    duration: 1500,
                    ease: 'Power2',
                    onComplete: () => {
                        pickupText.destroy();
                    }
                });
                
                yOffset += 20; // Space out multiple messages
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

        // Save QuestSystem state
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const questState = questSystem.saveQuestState();
            window.localStorage.setItem('quest_system_state', JSON.stringify(questState));
        }
    }

    public setHealth(health: number): void {
        this.HIT_POINTS = Math.max(0, Math.min(health, this.MAX_HIT_POINTS));
        this.updateHealthBar();
    }

    /**
     * Lock player movement (used when inventory is open)
     */
    public lockMovement(): void {
        this.movementLocked = true;
        this.setVelocity(0, 0); // Stop current movement
    }

    /**
     * Unlock player movement (used when inventory is closed)
     */
    public unlockMovement(): void {
        this.movementLocked = false;
    }

    /**
     * Check if player movement is locked
     */
    public isMovementLocked(): boolean {
        return this.movementLocked;
    }
}
