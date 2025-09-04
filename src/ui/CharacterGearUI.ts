/**
 * Character Gear UI System
 * 
 * Manages the character equipment interface with weapon slots and gear display.
 * Designed to work alongside the inventory system with medieval theming.
 */

import Phaser from 'phaser';

export interface GearSlot {
    type: 'weapon' | 'armor' | 'accessory';
    item: string | null;
    itemType: string | null;
    count: number;
    equipped: boolean;
}

export class CharacterGearUI {
    private scene: Phaser.Scene;
    private isVisible: boolean = false;
    private gearContainer: Phaser.GameObjects.Container | null = null;
    private player: any = null; // Reference to player
    private inventoryUI: any = null; // Reference to inventory UI
    
    // Gear slots
    private weaponSlot: GearSlot = { type: 'weapon', item: null, itemType: null, count: 0, equipped: false };
    private armorSlot: GearSlot = { type: 'armor', item: null, itemType: null, count: 0, equipped: false };
    private accessorySlot: GearSlot = { type: 'accessory', item: null, itemType: null, count: 0, equipped: false };
    
    // UI Elements
    private gearBackground: Phaser.GameObjects.Graphics | null = null;
    private weaponSlotUI: Phaser.GameObjects.Container | null = null;
    private armorSlotUI: Phaser.GameObjects.Container | null = null;
    private accessorySlotUI: Phaser.GameObjects.Container | null = null;
    
    // Configuration
    private readonly GEAR_WIDTH = 180;
    private readonly GEAR_HEIGHT = 280;
    private readonly SLOT_SIZE = 60;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        // CharacterGearUI initialized
    }

    /**
     * Toggle gear UI visibility
     */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show the gear UI
     */
    public show(): void {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.createGearUI();
        // Gear UI shown
    }

    /**
     * Hide the gear UI
     */
    public hide(): void {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        if (this.gearContainer) {
            this.gearContainer.destroy();
            this.gearContainer = null;
        }
        // Gear UI hidden
    }

    /**
     * Create the gear UI elements
     */
    private createGearUI(): void {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Calculate inventory width (assuming 9 columns based on typical inventory)
        const inventoryCols = 9;
        const slotSize = 40;
        const slotSpacing = 4;
        const padding = 30;
        
        const inventoryWidth = (inventoryCols * slotSize) + ((inventoryCols - 1) * slotSpacing) + (padding * 2);
        
        // Position gear UI to the right of inventory with proper spacing
        const gearX = centerX + (inventoryWidth / 2) + (this.GEAR_WIDTH / 2) + 20; // 20px gap between UIs
        const gearY = centerY;

        this.gearContainer = this.scene.add.container(0, 0);
        this.gearContainer.setScrollFactor(0);
        this.gearContainer.setDepth(1000);

        // Create medieval-themed gear background
        this.createGearBackground(gearX, gearY);
        
        // Create gear title
        this.createGearTitle(gearX, gearY - 120);
        
        // Create gear slots with increased spacing, moved down slightly
        this.createWeaponSlot(gearX, gearY - 60);
        this.createArmorSlot(gearX, gearY + 20);
        this.createAccessorySlot(gearX, gearY + 100);
    }

    /**
     * Create medieval-themed gear background matching inventory style
     */
    private createGearBackground(x: number, y: number): void {
        this.gearBackground = this.scene.add.graphics();
        this.gearBackground.setScrollFactor(0);
        this.gearContainer?.add(this.gearBackground);

        // Main leather background with gradient effect (matching inventory)
        this.gearBackground.fillStyle(0x4A3C28, 0.95); // Dark brown leather
        this.gearBackground.fillRoundedRect(
            x - this.GEAR_WIDTH / 2, 
            y - this.GEAR_HEIGHT / 2, 
            this.GEAR_WIDTH, 
            this.GEAR_HEIGHT, 
            12
        );
        
        // Darker inner border for depth
        this.gearBackground.lineStyle(4, 0x2F1F14, 1); // Very dark brown
        this.gearBackground.strokeRoundedRect(
            x - this.GEAR_WIDTH / 2 + 2, 
            y - this.GEAR_HEIGHT / 2 + 2, 
            this.GEAR_WIDTH - 4, 
            this.GEAR_HEIGHT - 4, 
            10
        );
        
        // Decorative metal frame
        this.gearBackground.lineStyle(3, 0x8B4513, 1); // Bronze frame
        this.gearBackground.strokeRoundedRect(
            x - this.GEAR_WIDTH / 2, 
            y - this.GEAR_HEIGHT / 2, 
            this.GEAR_WIDTH, 
            this.GEAR_HEIGHT, 
            12
        );
        
        // Lighter inner highlight for worn leather effect
        this.gearBackground.lineStyle(2, 0x6B5344, 0.7); // Light brown highlight
        this.gearBackground.strokeRoundedRect(
            x - this.GEAR_WIDTH / 2 + 6, 
            y - this.GEAR_HEIGHT / 2 + 6, 
            this.GEAR_WIDTH - 12, 
            this.GEAR_HEIGHT - 12, 
            8
        );

        // Add corner metal studs (matching inventory)
        this.addCornerStuds(x, y);
        
        // Add parchment texture lines (matching inventory)
        this.addTextureLines(x, y);
    }

    /**
     * Add corner metal studs (matching inventory style)
     */
    private addCornerStuds(x: number, y: number): void {
        if (!this.gearBackground) return;

        const studSize = 8;
        const studOffset = 15;

        // Corner positions
        const corners = [
            { x: x - this.GEAR_WIDTH / 2 + studOffset, y: y - this.GEAR_HEIGHT / 2 + studOffset }, // Top-left
            { x: x + this.GEAR_WIDTH / 2 - studOffset, y: y - this.GEAR_HEIGHT / 2 + studOffset }, // Top-right
            { x: x - this.GEAR_WIDTH / 2 + studOffset, y: y + this.GEAR_HEIGHT / 2 - studOffset }, // Bottom-left
            { x: x + this.GEAR_WIDTH / 2 - studOffset, y: y + this.GEAR_HEIGHT / 2 - studOffset } // Bottom-right
        ];
        
        corners.forEach(corner => {
            // Outer metal ring
            this.gearBackground!.fillStyle(0x8B4513, 1); // Bronze
            this.gearBackground!.fillCircle(corner.x, corner.y, studSize);
            
            // Inner highlight
            this.gearBackground!.fillStyle(0xCD853F, 0.8); // Light bronze
            this.gearBackground!.fillCircle(corner.x, corner.y, studSize - 2);
            
            // Center dot
            this.gearBackground!.fillStyle(0x654321, 1); // Dark brown
            this.gearBackground!.fillCircle(corner.x, corner.y, 2);
        });
    }

    /**
     * Add parchment texture lines (matching inventory style)
     */
    private addTextureLines(x: number, y: number): void {
        if (!this.gearBackground) return;

        this.gearBackground.lineStyle(1, 0x2F1F14, 0.3); // Very subtle dark lines
        
        // Horizontal texture lines
        for (let i = 0; i < 3; i++) {
            const lineY = y - this.GEAR_HEIGHT / 2 + 20 + (i * (this.GEAR_HEIGHT - 40) / 2);
            this.gearBackground.beginPath();
            this.gearBackground.moveTo(x - this.GEAR_WIDTH / 2 + 15, lineY);
            this.gearBackground.lineTo(x + this.GEAR_WIDTH / 2 - 15, lineY);
            this.gearBackground.strokePath();
        }
        
        // Vertical texture lines
        for (let i = 0; i < 2; i++) {
            const lineX = x - this.GEAR_WIDTH / 2 + 25 + (i * (this.GEAR_WIDTH - 50));
            this.gearBackground.beginPath();
            this.gearBackground.moveTo(lineX, y - this.GEAR_HEIGHT / 2 + 15);
            this.gearBackground.lineTo(lineX, y + this.GEAR_HEIGHT / 2 - 15);
            this.gearBackground.strokePath();
        }
    }

    /**
     * Create gear title (matching inventory style)
     */
    private createGearTitle(x: number, y: number): void {
        // Dark background behind title for better readability - smaller to fit within gear UI
        const titleBg = this.scene.add.graphics();
        titleBg.fillStyle(0x000000, 0.7);
        titleBg.fillRoundedRect(x - 80, y - 15, 160, 30, 8);
        titleBg.setScrollFactor(0);
        this.gearContainer?.add(titleBg);
        
        // Clean title without shadow for better readability
        const title = this.scene.add.bitmapText(x, y, '8-bit', 'CHARACTER GEAR', 18);
        title.setOrigin(0.5);
        title.setTint(0xFFD700); // Gold color - good contrast on black background
        title.setScrollFactor(0);
        this.gearContainer?.add(title);
        
        // Decorative underline
        if (this.gearBackground) {
            this.gearBackground.lineStyle(2, 0xDAA520, 0.8);
            this.gearBackground.beginPath();
            this.gearBackground.moveTo(x - 50, y + 8);
            this.gearBackground.lineTo(x + 50, y + 8);
            this.gearBackground.strokePath();
        }
    }

    /**
     * Create weapon slot (matching inventory slot style)
     */
    private createWeaponSlot(x: number, y: number): void {
        this.weaponSlotUI = this.scene.add.container(x, y);
        this.weaponSlotUI.setScrollFactor(0);
        this.gearContainer?.add(this.weaponSlotUI);

        // Create medieval slot background (matching inventory)
        const slotBg = this.createMedievalGearSlot();
        this.weaponSlotUI.add(slotBg);

        // Create stylized weapon icon with integrated design
        this.createStylizedSlotIcon(this.weaponSlotUI, 'weapon', 0, -8);
        
        // Create integrated slot label with decorative elements
        this.createStylizedSlotLabel(this.weaponSlotUI, 'WEAPON', 0, 25);

        // Make interactive with hover effects
        this.weaponSlotUI.setInteractive(
            new Phaser.Geom.Rectangle(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE),
            Phaser.Geom.Rectangle.Contains
        );

        // Add hover effects
        this.weaponSlotUI.on('pointerover', () => {
            if (this.weaponSlotUI) {
                this.handleSlotHover(this.weaponSlotUI, true);
            }
        });

        this.weaponSlotUI.on('pointerout', () => {
            if (this.weaponSlotUI) {
                this.handleSlotHover(this.weaponSlotUI, false);
            }
        });

        this.weaponSlotUI.on('pointerdown', () => {
            this.handleWeaponSlotClick();
        });
    }

    /**
     * Creates a medieval-themed gear slot (matching inventory style)
     */
    private createMedievalGearSlot(): Phaser.GameObjects.Graphics {
        const slot = this.scene.add.graphics();
        
        // Main slot background - dark leather pouch
        slot.fillStyle(0x2F1F14, 1); // Very dark brown
        slot.fillRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);
        
        // Inner shadow for depth
        slot.fillStyle(0x1A100A, 0.8); // Even darker brown
        slot.fillRoundedRect(-this.SLOT_SIZE / 2 + 1, -this.SLOT_SIZE / 2 + 1, this.SLOT_SIZE - 2, this.SLOT_SIZE - 2, 3);
        
        // Highlight on worn leather
        slot.lineStyle(1, 0x4A3C28, 0.6); // Lighter brown highlight
        slot.strokeRoundedRect(-this.SLOT_SIZE / 2 + 2, -this.SLOT_SIZE / 2 + 2, this.SLOT_SIZE - 4, this.SLOT_SIZE - 4, 2);
        
        // Bronze border frame
        slot.lineStyle(2, 0x8B4513, 1); // Bronze
        slot.strokeRoundedRect(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 4);
        
        // Corner decorations - small metal corners
        this.addGearSlotCornerDecorations(slot);
        
        slot.setScrollFactor(0);
        return slot;
    }

    /**
     * Adds small decorative metal corners to gear slots
     */
    private addGearSlotCornerDecorations(slot: Phaser.GameObjects.Graphics): void {
        const cornerSize = 3;
        const cornerOffset = 2;
        const halfSize = this.SLOT_SIZE / 2;
        
        // Top-left corner
        slot.fillStyle(0xA0A0A0, 1); // Light gray metal
        slot.fillTriangle(
            -halfSize + cornerOffset, -halfSize + cornerOffset,
            -halfSize + cornerOffset + cornerSize, -halfSize + cornerOffset,
            -halfSize + cornerOffset, -halfSize + cornerOffset + cornerSize
        );
        
        // Top-right corner
        slot.fillTriangle(
            halfSize - cornerOffset, -halfSize + cornerOffset,
            halfSize - cornerOffset - cornerSize, -halfSize + cornerOffset,
            halfSize - cornerOffset, -halfSize + cornerOffset + cornerSize
        );
        
        // Bottom-left corner
        slot.fillTriangle(
            -halfSize + cornerOffset, halfSize - cornerOffset,
            -halfSize + cornerOffset + cornerSize, halfSize - cornerOffset,
            -halfSize + cornerOffset, halfSize - cornerOffset - cornerSize
        );
        
        // Bottom-right corner
        slot.fillTriangle(
            halfSize - cornerOffset, halfSize - cornerOffset,
            halfSize - cornerOffset - cornerSize, halfSize - cornerOffset,
            halfSize - cornerOffset, halfSize - cornerOffset - cornerSize
        );
    }

    /**
     * Handle slot hover effects
     */
    private handleSlotHover(slotContainer: Phaser.GameObjects.Container, isHovering: boolean): void {
        if (isHovering) {
            // Add glow effect
            slotContainer.setScale(1.05);
            // Apply tint to all children instead of container
            slotContainer.list.forEach((child: any) => {
                if (child.setTint) {
                    child.setTint(0xFFFFAA); // Light yellow glow
                }
            });
        } else {
            // Remove glow effect
            slotContainer.setScale(1.0);
            // Clear tint from all children
            slotContainer.list.forEach((child: any) => {
                if (child.clearTint) {
                    child.clearTint();
                }
            });
        }
    }

    /**
     * Create armor slot (matching inventory slot style)
     */
    private createArmorSlot(x: number, y: number): void {
        this.armorSlotUI = this.scene.add.container(x, y);
        this.armorSlotUI.setScrollFactor(0);
        this.gearContainer?.add(this.armorSlotUI);

        // Create medieval slot background (matching inventory)
        const slotBg = this.createMedievalGearSlot();
        this.armorSlotUI.add(slotBg);

        // Create stylized armor icon with integrated design
        this.createStylizedSlotIcon(this.armorSlotUI, 'armor', 0, -8);
        
        // Create integrated slot label with decorative elements
        this.createStylizedSlotLabel(this.armorSlotUI, 'ARMOR', 0, 25);

        // Make interactive with hover effects
        this.armorSlotUI.setInteractive(
            new Phaser.Geom.Rectangle(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE),
            Phaser.Geom.Rectangle.Contains
        );

        // Add hover effects
        this.armorSlotUI.on('pointerover', () => {
            if (this.armorSlotUI) {
                this.handleSlotHover(this.armorSlotUI, true);
            }
        });

        this.armorSlotUI.on('pointerout', () => {
            if (this.armorSlotUI) {
                this.handleSlotHover(this.armorSlotUI, false);
            }
        });

        this.armorSlotUI.on('pointerdown', () => {
            this.handleArmorSlotClick();
        });
    }

    /**
     * Create accessory slot (matching inventory slot style)
     */
    private createAccessorySlot(x: number, y: number): void {
        this.accessorySlotUI = this.scene.add.container(x, y);
        this.accessorySlotUI.setScrollFactor(0);
        this.gearContainer?.add(this.accessorySlotUI);

        // Create medieval slot background (matching inventory)
        const slotBg = this.createMedievalGearSlot();
        this.accessorySlotUI.add(slotBg);

        // Create stylized accessory icon with integrated design
        this.createStylizedSlotIcon(this.accessorySlotUI, 'accessory', 0, -8);
        
        // Create integrated slot label with decorative elements
        this.createStylizedSlotLabel(this.accessorySlotUI, 'ACCESSORY', 0, 25);

        // Make interactive with hover effects
        this.accessorySlotUI.setInteractive(
            new Phaser.Geom.Rectangle(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE),
            Phaser.Geom.Rectangle.Contains
        );

        // Add hover effects
        this.accessorySlotUI.on('pointerover', () => {
            if (this.accessorySlotUI) {
                this.handleSlotHover(this.accessorySlotUI, true);
            }
        });

        this.accessorySlotUI.on('pointerout', () => {
            if (this.accessorySlotUI) {
                this.handleSlotHover(this.accessorySlotUI, false);
            }
        });

        this.accessorySlotUI.on('pointerdown', () => {
            this.handleAccessorySlotClick();
        });
    }

    /**
     * Create stylized slot icon with integrated design
     */
    private createStylizedSlotIcon(container: Phaser.GameObjects.Container, slotType: string, x: number, y: number): void {
        // Create decorative background for icon
        const iconBg = this.scene.add.graphics();
        iconBg.fillStyle(0x1A100A, 0.8); // Dark background
        iconBg.fillCircle(x, y, 12);
        iconBg.lineStyle(1, 0x8B4513, 0.8); // Bronze border
        iconBg.strokeCircle(x, y, 12);
        container.add(iconBg);

        // Create stylized icon based on slot type
        let iconText = '';
        let iconColor = 0xFFD700;
        
        switch (slotType) {
            case 'weapon':
                iconText = '⚔';
                iconColor = 0xFF6B6B; // Red for weapon
                break;
            case 'armor':
                iconText = '🛡';
                iconColor = 0x4ECDC4; // Teal for armor
                break;
            case 'accessory':
                iconText = '💍';
                iconColor = 0xFFE66D; // Yellow for accessory
                break;
        }

        // Create icon with shadow effect
        const iconShadow = this.scene.add.bitmapText(x + 1, y + 1, '8-bit', iconText, 14);
        iconShadow.setOrigin(0.5);
        iconShadow.setTint(0x000000); // Black shadow
        iconShadow.setAlpha(0.5);
        container.add(iconShadow);

        const icon = this.scene.add.bitmapText(x, y, '8-bit', iconText, 14);
        icon.setOrigin(0.5);
        icon.setTint(iconColor);
        container.add(icon);
    }

    /**
     * Create stylized slot label with decorative elements
     */
    private createStylizedSlotLabel(container: Phaser.GameObjects.Container, labelText: string, x: number, y: number): void {
        // Create decorative background for label
        const labelBg = this.scene.add.graphics();
        labelBg.fillStyle(0x2F1F14, 0.9); // Dark background
        labelBg.fillRoundedRect(x - 40, y - 10, 80, 20, 4);
        labelBg.lineStyle(1, 0x8B4513, 0.6); // Subtle bronze border
        labelBg.strokeRoundedRect(x - 40, y - 10, 80, 20, 4);
        container.add(labelBg);

        // Create clean, readable label without shadow
        const label = this.scene.add.bitmapText(x, y, '8-bit', labelText, 14);
        label.setOrigin(0.5);
        label.setTint(0xFFD700); // Bright gold for better readability
        container.add(label);

        // Add decorative corner dots
        const cornerDots = this.scene.add.graphics();
        cornerDots.fillStyle(0x8B4513, 0.8);
        cornerDots.fillCircle(x - 35, y - 7, 1.5); // Top-left
        cornerDots.fillCircle(x + 35, y - 7, 1.5); // Top-right
        cornerDots.fillCircle(x - 35, y + 7, 1.5); // Bottom-left
        cornerDots.fillCircle(x + 35, y + 7, 1.5); // Bottom-right
        container.add(cornerDots);
    }

    /**
     * Handle weapon slot click
     */
    private handleWeaponSlotClick(): void {
        // Check if there's a cursor item from inventory
        if (this.inventoryUI && this.inventoryUI.cursorItem) {
            const cursorItem = this.inventoryUI.cursorItem;
            
            // Check if cursor item is a weapon
            if (cursorItem.itemType.startsWith('sword_')) {
                // Equip the weapon from cursor
                this.equipWeaponFromCursor(cursorItem);
                return;
            }
        }
        
        // Weapon slot clicked
        if (this.weaponSlot.equipped) {
            // Unequip current weapon
            this.unequipWeapon();
        } else {
            // Show weapon selection or equip from inventory
            this.showWeaponSelection();
        }
    }

    /**
     * Equip weapon from cursor item
     */
    private equipWeaponFromCursor(cursorItem: any): void {
        if (!this.inventoryUI) return;
        
        // Store current weapon if equipped
        let currentWeapon = null;
        if (this.weaponSlot.equipped) {
            currentWeapon = {
                itemType: this.weaponSlot.itemType,
                count: this.weaponSlot.count
            };
        }
        
        // Equip new weapon
        this.weaponSlot.equipped = true;
        this.weaponSlot.itemType = cursorItem.itemType;
        this.weaponSlot.item = cursorItem.itemType; // Keep both for compatibility
        this.weaponSlot.count = cursorItem.count;
        
        // Equip weapon on player character
        if (this.player) {
            this.player.equipWeapon(cursorItem.itemType);
        }
        
        // Update weapon display
        this.updateWeaponSlotDisplay();
        
        // Clear cursor and put old weapon in cursor if there was one
        this.inventoryUI.clearCursor();
        if (currentWeapon) {
            this.inventoryUI.cursorItem = currentWeapon;
            this.inventoryUI.updateCursorDisplay();
        }
        
        console.log(`Equipped weapon: ${cursorItem.itemType}`);
    }

    /**
     * Show weapon selection interface
     */
    private showWeaponSelection(): void {
        // For now, just log - in a full implementation, this would show a weapon selection UI
        console.log('Weapon selection clicked - would show available weapons from inventory');
    }

    /**
     * Unequip current weapon
     */
    private unequipWeapon(): void {
        if (this.weaponSlot.equipped && this.weaponSlot.item) {
            // Return weapon to inventory
            console.log(`Unequipped weapon: ${this.weaponSlot.item}`);
            
            // Unequip weapon from player
            if (this.player) {
                this.player.unequipWeapon();
            }
            
            // Clear weapon slot
            this.weaponSlot.item = null;
            this.weaponSlot.itemType = null;
            this.weaponSlot.count = 0;
            this.weaponSlot.equipped = false;
            
            // Update visual display
            this.updateWeaponSlotDisplay();
        }
    }

    /**
     * Equip a weapon to the weapon slot
     */
    public equipWeapon(weaponName: string): boolean {
        console.log(`Gear UI: Attempting to equip weapon: ${weaponName}`);
        
        if (this.weaponSlot.equipped) {
            // Unequip current weapon first
            console.log(`Gear UI: Unequipping current weapon: ${this.weaponSlot.item}`);
            this.unequipWeapon();
        }
        
        // Equip new weapon
        this.weaponSlot.item = weaponName;
        this.weaponSlot.equipped = true;
        console.log(`Gear UI: Set weapon slot - item: ${this.weaponSlot.item}, equipped: ${this.weaponSlot.equipped}`);
        
        // Update visual display
        this.updateWeaponSlotDisplay();
        console.log(`Gear UI: Updated weapon slot display`);
        
        // Equip weapon on player
        if (this.player) {
            console.log(`Gear UI: Equipping weapon on player: ${weaponName}`);
            this.player.equipWeapon(weaponName);
        } else {
            console.warn(`Gear UI: Player not available for weapon equipping`);
        }
        
        console.log(`Gear UI: Successfully equipped weapon: ${weaponName}`);
        return true;
    }

    /**
     * Update weapon slot visual display
     */
    private updateWeaponSlotDisplay(): void {
        if (!this.weaponSlotUI) return;
        
        // Clear existing weapon display
        this.weaponSlotUI.removeAll(true);
        
        // Recreate slot background
        const slotBg = this.createMedievalGearSlot();
        this.weaponSlotUI.add(slotBg);
        
        if (this.weaponSlot.equipped && this.weaponSlot.item) {
            // Show equipped weapon
            this.createEquippedWeaponDisplay();
        } else {
            // Show empty slot
            this.createStylizedSlotIcon(this.weaponSlotUI, 'weapon', 0, -8);
        }
        
        // Recreate slot label
        this.createStylizedSlotLabel(this.weaponSlotUI, 'WEAPON', 0, 25);
        
        // Recreate interactions
        this.weaponSlotUI.setInteractive(
            new Phaser.Geom.Rectangle(-this.SLOT_SIZE / 2, -this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE),
            Phaser.Geom.Rectangle.Contains
        );
        
        this.weaponSlotUI.on('pointerover', () => {
            if (this.weaponSlotUI) {
                this.handleSlotHover(this.weaponSlotUI, true);
            }
        });
        
        this.weaponSlotUI.on('pointerout', () => {
            if (this.weaponSlotUI) {
                this.handleSlotHover(this.weaponSlotUI, false);
            }
        });
        
        this.weaponSlotUI.on('pointerdown', () => {
            this.handleWeaponSlotClick();
        });
    }

    /**
     * Create equipped weapon display
     */
    private createEquippedWeaponDisplay(): void {
        if (!this.weaponSlotUI || !this.weaponSlot.item) return;
        
        // Map weapon item type to correct texture name
        let textureName = this.weaponSlot.item;
        if (this.weaponSlot.item.startsWith('sword_')) {
            const parts = this.weaponSlot.item.split('_');
            const rarity = parts[1];
            
            // Map to appropriate sword texture based on rarity
            switch (rarity) {
                case 'common':
                    textureName = 'medieval-sword-common'; // 64x128 high-res version
                    break;
                case 'uncommon':
                    textureName = 'medieval-sword-uncommon'; // 64x128 high-res version
                    break;
                case 'rare':
                    textureName = 'medieval-sword-rare'; // 64x128 high-res version
                    break;
                case 'epic':
                    textureName = 'medieval-sword-epic'; // 64x128 high-res version
                    break;
                case 'legendary':
                    textureName = 'medieval-sword-legendary'; // 64x128 high-res version
                    break;
                default:
                    textureName = 'medieval-sword-common';
            }
        }
        
        // Create weapon icon with correct texture and scale
        const weaponIcon = this.scene.add.image(0, -8, textureName);
        weaponIcon.setOrigin(0.5, 0.5);
        
        // All swords are now high-resolution (64x128), use consistent scale
        weaponIcon.setScale(0.2); // 64x128 high-res swords - smaller scale to fit in slot
        
        weaponIcon.setScrollFactor(0);
        this.weaponSlotUI.add(weaponIcon);
        
        // Add equipped indicator
        const equippedText = this.scene.add.bitmapText(0, 8, '8-bit', 'EQUIPPED', 10);
        equippedText.setOrigin(0.5);
        equippedText.setTint(0x00FF00); // Green
        equippedText.setScrollFactor(0);
        this.weaponSlotUI.add(equippedText);
    }

    /**
     * Handle armor slot click
     */
    private handleArmorSlotClick(): void {
        // Armor slot clicked
    }

    /**
     * Handle accessory slot click
     */
    private handleAccessorySlotClick(): void {
        // Accessory slot clicked
    }

    /**
     * Equip an item to a slot
     */
    public equipItem(_slotType: 'weapon' | 'armor' | 'accessory', _itemName: string): boolean {
        // Equipping item to slot
        return true;
    }

    /**
     * Unequip an item from a slot
     */
    public unequipItem(_slotType: 'weapon' | 'armor' | 'accessory'): boolean {
        // Unequipping from slot
        return true;
    }

    /**
     * Get current gear status
     */
    public getGearStatus(): { weapon: string | null, armor: string | null, accessory: string | null } {
        return {
            weapon: this.weaponSlot.item,
            armor: this.armorSlot.item,
            accessory: this.accessorySlot.item
        };
    }

    /**
     * Check if gear UI is visible
     */
    public isGearVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Get the gear container for bounds checking
     */
    public getGearContainer(): Phaser.GameObjects.Container | null {
        return this.gearContainer;
    }

    /**
     * Set player reference for weapon equipping
     */
    public setPlayer(player: any): void {
        this.player = player;
    }

    /**
     * Set inventory UI reference
     */
    public setInventoryUI(inventoryUI: any): void {
        this.inventoryUI = inventoryUI;
    }

    /**
     * Get gear slot state for saving
     */
    public getGearSlotState(): any {
        return {
            weapon: {
                item: this.weaponSlot.item,
                itemType: this.weaponSlot.itemType,
                count: this.weaponSlot.count,
                equipped: this.weaponSlot.equipped
            },
            armor: {
                item: this.armorSlot.item,
                itemType: this.armorSlot.itemType,
                count: this.armorSlot.count,
                equipped: this.armorSlot.equipped
            },
            accessory: {
                item: this.accessorySlot.item,
                itemType: this.accessorySlot.itemType,
                count: this.accessorySlot.count,
                equipped: this.accessorySlot.equipped
            }
        };
    }

    /**
     * Load gear slot state from save data
     */
    public loadGearSlotState(gearSlotState: any): void {
        if (gearSlotState.weapon) {
            this.weaponSlot.item = gearSlotState.weapon.item || gearSlotState.weapon.itemType;
            this.weaponSlot.itemType = gearSlotState.weapon.itemType;
            this.weaponSlot.count = gearSlotState.weapon.count;
            this.weaponSlot.equipped = gearSlotState.weapon.equipped;
            
            // Equip weapon on player if it's equipped
            if (this.weaponSlot.equipped && this.weaponSlot.item && this.player) {
                this.player.equipWeapon(this.weaponSlot.item);
            }
        }
        
        if (gearSlotState.armor) {
            this.armorSlot.item = gearSlotState.armor.item || gearSlotState.armor.itemType;
            this.armorSlot.itemType = gearSlotState.armor.itemType;
            this.armorSlot.count = gearSlotState.armor.count;
            this.armorSlot.equipped = gearSlotState.armor.equipped;
        }
        
        if (gearSlotState.accessory) {
            this.accessorySlot.item = gearSlotState.accessory.item || gearSlotState.accessory.itemType;
            this.accessorySlot.itemType = gearSlotState.accessory.itemType;
            this.accessorySlot.count = gearSlotState.accessory.count;
            this.accessorySlot.equipped = gearSlotState.accessory.equipped;
        }
        
        // Update visual displays
        this.updateWeaponSlotDisplay();
        // Note: Armor and accessory slot display methods would be added here when implemented
    }

    /**
     * Destroy the gear UI
     */
    public destroy(): void {
        this.hide();
        // CharacterGearUI destroyed
    }
}
