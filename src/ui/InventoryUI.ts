/**
 * Medieval Minecraft-Style Inventory UI
 * 
 * Features a rustic, worn leather and parchment aesthetic with medieval elements
 * while maintaining the familiar Minecraft grid-based inventory system.
 */

import Phaser from 'phaser';
import { Player } from '../prefabs/Player';

export interface InventoryItem {
    type: string;
    count: number;
    icon?: string;
}

export class InventoryUI {
    private scene: Phaser.Scene;
    private isVisible: boolean = false;
    private inventoryContainer!: Phaser.GameObjects.Container;
    private gearUI: any = null; // Reference to CharacterGearUI
    private inventorySlots: Phaser.GameObjects.Container[] = [];
    
    // Minecraft-style inventory properties
    private cursorItem: { itemType: string; count: number; originalSlot: number } | null = null;
    private cursorItemIcon: Phaser.GameObjects.Image | null = null;

    private slotSize: number = 40; // Good balance between size and usability
    private slotSpacing: number = 4; // Proper spacing for medieval aesthetic
    private inventoryWidth: number = 0;
    private inventoryHeight: number = 0;
    private playerInventory: any; // Reference to player's inventory
    private player: Player | null = null; // Reference to player for health restoration
    
    // Medieval UI elements
    private backgroundGraphics!: Phaser.GameObjects.Graphics;
    private titleText!: Phaser.GameObjects.BitmapText;
    private tooltipContainer!: Phaser.GameObjects.Container;
    private deleteSlot!: Phaser.GameObjects.Container;
    
    // Hold-click consumption system
    private consumptionProgressBar!: Phaser.GameObjects.Container;
    private consumptionTimer: Phaser.Time.TimerEvent | null = null;
    private isConsuming: boolean = false;
    private consumptionTarget: string | null = null;
    // @ts-ignore - Intentionally unused for future functionality
    private _consumingItemIcon: Phaser.GameObjects.Image | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInventory();
        this.setupKeybinds();
    }

    /**
     * Sets up the medieval-themed inventory with Minecraft-style grid layout
     */
    private setupInventory(): void {
        // Calculate inventory dimensions with medieval spacing
        const cols = 9;
        const rows = 4;
        const titleHeight = 60; // More space for ornate title
        const padding = 30; // More padding for medieval frame
        
        this.inventoryWidth = (cols * this.slotSize) + ((cols - 1) * this.slotSpacing) + (padding * 2);
        this.inventoryHeight = titleHeight + (rows * this.slotSize) + ((rows - 1) * this.slotSpacing) + (padding * 2);

        // Create main inventory container
        this.inventoryContainer = this.scene.add.container(0, 0);
        this.inventoryContainer.setScrollFactor(0);
        this.inventoryContainer.setDepth(10000);
        this.inventoryContainer.setVisible(false);

        // Create medieval-themed background
        this.createMedievalBackground();
        
        // Create ornate title
        this.createInventoryTitle();

        // Create grid-based inventory slots
        this.createInventorySlots();
        
        // Create medieval-themed delete slot
        this.createDeleteSlot();
        
        // Create consumption progress bar
        this.createConsumptionProgressBar();
        
        // Create tooltip container with highest depth to appear above everything
        this.tooltipContainer = this.scene.add.container(0, 0);
        this.tooltipContainer.setScrollFactor(0);
        this.tooltipContainer.setDepth(15000); // Very high depth to avoid clipping
        this.tooltipContainer.setVisible(false);
        // Don't add to inventoryContainer - add directly to scene for proper layering
        this.scene.add.existing(this.tooltipContainer);
    }

    /**
     * Creates a medieval-themed background with worn leather and parchment textures
     */
    private createMedievalBackground(): void {
        this.backgroundGraphics = this.scene.add.graphics();
        
        // Main leather background with gradient effect
        this.backgroundGraphics.fillStyle(0x4A3C28, 0.95); // Dark brown leather
        this.backgroundGraphics.fillRoundedRect(0, 0, this.inventoryWidth, this.inventoryHeight, 12);
        
        // Darker inner border for depth
        this.backgroundGraphics.lineStyle(4, 0x2F1F14, 1); // Very dark brown
        this.backgroundGraphics.strokeRoundedRect(2, 2, this.inventoryWidth - 4, this.inventoryHeight - 4, 10);
        
        // Decorative metal frame
        this.backgroundGraphics.lineStyle(3, 0x8B4513, 1); // Bronze frame
        this.backgroundGraphics.strokeRoundedRect(0, 0, this.inventoryWidth, this.inventoryHeight, 12);
        
        // Lighter inner highlight for worn leather effect
        this.backgroundGraphics.lineStyle(2, 0x6B5344, 0.7); // Light brown highlight
        this.backgroundGraphics.strokeRoundedRect(6, 6, this.inventoryWidth - 12, this.inventoryHeight - 12, 8);
        
        // Add corner metal studs
        this.addCornerStuds();
        
        // Add parchment texture lines
        this.addTextureLines();
        
        this.backgroundGraphics.setScrollFactor(0);
        this.inventoryContainer.add(this.backgroundGraphics);
    }

    /**
     * Adds decorative metal corner studs to the inventory frame
     */
    private addCornerStuds(): void {
        const studSize = 8;
        const studOffset = 15;
        
        // Corner positions
        const corners = [
            { x: studOffset, y: studOffset }, // Top-left
            { x: this.inventoryWidth - studOffset, y: studOffset }, // Top-right
            { x: studOffset, y: this.inventoryHeight - studOffset }, // Bottom-left
            { x: this.inventoryWidth - studOffset, y: this.inventoryHeight - studOffset } // Bottom-right
        ];
        
        corners.forEach(corner => {
            // Outer metal stud
            this.backgroundGraphics.fillStyle(0x696969, 1); // Dark gray metal
            this.backgroundGraphics.fillCircle(corner.x, corner.y, studSize);
            
            // Inner highlight
            this.backgroundGraphics.fillStyle(0xA9A9A9, 1); // Light gray highlight
            this.backgroundGraphics.fillCircle(corner.x - 1, corner.y - 1, studSize - 2);
            
            // Center
            this.backgroundGraphics.fillStyle(0x2F2F2F, 1); // Very dark center
            this.backgroundGraphics.fillCircle(corner.x, corner.y, studSize - 4);
        });
    }

    /**
     * Adds subtle texture lines to simulate worn leather
     */
    private addTextureLines(): void {
        this.backgroundGraphics.lineStyle(1, 0x3D2F1F, 0.4); // Very subtle lines
        
        // Horizontal texture lines
        for (let i = 0; i < 5; i++) {
            const y = 20 + (i * (this.inventoryHeight - 40) / 4);
            this.backgroundGraphics.beginPath();
            this.backgroundGraphics.moveTo(15, y);
            this.backgroundGraphics.lineTo(this.inventoryWidth - 15, y);
            this.backgroundGraphics.strokePath();
        }
        
        // Vertical texture lines
        for (let i = 0; i < 3; i++) {
            const x = 25 + (i * (this.inventoryWidth - 50) / 2);
            this.backgroundGraphics.beginPath();
            this.backgroundGraphics.moveTo(x, 15);
            this.backgroundGraphics.lineTo(x, this.inventoryHeight - 15);
            this.backgroundGraphics.strokePath();
        }
    }

    /**
     * Creates an ornate medieval title for the inventory
     */
    private createInventoryTitle(): void {
        const centerX = this.inventoryWidth / 2;
        
        // Dark background behind title for better readability
        const titleBg = this.scene.add.graphics();
        titleBg.fillStyle(0x000000, 0.7);
        titleBg.fillRoundedRect(centerX - 120, 10, 240, 40, 10);
        titleBg.setScrollFactor(0);
        this.inventoryContainer.add(titleBg);
        
        // Clean title without shadow for better readability
        this.titleText = this.scene.add.bitmapText(centerX, 30, '8-bit', 'ADVENTURER\'S PACK', 20);
        this.titleText.setOrigin(0.5);
        this.titleText.setTint(0xFFD700); // Gold color - good contrast on black background
        this.titleText.setScrollFactor(0);
        this.inventoryContainer.add(this.titleText);
        
        // Decorative underline
        this.backgroundGraphics.lineStyle(2, 0xDAA520, 0.8);
        this.backgroundGraphics.beginPath();
        this.backgroundGraphics.moveTo(centerX - 80, 40);
        this.backgroundGraphics.lineTo(centerX + 80, 40);
        this.backgroundGraphics.strokePath();
        
        // Small decorative diamonds
        this.backgroundGraphics.fillStyle(0xDAA520, 1);
        this.backgroundGraphics.beginPath();
        this.backgroundGraphics.moveTo(centerX - 85, 40);
        this.backgroundGraphics.lineTo(centerX - 88, 37);
        this.backgroundGraphics.lineTo(centerX - 85, 34);
        this.backgroundGraphics.lineTo(centerX - 82, 37);
        this.backgroundGraphics.closePath();
        this.backgroundGraphics.fillPath();
        
        this.backgroundGraphics.beginPath();
        this.backgroundGraphics.moveTo(centerX + 85, 40);
        this.backgroundGraphics.lineTo(centerX + 88, 37);
        this.backgroundGraphics.lineTo(centerX + 85, 34);
        this.backgroundGraphics.lineTo(centerX + 82, 37);
        this.backgroundGraphics.closePath();
        this.backgroundGraphics.fillPath();
    }

    /**
     * Creates medieval-themed inventory slots with worn leather pouches design
     */
    private createInventorySlots(): void {
        const cols = 9;
        const rows = 4;
        const startX = 30; // More padding for medieval frame
        const startY = 70; // Account for larger title area
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const slotIndex = row * cols + col;
                const slotX = startX + (col * (this.slotSize + this.slotSpacing));
                const slotY = startY + (row * (this.slotSize + this.slotSpacing));
                
                // Create medieval slot background (positioned relative to container)
                const slotBg = this.createMedievalSlot(0, 0);
                
                // Create slot container at the correct position
                const slotContainer = this.scene.add.container(slotX, slotY);
                slotContainer.setScrollFactor(0);
                slotContainer.add(slotBg);
                
                // Add slot click detection
                this.addSlotClickDetection(slotContainer, slotIndex);
                
                this.inventorySlots.push(slotContainer);
                this.inventoryContainer.add(slotContainer);
            }
        }
    }

    /**
     * Creates a medieval-themed delete slot for discarding items
     */
    private createDeleteSlot(): void {
        // Position the delete slot at the bottom center of the inventory
        const deleteSlotX = this.inventoryWidth / 2 - this.slotSize / 2;
        const deleteSlotY = this.inventoryHeight - 50; // 50px from bottom
        
        // Create delete slot container
        this.deleteSlot = this.scene.add.container(deleteSlotX, deleteSlotY);
        this.deleteSlot.setScrollFactor(0);
        
        // Create delete slot background - darker, more ominous
        const deleteSlotBg = this.scene.add.graphics();
        deleteSlotBg.fillStyle(0x1A0F0A, 1); // Very dark red-brown
        deleteSlotBg.fillRoundedRect(0, 0, this.slotSize, this.slotSize, 4);
        
        // Inner shadow for depth
        deleteSlotBg.fillStyle(0x0F0805, 0.9); // Even darker
        deleteSlotBg.fillRoundedRect(1, 1, this.slotSize - 2, this.slotSize - 2, 3);
        
        // Red border to indicate danger
        deleteSlotBg.lineStyle(2, 0x8B0000, 0.8); // Dark red border
        deleteSlotBg.strokeRoundedRect(2, 2, this.slotSize - 4, this.slotSize - 4, 2);
        
        // Add skull or X symbol
        const deleteIcon = this.scene.add.graphics();
        deleteIcon.lineStyle(3, 0xFF4444, 0.9); // Bright red
        deleteIcon.strokeCircle(this.slotSize / 2, this.slotSize / 2, 12);
        deleteIcon.lineStyle(2, 0xFF4444, 0.9);
        deleteIcon.beginPath();
        deleteIcon.moveTo(this.slotSize / 2 - 8, this.slotSize / 2 - 8);
        deleteIcon.lineTo(this.slotSize / 2 + 8, this.slotSize / 2 + 8);
        deleteIcon.moveTo(this.slotSize / 2 + 8, this.slotSize / 2 - 8);
        deleteIcon.lineTo(this.slotSize / 2 - 8, this.slotSize / 2 + 8);
        deleteIcon.strokePath();
        
        // Add to container
        this.deleteSlot.add(deleteSlotBg);
        this.deleteSlot.add(deleteIcon);
        
        // Make it interactive
        this.deleteSlot.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.slotSize, this.slotSize),
            Phaser.Geom.Rectangle.Contains
        );
        
        // Add hover effects
        this.deleteSlot.on('pointerover', () => {
            this.deleteSlot.setScale(1.1);
            deleteSlotBg.clear();
            deleteSlotBg.fillStyle(0x2A1F1A, 1); // Slightly lighter on hover
            deleteSlotBg.fillRoundedRect(0, 0, this.slotSize, this.slotSize, 4);
            deleteSlotBg.fillStyle(0x1F1510, 0.9);
            deleteSlotBg.fillRoundedRect(1, 1, this.slotSize - 2, this.slotSize - 2, 3);
            deleteSlotBg.lineStyle(3, 0xFF6666, 1); // Brighter red on hover
            deleteSlotBg.strokeRoundedRect(2, 2, this.slotSize - 4, this.slotSize - 4, 2);
        });
        
        this.deleteSlot.on('pointerout', () => {
            this.deleteSlot.setScale(1.0);
            deleteSlotBg.clear();
            deleteSlotBg.fillStyle(0x1A0F0A, 1); // Back to original
            deleteSlotBg.fillRoundedRect(0, 0, this.slotSize, this.slotSize, 4);
            deleteSlotBg.fillStyle(0x0F0805, 0.9);
            deleteSlotBg.fillRoundedRect(1, 1, this.slotSize - 2, this.slotSize - 2, 3);
            deleteSlotBg.lineStyle(2, 0x8B0000, 0.8);
            deleteSlotBg.strokeRoundedRect(2, 2, this.slotSize - 4, this.slotSize - 4, 2);
        });
        
        // Add click handler
        this.deleteSlot.on('pointerdown', () => {
            if (this.cursorItem) {
                this.discardCursorItem();
            }
        });
        
        // Add to inventory container
        this.inventoryContainer.add(this.deleteSlot);
    }

    /**
     * Creates a medieval-themed consumption progress bar
     */
    private createConsumptionProgressBar(): void {
        // Create progress bar container
        const progressBarContainer = this.scene.add.container(0, 0);
        progressBarContainer.setScrollFactor(0); // Stay in screen space like inventory UI
        progressBarContainer.setVisible(false);
        progressBarContainer.setDepth(20000); // Higher depth than inventory to appear above it
        
        // Scale progress bar to match inventory slot size (40px)
        const barWidth = this.slotSize; // 40px to match slot size
        const barHeight = 6; // Thin bar proportional to slot
        
        // Create progress bar background (centered in container)
        const progressBg = this.scene.add.graphics();
        progressBg.setScrollFactor(0); // Stay in screen space like inventory UI
        progressBg.fillStyle(0x1A0F0A, 0.8); // Dark background
        progressBg.fillRoundedRect(-barWidth/2, 0, barWidth, barHeight, 3);
        progressBg.lineStyle(1, 0x8B4513, 0.8); // Brown border
        progressBg.strokeRoundedRect(-barWidth/2, 0, barWidth, barHeight, 3);
        
        // Create progress fill (centered in container)
        const progressFill = this.scene.add.graphics();
        progressFill.setScrollFactor(0); // Stay in screen space like inventory UI
        
        // Add to container
        progressBarContainer.add(progressBg);
        progressBarContainer.add(progressFill);
        
        // Add directly to scene (not inventory container) so it can follow mouse freely
        this.scene.add.existing(progressBarContainer);
        
        // Store reference for positioning
        this.consumptionProgressBar = progressBarContainer;
    }

    /**
     * Creates a single medieval-themed inventory slot
     */
    private createMedievalSlot(x: number, y: number): Phaser.GameObjects.Graphics {
        const slot = this.scene.add.graphics();
        
        // Main slot background - dark leather pouch
        slot.fillStyle(0x2F1F14, 1); // Very dark brown
        slot.fillRoundedRect(x, y, this.slotSize, this.slotSize, 4);
        
        // Inner shadow for depth
        slot.fillStyle(0x1A100A, 0.8); // Even darker brown
        slot.fillRoundedRect(x + 1, y + 1, this.slotSize - 2, this.slotSize - 2, 3);
        
        // Highlight on worn leather
        slot.lineStyle(1, 0x4A3C28, 0.6); // Lighter brown highlight
        slot.strokeRoundedRect(x + 2, y + 2, this.slotSize - 4, this.slotSize - 4, 2);
        
        // Bronze border frame
        slot.lineStyle(2, 0x8B4513, 1); // Bronze
        slot.strokeRoundedRect(x, y, this.slotSize, this.slotSize, 4);
        
        // Corner decorations - small metal corners
        this.addSlotCornerDecorations(slot, x, y);
        
        slot.setScrollFactor(0);
        return slot;
    }

    /**
     * Adds small decorative metal corners to each slot
     */
    private addSlotCornerDecorations(slot: Phaser.GameObjects.Graphics, x: number, y: number): void {
        const cornerSize = 3;
        const cornerOffset = 2;
        
        // Top-left corner
        slot.fillStyle(0xA0A0A0, 1); // Light gray metal
        slot.fillTriangle(
            x + cornerOffset, y + cornerOffset,
            x + cornerOffset + cornerSize, y + cornerOffset,
            x + cornerOffset, y + cornerOffset + cornerSize
        );
        
        // Top-right corner
        slot.fillTriangle(
            x + this.slotSize - cornerOffset, y + cornerOffset,
            x + this.slotSize - cornerOffset - cornerSize, y + cornerOffset,
            x + this.slotSize - cornerOffset, y + cornerOffset + cornerSize
        );
        
        // Bottom-left corner
        slot.fillTriangle(
            x + cornerOffset, y + this.slotSize - cornerOffset,
            x + cornerOffset + cornerSize, y + this.slotSize - cornerOffset,
            x + cornerOffset, y + this.slotSize - cornerOffset - cornerSize
        );
        
        // Bottom-right corner
        slot.fillTriangle(
            x + this.slotSize - cornerOffset, y + this.slotSize - cornerOffset,
            x + this.slotSize - cornerOffset - cornerSize, y + this.slotSize - cornerOffset,
            x + this.slotSize - cornerOffset, y + this.slotSize - cornerOffset - cornerSize
        );
    }

    /**
     * Adds hover and click interactions to inventory slots - SUBTLE effects
     */
    // @ts-ignore - Intentionally unused for future functionality
    private _addSlotInteractivity(slotContainer: Phaser.GameObjects.Container, slotX: number, slotY: number): void {
        // Create an invisible interactive area
        const interactiveArea = this.scene.add.rectangle(
            slotX + this.slotSize / 2, 
            slotY + this.slotSize / 2, 
            this.slotSize, 
            this.slotSize
        );
        interactiveArea.setFillStyle(0x000000, 0); // Invisible
        interactiveArea.setScrollFactor(0);
        interactiveArea.setInteractive({ useHandCursor: true });
        
        // Hover effects - VERY SUBTLE
        interactiveArea.on('pointerover', () => {
            this.highlightSlot(slotContainer, true);
        });
        
        interactiveArea.on('pointerout', () => {
            this.highlightSlot(slotContainer, false);
        });
        
        slotContainer.add(interactiveArea);
    }

    /**
     * Add click detection to inventory slots for item movement
     */
    private addSlotClickDetection(slotContainer: Phaser.GameObjects.Container, slotIndex: number): void {
        slotContainer.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.slotSize, this.slotSize),
            Phaser.Geom.Rectangle.Contains
        );

        // Handle hover effects for visual feedback (always respond to hover like gear UI)
        slotContainer.on('pointerover', () => {
            // Always highlight slot when hovering (like gear UI)
            this.highlightSlot(slotContainer, true);
            
            // If cursor item exists, ensure it's above all slots
            if (this.cursorItem) {
                this.updateCursorDepth();
            }
        });

        slotContainer.on('pointerout', () => {
            // Always remove highlight when leaving slot (like gear UI)
            this.highlightSlot(slotContainer, false);
        });

        slotContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                if (this.cursorItem) {
                    // Place item in empty slot
                    this.placeItemInEmptySlot(slotIndex);
                }
            }
        });
    }

    /**
     * Highlight or unhighlight a slot for visual feedback (matches gear UI style)
     */
    private highlightSlot(slotContainer: Phaser.GameObjects.Container, highlight: boolean): void {
        if (highlight) {
            // Add glow effect - same as gear UI
            slotContainer.setScale(1.05);
            // Apply tint to all children instead of container
            slotContainer.list.forEach((child: any) => {
                if (child.setTint) {
                    child.setTint(0xFFFFAA); // Light yellow glow - same as gear UI
                }
            });
        } else {
            // Remove glow effect - same as gear UI
            slotContainer.setScale(1.0);
            // Clear tint from all children
            slotContainer.list.forEach((child: any) => {
                if (child.clearTint) {
                    child.clearTint();
                }
            });
        }
    }

    private setupKeybinds(): void {
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            // Check if game is paused - don't allow inventory key if paused
            const worldScene = this.scene as any;
            if (worldScene.getPauseMenu && worldScene.getPauseMenu().isMenuVisible()) {
                // Game is paused - don't handle inventory key
                return;
            }
            
            if (event.code === 'KeyI') {
                this.toggle();
            }
            
            // Handle ESC key with priority system
            if (event.code === 'Escape') {
                this.hide();
            }
        });

    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
            // Also hide gear UI if it exists
            if (this.gearUI && this.gearUI.isGearVisible()) {
                this.gearUI.hide();
            }
        } else {
            this.show();
            // Also show gear UI if it exists
            if (this.gearUI && this.gearUI.show) {
                this.gearUI.show();
            }
        }
    }

    public show(): void {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.positionInventory();
        this.updateInventoryDisplay();
        this.inventoryContainer.setVisible(true);
    }

    public hide(): void {
        if (!this.isVisible) return;
        
        // Return cursor item to its original slot if inventory is closed while holding an item
        if (this.cursorItem && this.cursorItem.originalSlot !== undefined) {
            this.returnCursorItemToOriginalSlot();
        }
        
        this.isVisible = false;
        this.inventoryContainer.setVisible(false);
        
        // Close gear UI when inventory is closed
        if (this.gearUI && this.gearUI.isGearVisible()) {
            this.gearUI.hide();
        }
        
        // Close item detail UI (tooltip) when inventory is closed
        this.hideItemTooltip();
    }

    private positionInventory(): void {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        this.inventoryContainer.setPosition(
            centerX - this.inventoryWidth / 2,
            centerY - this.inventoryHeight / 2
        );
    }

    public setPlayer(player: Player): void {
        this.player = player;
        this.playerInventory = player.getInventory();
    }

    public setGearUI(gearUI: any): void {
        this.gearUI = gearUI;
    }


    /**
     * Updates the medieval inventory display with enhanced item interactions
     */
    public updateInventoryDisplay(): void {
        if (!this.playerInventory) return;

        // Simple approach: Clear all slots completely and rebuild them
        this.inventorySlots.forEach(slot => {
            slot.removeAll(true); // Remove and destroy all children
        });

        // Clear the slot containers themselves
        this.inventorySlots.forEach(slot => {
            this.inventoryContainer.remove(slot);
            slot.destroy();
        });
        this.inventorySlots = [];

        // Recreate all slots from scratch
        this.createInventorySlots();
        
        // Recreate delete slot
        this.createDeleteSlot();
        
        // Don't recreate consumption progress bar - it's already created in constructor

        // Now populate with inventory data (including weapons)
        const inventoryData = this.playerInventory.getInventoryDataWithWeapons();

        inventoryData.forEach(([itemType, count]: [string, number], slotIndex: number) => {
            if (slotIndex >= this.inventorySlots.length) return;

            // Skip empty slots - don't create items for them
            if (itemType === 'empty' || count === 0) {
                return;
            }

            const slot = this.inventorySlots[slotIndex];
            
            // Create enhanced item icon with medieval styling (positioned relative to slot container)
            const itemIcon = this.createMedievalItemIcon(itemType, this.slotSize / 2, this.slotSize / 2);
            slot.add(itemIcon);

            // Create enhanced count display with the nice gold ring (always show count)
            const countDisplay = this.createItemCountDisplay(count);
                slot.add(countDisplay);

            // Add item interactions and tooltips
            this.addItemInteractions(itemIcon, itemType, count, slot);
        });
    }

    /**
     * Creates a medieval-styled item icon with shadows and proper scaling
     */
    private createMedievalItemIcon(itemType: string, slotX: number, slotY: number): Phaser.GameObjects.Image {
        // Map item types to texture names
        let textureName = itemType;
        if (itemType === 'mysterious herb') {
            textureName = 'mysterious-herb';
        } else if (itemType === 'w_longsword') {
            // Use the weapon texture for weapons in inventory
            textureName = 'w_longsword';
        }
        
        // Check if texture exists, create fallback if not
        if (!this.scene.textures.exists(textureName)) {
            this.createFallbackTexture(textureName); // Use the mapped texture name
        }
        
        const itemIcon = this.scene.add.image(
            slotX, 
            slotY, 
            textureName
        );
        itemIcon.setOrigin(0.5, 0.5); // Center the image
        
        // Special scaling for weapon textures
        if (itemType === 'w_longsword') {
            itemIcon.setScale(0.4); // Scale for w_longsword.png
        } else {
            itemIcon.setScale(0.8); // Good size for medieval slots
        }
        
        itemIcon.setScrollFactor(0);
        
        // Weapon glow effects removed - swords now use natural colors
        
        return itemIcon;
    }

    /**
     * Creates fallback textures for missing items
     */
    private createFallbackTexture(itemType: string): void {
        if (this.scene.textures.exists(itemType)) return; // Already exists
        
        const graphics = this.scene.add.graphics();
        
        switch (itemType) {
            case 'gold-coin':
                // Create a gold coin texture
                graphics.fillStyle(0xffd700); // Gold color
                graphics.fillCircle(16, 16, 12);
                graphics.lineStyle(2, 0xffed4e); // Lighter gold border
                graphics.strokeCircle(16, 16, 12);
                // Add inner detail
                graphics.fillStyle(0xffed4e);
                graphics.fillCircle(16, 16, 6);
                graphics.generateTexture(itemType, 32, 32);
                break;
            case 'mysterious herb':
                // Create a simple green herb texture
                    graphics.fillStyle(0x228B22); // Forest green color
                    graphics.fillCircle(16, 16, 10);
                    graphics.lineStyle(2, 0x006400); // Darker green border
                    graphics.strokeCircle(16, 16, 10);
                    // Add some detail
                    graphics.fillStyle(0x32CD32); // Lime green
                    graphics.fillCircle(16, 16, 6);
                    graphics.generateTexture(itemType, 32, 32);
                break;
            case 'w_longsword':
                // This texture should be loaded from the weapons directory
                console.warn(`Weapon texture ${itemType} should be loaded from public/weapons/`);
                break;
            default:
                // Missing texture indicator - red and white checkerboard pattern
                graphics.fillStyle(0xff0000); // Red
                graphics.fillRect(0, 0, 16, 16);
                graphics.fillRect(16, 16, 16, 16);
                graphics.fillStyle(0xffffff); // White
                graphics.fillRect(16, 0, 16, 16);
                graphics.fillRect(0, 16, 16, 16);
                
                // Add border
                graphics.lineStyle(2, 0x000000);
                graphics.strokeRect(0, 0, 32, 32);
                
                // Add "?" in the center
                graphics.fillStyle(0x000000);
                graphics.fillRect(14, 8, 4, 16);
                graphics.fillRect(12, 10, 8, 4);
                graphics.fillRect(12, 18, 8, 4);
                graphics.fillRect(12, 22, 4, 2);
                
                graphics.generateTexture(itemType, 32, 32);
                break;
        }
        
        graphics.destroy();
    }


    /**
     * Creates the nice gold ring item count display you liked
     */
    private createItemCountDisplay(count: number): Phaser.GameObjects.Container {
        const countContainer = this.scene.add.container(0, 0);
        
        // Background for count (small medieval badge) - the original design you liked
        const countBg = this.scene.add.graphics();
        countBg.fillStyle(0x8B4513, 0.9); // Bronze background
        countBg.fillCircle(this.slotSize - 8, this.slotSize - 8, 8);
        countBg.lineStyle(1, 0xDAA520, 1); // Gold border
        countBg.strokeCircle(this.slotSize - 8, this.slotSize - 8, 8);
        countBg.setScrollFactor(0);
        countContainer.add(countBg);
        
        // Count text
        const countText = this.scene.add.bitmapText(
            this.slotSize - 8, 
            this.slotSize - 8, 
            'pixel-white', 
            count.toString(), 
            12
        );
        countText.setOrigin(0.5);
        countText.setTint(0xFFFFFF);
                countText.setScrollFactor(0);
        countContainer.add(countText);
        
        return countContainer;
    }

    /**
     * Adds enhanced interactions including tooltips and consumption for items
     */
    private addItemInteractions(itemIcon: Phaser.GameObjects.Image, itemType: string, count: number, _slot: Phaser.GameObjects.Container): void {
        // Create a larger clickable area for smaller items
        const clickableSize = Math.max(this.slotSize * 0.8, 32); // At least 80% of slot size or 32px minimum
        
        
        // For mysterious herbs, use a larger clickable area to ensure it's easy to click
        if (itemType === 'mysterious herb') {
            itemIcon.setInteractive(
                new Phaser.Geom.Rectangle(
                    -this.slotSize / 2 + 20, 
                    -this.slotSize / 2 + 20, 
                    this.slotSize, 
                    this.slotSize
                ),
                Phaser.Geom.Rectangle.Contains
            );
        } else {
            itemIcon.setInteractive(
                new Phaser.Geom.Rectangle(
                    -clickableSize / 2, 
                    -clickableSize / 2, 
                    clickableSize, 
                    clickableSize
                ),
                Phaser.Geom.Rectangle.Contains
            );
        }
        itemIcon.input!.cursor = 'pointer';
        
        // Hover effects - SUBTLE
        itemIcon.on('pointerover', () => {
            // Calculate tooltip position relative to the inventory container
            const inventoryX = this.inventoryContainer.x;
            const inventoryY = this.inventoryContainer.y;
            const tooltipX = inventoryX + itemIcon.x;
            const tooltipY = inventoryY + itemIcon.y;
            
            this.showItemTooltip(itemType, count, tooltipX, tooltipY);
            
            // Visual feedback for consumables vs other items
            if (this.isFruitItem(itemType)) {
                // Check if fruit can be consumed (player is damaged)
                const canConsume = this.canConsumeFruit();
                if (canConsume) {
                    itemIcon.setTint(0x88ff88); // Green glow for consumable fruits
                } else {
                    itemIcon.setTint(0xff8888); // Red tint for non-consumable fruits (health full)
                }
            } else if (this.isWeaponItem(itemType)) {
                itemIcon.setTint(0x88aaff); // Blue glow for weapons (equippable)
            } else {
                itemIcon.setTint(0xCCCCCC); // Subtle highlight for other items
            }
            
            // Very subtle scale effect (relative to current scale)
            const currentScale = itemIcon.scaleX;
            this.scene.tweens.add({
                targets: itemIcon,
                scaleX: currentScale * 1.1,
                scaleY: currentScale * 1.1,
                duration: 200,
                ease: 'Power1'
            });
        });
        
        itemIcon.on('pointerout', () => {
            this.hideItemTooltip();
            itemIcon.clearTint();
            
            // Scale back to original scale
            let originalScale = 0.8; // Default scale
            if (itemType === 'w_longsword') {
                originalScale = 0.4;
            }
            
            this.scene.tweens.add({
                targets: itemIcon,
                scaleX: originalScale,
                scaleY: originalScale,
                duration: 200,
                ease: 'Power1'
            });
        });
        
        // Minecraft-style interactions with hold-click consumption
        let clickStartTime = 0;
        let isHolding = false;
        
        itemIcon.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                clickStartTime = Date.now();
                isHolding = true;
                
            if (this.isFruitItem(itemType)) {
                    // Start consumption timer (hold for 200ms to start consumption)
                    this.scene.time.delayedCall(200, () => {
                        if (isHolding && !this.isConsuming) {
                    this.startConsumption(itemType, itemIcon);
                        }
                    });
                } else {
                    // Non-fruit items: immediate pickup
                    this.handleSlotClick(itemIcon, itemType, count);
                }
            } else if (pointer.rightButtonDown() && this.isWeaponItem(itemType)) {
                // Right-click on weapon: equip it
                // Prevent browser context menu
                pointer.event.preventDefault();
                pointer.event.stopPropagation();
                
                const slotIndex = this.findSlotIndex(itemIcon);
                if (slotIndex !== -1) {
                    this.equipWeapon(itemType, slotIndex);
                }
            }
        });
        
        itemIcon.on('pointerup', () => {
            const clickDuration = Date.now() - clickStartTime;
            isHolding = false;
            
            if (this.isFruitItem(itemType) && clickDuration < 200 && !this.isConsuming) {
                // Quick click on fruit: pick up item
                this.handleSlotClick(itemIcon, itemType, count);
            } else if (this.isConsuming) {
                // Stop consumption if it was started
            this.stopConsumption();
            }
        });
        
        itemIcon.on('pointerout', () => {
            isHolding = false;
            if (this.isConsuming) {
            this.stopConsumption();
            }
        });
    }

    /**
     * Handle slot click - Minecraft style
     */
    private handleSlotClick(itemIcon: Phaser.GameObjects.Image, itemType: string, count: number): void {
        const slotIndex = this.findSlotIndex(itemIcon);
        if (slotIndex === -1) return;

        if (this.cursorItem === null) {
            // Pick up item from slot
            this.pickupItem(itemIcon, itemType, count, slotIndex);
        } else {
            // Place item in slot
            this.placeItem(itemIcon, itemType, count, slotIndex);
        }
    }

    /**
     * Pick up item from slot (Minecraft style)
     */
    public pickupItem(itemIcon: Phaser.GameObjects.Image, itemType: string, count: number, slotIndex: number): void {
        // Store cursor item with original slot
        this.cursorItem = { itemType, count, originalSlot: slotIndex };
        
        // Get current mouse position
        const pointer = this.scene.input.activePointer;
        
        // Map item types to texture names
        let textureName = itemType;
        if (itemType === 'mysterious herb') {
            textureName = 'mysterious-herb';
        } else if (itemType === 'w_longsword') {
            // Use the weapon texture for weapons in inventory
            textureName = 'w_longsword';
        }
        
        // Check if texture exists, create fallback if not
        if (!this.scene.textures.exists(textureName)) {
            this.createFallbackTexture(textureName); // Use the mapped texture name
        }
        
        // Create cursor item icon that follows mouse
        this.cursorItemIcon = this.scene.add.image(pointer.x, pointer.y, textureName);
        this.cursorItemIcon.setOrigin(0.5, 0.5); // Center the item on the cursor
        
        // Apply cursor scaling (slightly larger than inventory for visibility)
        if (itemType === 'w_longsword') {
            this.cursorItemIcon.setScale(0.4); // Scale for w_longsword.png
        } else {
            this.cursorItemIcon.setScale(0.8); // Good size for other items
        }
        
        this.cursorItemIcon.setAlpha(0.9);
        this.cursorItemIcon.setScrollFactor(0, 0); // Don't follow camera scroll - stay in screen space
        this.cursorItemIcon.setDepth(999999); // Set maximum depth immediately to ensure it's above everything
        
        // Set initial depth based on position
        this.updateCursorDepth();
        
        // Remove item from slot visually
        itemIcon.destroy();
        
        // Remove from inventory data
        this.removeItemFromSlot(slotIndex);
        
        // Update inventory display immediately to show empty slot
        this.updateInventoryDisplay();
        
        // Make cursor follow mouse
        this.scene.input.on('pointermove', this.updateCursorPosition, this);
        
        // Close item detail UI since item is no longer in slot
                this.hideItemTooltip();
                
        // Picked up item from slot
    }

    /**
     * Place item in slot (Minecraft style)
     */
    private placeItem(itemIcon: Phaser.GameObjects.Image, itemType: string, count: number, slotIndex: number): void {
        if (!this.cursorItem || !this.cursorItemIcon) return;

        // If slot is empty, place item
        if (itemType === 'empty' || count === 0) {
            this.placeItemInEmptySlot(slotIndex);
        } else if (itemType === this.cursorItem.itemType) {
            // Same item type - stack if possible
            this.stackItems(slotIndex);
        } else {
            // Different item type - swap
            this.swapItems(itemIcon, itemType, count, slotIndex);
        }
    }

    /**
     * Place item in empty slot
     */
    private placeItemInEmptySlot(slotIndex: number): void {
        if (!this.cursorItem || !this.cursorItemIcon) return;

        // Store cursor item data before clearing
        const itemType = this.cursorItem.itemType;
        const itemCount = this.cursorItem.count;

        // Add to inventory data
        this.addItemToSlot(slotIndex, itemType, itemCount);
        
        // Clear cursor (item is being placed, not discarded)
        this.clearCursor();
        
        // Refresh inventory display after clearing cursor
        this.updateInventoryDisplay();
        
        // Hide any existing tooltip to ensure it refreshes properly
        this.hideItemTooltip();
        
        // Placed item in empty slot
    }

    /**
     * Stack items of same type
     */
    private stackItems(slotIndex: number): void {
        if (!this.cursorItem || !this.cursorItemIcon) return;

        const inventoryData = this.playerInventory?.getInventoryData() || [];
        const [, currentCount] = inventoryData[slotIndex] || ['empty', 0];
        const maxStack = this.playerInventory?.getMaxStackSize() || 12;
        
        const totalCount = currentCount + this.cursorItem.count;
        if (totalCount <= maxStack) {
            // Can stack completely
            this.addItemToSlot(slotIndex, this.cursorItem.itemType, totalCount);
            this.clearCursor();
            this.updateInventoryDisplay(); // Refresh display
            this.hideItemTooltip(); // Hide any existing tooltip to ensure it refreshes properly
            // Stacked item in slot
        } else {
            // Partial stack
            const remaining = totalCount - maxStack;
            this.addItemToSlot(slotIndex, this.cursorItem.itemType, maxStack);
            this.cursorItem.count = remaining;
            // Don't refresh display here - we still have cursor item
            this.hideItemTooltip(); // Hide any existing tooltip to ensure it refreshes properly
            // Partially stacked item, remaining in cursor
        }
    }

    /**
     * Swap items between cursor and slot
     */
    private swapItems(itemIcon: Phaser.GameObjects.Image, itemType: string, count: number, slotIndex: number): void {
        if (!this.cursorItem || !this.cursorItemIcon) return;

        // Store cursor item temporarily
        const cursorItemType = this.cursorItem.itemType;
        const cursorItemCount = this.cursorItem.count;
        
        // Clear cursor
        this.clearCursor();
        
        // Place cursor item in slot
        this.addItemToSlot(slotIndex, cursorItemType, cursorItemCount);
        
        // Pick up slot item
        this.cursorItem = { itemType, count, originalSlot: slotIndex };
        const pointer = this.scene.input.activePointer;
        
        // Map item types to texture names (same logic as pickupItem)
        let textureName = itemType;
        if (itemType === 'mysterious herb') {
            textureName = 'mysterious-herb';
        } else if (itemType === 'w_longsword') {
            // Use the weapon texture for weapons in inventory
            textureName = 'w_longsword';
        }
        
        this.cursorItemIcon = this.scene.add.image(pointer.x, pointer.y, textureName);
        this.cursorItemIcon.setOrigin(0.5, 0.5); // Center the item on the cursor
        this.cursorItemIcon.setScale(0.8);
        this.cursorItemIcon.setAlpha(0.9);
        this.cursorItemIcon.setScrollFactor(0, 0); // Don't follow camera scroll - stay in screen space
        this.cursorItemIcon.setDepth(999999); // Set maximum depth immediately to ensure it's above everything
        
        // Set initial depth based on position
        this.updateCursorDepth();
        
        // Remove old item from slot
        itemIcon.destroy();
        
        // Make cursor follow mouse
        this.scene.input.on('pointermove', this.updateCursorPosition, this);
        
        // Don't refresh display - we have a cursor item that would be destroyed
        
        // Hide any existing tooltip to ensure it refreshes properly
        this.hideItemTooltip();
        
        // Swapped items
    }

    /**
     * Update cursor position to follow mouse
     */
    private updateCursorPosition(pointer: Phaser.Input.Pointer): void {
        if (this.cursorItemIcon) {
            this.cursorItemIcon.x = pointer.x;
            this.cursorItemIcon.y = pointer.y;
            
            // Check if cursor is within UI bounds and adjust depth
            this.updateCursorDepth();
        }
    }

    /**
     * Update cursor item depth - keep it always above everything
     */
    private updateCursorDepth(): void {
        if (!this.cursorItemIcon) return;

        // SIMPLIFIED APPROACH: Always keep cursor item at maximum depth
        // This eliminates all depth conflicts and ensures it's always visible
        this.cursorItemIcon.setDepth(999999);
    }

    /**
     * Check if cursor is hovering over any inventory slot
     */
    // @ts-ignore - Intentionally unused for future functionality
    private _isHoveringOverSlot(x: number, y: number): boolean {
        for (const slot of this.inventorySlots) {
            const slotBounds = slot.getBounds();
            if (slotBounds && slotBounds.contains(x, y)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the cursor item to its original slot when inventory is closed
     */
    private returnCursorItemToOriginalSlot(): void {
        if (!this.cursorItem || this.cursorItem.originalSlot === undefined) return;
        
        // Add the cursor item back to its original slot
        this.addItemToSlot(this.cursorItem.originalSlot, this.cursorItem.itemType, this.cursorItem.count);
        
        // Clear the cursor
        this.clearCursor();
        
        // Update the inventory display to show the returned item
        this.updateInventoryDisplay();
    }

    /**
     * Clear cursor item
     */
    private clearCursor(): void {
        if (this.cursorItemIcon) {
            this.cursorItemIcon.destroy();
            this.cursorItemIcon = null;
        }
        this.cursorItem = null;
        this.scene.input.off('pointermove', this.updateCursorPosition, this);
    }

    /**
     * Discard cursor item (remove from inventory data)
     */
    private discardCursorItem(): void {
        if (this.cursorItem && this.cursorItem.originalSlot !== undefined) {
            // Remove item from inventory data
            this.removeItemFromSlot(this.cursorItem.originalSlot);
            // Discarded item from slot
            
            // Show discard feedback
            this.showDiscardFeedback();
            
            // Hide any existing tooltip to ensure it refreshes properly
            this.hideItemTooltip();
        }
        this.clearCursor();
    }

    /**
     * Show visual feedback when item is discarded
     */
    private showDiscardFeedback(): void {
        if (!this.cursorItem) return;
        
        // Create floating text above delete slot
        const feedbackText = this.scene.add.bitmapText(
            this.deleteSlot.x + this.slotSize / 2,
            this.deleteSlot.y - 30,
            'pixel-red',
            `Discarded ${this.cursorItem.itemType}`,
            12
        );
        feedbackText.setOrigin(0.5);
        feedbackText.setScrollFactor(0);
        
        // Animate the text floating up and fading out
                this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                feedbackText.destroy();
            }
        });
    }

    /**
     * Remove item from slot in inventory data
     */
    private removeItemFromSlot(slotIndex: number): void {
        if (!this.playerInventory) return;
        
        // Use the new slot-based method
        this.playerInventory.removeFromSlot(slotIndex);
    }

    /**
     * Add item to slot in inventory data
     */
    private addItemToSlot(slotIndex: number, itemType: string, count: number): void {
        if (!this.playerInventory) return;
        
        // Use the new slot-based method
        this.playerInventory.addToSlot(slotIndex, itemType, count);
    }

    /**
     * Find slot index for an item icon
     */
    private findSlotIndex(itemIcon: Phaser.GameObjects.Image): number {
        for (let i = 0; i < this.inventorySlots.length; i++) {
            const slot = this.inventorySlots[i];
            if (slot.list.includes(itemIcon)) {
                return i;
            }
        }
        return -1;
    }



    /**
     * Shows a medieval-themed tooltip with parchment design and perfect readability
     */
    private showItemTooltip(itemType: string, count: number, x: number, y: number): void {
        this.hideItemTooltip(); // Clear existing tooltip
        
        // Tooltip text content
        const itemName = this.getItemDisplayName(itemType);
        const itemDesc = this.getItemDescription(itemType);
        
        // Calculate tooltip size with proper padding
        const padding = 12;
        const tooltipWidth = Math.max(itemName.length * 11, itemDesc.length * 9, 150) + padding * 2;
        const tooltipHeight = (count > 1) ? 75 : 55;
        
        // Position tooltip relative to the item and inventory bounds
        // Start by positioning to the right of the item
        let tooltipX = x + 25;
        let tooltipY = y - tooltipHeight / 2; // Center vertically on the item
        
        // Get inventory container bounds
        const inventoryLeft = this.inventoryContainer.x;
        const inventoryRight = this.inventoryContainer.x + this.inventoryWidth;
        const inventoryTop = this.inventoryContainer.y;
        const inventoryBottom = this.inventoryContainer.y + this.inventoryHeight;
        
        // Check if tooltip would go outside inventory bounds and adjust
        if (tooltipX + tooltipWidth > inventoryRight) {
            // Position to the left of the item instead
            tooltipX = x - tooltipWidth - 25;
        }
        
        // Ensure tooltip stays within inventory bounds vertically
        if (tooltipY < inventoryTop + 10) {
            tooltipY = inventoryTop + 10;
        } else if (tooltipY + tooltipHeight > inventoryBottom - 10) {
            tooltipY = inventoryBottom - tooltipHeight - 10;
        }
        
        // Final fallback - if still outside bounds, position above/below item
        if (tooltipX < inventoryLeft + 10) {
            tooltipX = x - tooltipWidth / 2; // Center on item
            tooltipY = y - tooltipHeight - 15; // Above item
            
            if (tooltipY < inventoryTop + 10) {
                tooltipY = y + 25; // Below item
            }
        }
        
        // Create medieval parchment background
        const tooltipBg = this.scene.add.graphics();
        this.createMedievalTooltipBackground(tooltipBg, tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        tooltipBg.setScrollFactor(0);
        this.tooltipContainer.add(tooltipBg);
        
        // Clean, readable text without shadows - Item name
        const nameText = this.scene.add.bitmapText(
            tooltipX + padding, 
            tooltipY + padding, 
            '8-bit', 
            itemName, 
            16
        );
        nameText.setTint(0x8B4513); // Dark brown - high contrast on parchment
        nameText.setScrollFactor(0);
        this.tooltipContainer.add(nameText);
        
        // Item description
        const descText = this.scene.add.bitmapText(
            tooltipX + padding, 
            tooltipY + padding + 20, 
            '8-bit', 
            itemDesc, 
            14
        );
        descText.setTint(0x4A3C28); // Dark leather brown - easy to read
        descText.setScrollFactor(0);
        this.tooltipContainer.add(descText);
        
        // Count if > 1
        if (count > 1) {
            const countText = this.scene.add.bitmapText(
                tooltipX + padding, 
                tooltipY + padding + 40, 
                'pixel-white', 
                `Quantity: ${count}`, 
                12
            );
            countText.setTint(0x6B4423); // Medium brown for quantity
            countText.setScrollFactor(0);
            this.tooltipContainer.add(countText);
        }
        
        this.tooltipContainer.setVisible(true);
    }

    /**
     * Creates a medieval parchment-style tooltip background
     */
    private createMedievalTooltipBackground(
        graphics: Phaser.GameObjects.Graphics, 
        x: number, 
        y: number, 
        width: number, 
        height: number
    ): void {
        // Main parchment background
        graphics.fillStyle(0xF5E6C3, 0.98); // Warm parchment color
        graphics.fillRoundedRect(x, y, width, height, 8);
        
        // Darker inner border for depth
        graphics.lineStyle(3, 0xD4B895, 1); // Darker parchment
        graphics.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, 6);
        
        // Outer bronze border
        graphics.lineStyle(2, 0x8B4513, 1); // Bronze
        graphics.strokeRoundedRect(x, y, width, height, 8);
        
        // Inner highlight for worn effect
        graphics.lineStyle(1, 0xFFF8DC, 0.8); // Light cream highlight
        graphics.strokeRoundedRect(x + 4, y + 4, width - 8, height - 8, 4);
        
        // Small decorative corners
        this.addTooltipCornerDecorations(graphics, x, y, width, height);
        
        // Subtle parchment texture
        this.addTooltipTexture(graphics, x, y, width, height);
    }

    /**
     * Adds decorative metal corners to the tooltip
     */
    private addTooltipCornerDecorations(
        graphics: Phaser.GameObjects.Graphics, 
        x: number, 
        y: number, 
        width: number, 
        height: number
    ): void {
        const cornerSize = 4;
        const offset = 6;
        
        // Corner positions
        const corners = [
            { x: x + offset, y: y + offset },
            { x: x + width - offset, y: y + offset },
            { x: x + offset, y: y + height - offset },
            { x: x + width - offset, y: y + height - offset }
        ];
        
        corners.forEach(corner => {
            // Small bronze studs
            graphics.fillStyle(0x8B4513, 1);
            graphics.fillCircle(corner.x, corner.y, cornerSize);
            
            // Highlight
            graphics.fillStyle(0xDAA520, 0.8);
            graphics.fillCircle(corner.x - 1, corner.y - 1, cornerSize - 1);
        });
    }

    /**
     * Adds subtle texture lines to the tooltip parchment
     */
    private addTooltipTexture(
        graphics: Phaser.GameObjects.Graphics, 
        x: number, 
        y: number, 
        width: number, 
        height: number
    ): void {
        graphics.lineStyle(1, 0xE6D7B8, 0.3); // Very subtle lines
        
        // Horizontal texture lines
        for (let i = 0; i < 3; i++) {
            const lineY = y + 10 + (i * (height - 20) / 2);
            graphics.beginPath();
            graphics.moveTo(x + 8, lineY);
            graphics.lineTo(x + width - 8, lineY);
            graphics.strokePath();
        }
    }

    /**
     * Hides the item tooltip
     */
    private hideItemTooltip(): void {
        this.tooltipContainer.removeAll(true);
        this.tooltipContainer.setVisible(false);
    }

    /**
     * Hides the item tooltip only if no more items of the specified type remain in the slot
     */
    private hideItemTooltipIfEmpty(itemType: string): void {
        if (!this.playerInventory) {
            this.hideItemTooltip();
            return;
        }

        // Check if there are any more items of this type in the inventory
        const inventoryData = this.playerInventory.getInventoryData();
        const hasMoreItems = inventoryData.some(([type, count]: [string, number]) => type === itemType && count > 0);
        
        if (!hasMoreItems) {
            this.hideItemTooltip();
        }
    }

    /**
     * Gets the display name for an item
     */
    private getItemDisplayName(itemType: string): string {
        const itemNames: { [key: string]: string } = {
            'fruit': 'Wild Fruit',
            'apple': 'Red Apple',
            'pinecone': 'Pine Cone',
            'cherry': 'Sweet Cherry',
            'ancient-fruit': 'Ancient Fruit',
            'tree-of-life-fruit': 'Life Fruit',
            'mysterious herb': 'Mysterious Herb',
            'nepian-blood': 'Nepian Blood',
            'frozen-heart': 'Frozen Heart'
        };
        return itemNames[itemType] || itemType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Gets the description for an item
     */
    private getItemDescription(itemType: string): string {
        const itemDescs: { [key: string]: string } = {
            'fruit': 'Restores 10 HP',
            'apple': 'Restores 15 HP',
            'pinecone': 'Restores 10 HP',
            'cherry': 'Restores 12 HP',
            'ancient-fruit': 'Restores 25 HP',
            'tree-of-life-fruit': 'Restores 50 HP',
            'mysterious herb': 'A strange herb',
            'nepian-blood': 'Ancient essence',
            'frozen-heart': 'Cold to the touch'
        };
        return itemDescs[itemType] || 'A mysterious item';
    }

    private isFruitItem(itemType: string): boolean {
        const fruitTypes = ['apple', 'pinecone', 'ancient-fruit', 'cherry', 'tree-of-life-fruit', 'fruit'];
        return fruitTypes.includes(itemType);
    }

    private isWeaponItem(itemType: string): boolean {
        return itemType === 'w_longsword';
    }

    private equipWeapon(itemType: string, slotIndex: number): void {
        console.log(`Attempting to equip weapon: ${itemType} from slot ${slotIndex}`);
        
        if (!this.gearUI) {
            console.warn('Gear UI not available for weapon equipping');
            return;
        }

        // Try to equip the weapon
        const success = this.gearUI.equipWeapon(itemType);
        console.log(`Weapon equipping result: ${success}`);
        
        if (success) {
            // Remove weapon from inventory slot
            this.removeItemFromSlot(slotIndex);
            // Update inventory display
            this.updateInventoryDisplay();
            // Hide any existing tooltip
            this.hideItemTooltip();
            console.log(`Successfully equipped weapon: ${itemType}`);
        } else {
            console.warn(`Failed to equip weapon: ${itemType}`);
        }
    }

    // @ts-ignore - Intentionally unused for future functionality
    private _consumeFruit(fruitType: string): void {
        if (!this.player || !this.playerInventory) {
            console.error('Player or inventory not available for fruit consumption');
            return;
        }

        // Check if player has the fruit
        if (!this.playerInventory.has(fruitType, 1)) {
            // No fruit available to consume
            return;
        }

        // Check if player is at full health - prevent consumption if already at 100%
        const currentHealth = this.player.getHitPoints();
        const maxHealth = this.player.getMaxHitPoints();
        
        if (currentHealth >= maxHealth) {
            // Show feedback that health is already full
            this.showHealthFullFeedback();
            return;
        }

        // Calculate actual health that will be restored (prevent overfilling)
        const healthRestore = this.getHealthRestoreAmount(fruitType);
        const actualHealthRestore = Math.min(healthRestore, maxHealth - currentHealth);
        
        // Only proceed if we can actually restore health
        if (actualHealthRestore <= 0) {
            this.showHealthFullFeedback();
            return;
        }

        // Remove fruit from inventory
        this.playerInventory.remove(fruitType, 1);

        // Restore health (limited to not exceed max health)
        this.player.heal(actualHealthRestore);

        // Play consumption sound ONLY when actually consumed
        this.scene.sound.play('collect-herb', { volume: 0.5 });

        // Show health restoration feedback
        this.showHealthRestoreFeedback(actualHealthRestore);

        // Update inventory display
        this.updateInventoryDisplay();
    }

    /**
     * Start consumption with hold-click and progress bar
     */
    private startConsumption(fruitType: string, itemIcon: Phaser.GameObjects.Image): void {
        if (this.isConsuming) return;
        
        // Check if player has the fruit
        if (!this.playerInventory.has(fruitType, 1)) {
            // No fruit available to consume - hide progress bar
            this.consumptionProgressBar.setVisible(false);
            return;
        }

        // Check if player is at full health
        const currentHealth = this.player?.getHitPoints() || 0;
        const maxHealth = this.player?.getMaxHitPoints() || 100;
        
        if (currentHealth >= maxHealth) {
            this.showHealthFullFeedback();
            // Hide progress bar when health is full
            this.consumptionProgressBar.setVisible(false);
            return;
        }

        this.isConsuming = true;
        this.consumptionTarget = fruitType;
        this._consumingItemIcon = itemIcon;
        
        // Position progress bar below the consumable item
        this.updateProgressBarPosition();
        
        // Show progress bar
        this.consumptionProgressBar.setVisible(true);
        
        // Start consumption timer (1 second - faster)
        this.consumptionTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.completeConsumption();
            }
        });
        
        // Start progress bar animation
        this.animateProgressBar();
    }

    /**
     * Stop consumption (when mouse is released or moved away)
     */
    private stopConsumption(): void {
        if (!this.isConsuming) return;
        
        this.isConsuming = false;
        this.consumptionTarget = null;
        this._consumingItemIcon = null;
        
        // Clear timer
        if (this.consumptionTimer) {
            this.consumptionTimer.destroy();
            this.consumptionTimer = null;
        }
        
        // Hide progress bar
        this.consumptionProgressBar.setVisible(false);
        
        // Hide item tooltip
        this.hideItemTooltip();
    }

    /**
     * Complete consumption when timer finishes
     */
    private completeConsumption(): void {
        if (!this.consumptionTarget || !this.isConsuming) return;
        
        const fruitType = this.consumptionTarget;
        
        // Calculate actual health that will be restored
        const currentHealth = this.player?.getHitPoints() || 0;
        const maxHealth = this.player?.getMaxHitPoints() || 100;
        const healthRestore = this.getHealthRestoreAmount(fruitType);
        const actualHealthRestore = Math.min(healthRestore, maxHealth - currentHealth);
        
        if (actualHealthRestore <= 0) {
            this.showHealthFullFeedback();
            this.hideItemTooltipIfEmpty(fruitType);
            this.stopConsumption();
            return;
        }

        // Remove fruit from inventory
        this.playerInventory.remove(fruitType, 1);

        // Restore health
        this.player?.heal(actualHealthRestore);

        // Play consumption sound
        this.scene.sound.play('collect-herb', { volume: 0.5 });

        // Show health restoration feedback
        this.showHealthRestoreFeedback(actualHealthRestore);

        // Update inventory display
        this.updateInventoryDisplay();
        
        // Hide progress bar
        this.consumptionProgressBar.setVisible(false);
        
        // Hide item tooltip only if no more items of this type remain in the slot
        this.hideItemTooltipIfEmpty(fruitType);
        
        // Stop consumption
        this.stopConsumption();
    }

    /**
     * Update progress bar position to be below the consumable item
     */
    private updateProgressBarPosition(): void {
        if (!this.consumptionProgressBar || !this._consumingItemIcon) return;
        
        // Get the item's position relative to the inventory container
        const itemX = this._consumingItemIcon.x;
        const itemY = this._consumingItemIcon.y;
        
        // Get the inventory container's screen position
        const inventoryX = this.inventoryContainer.x;
        const inventoryY = this.inventoryContainer.y;
        
        // Calculate the item's screen position
        const screenX = inventoryX + itemX;
        const screenY = inventoryY + itemY;
        
        // Position progress bar to the right side of the slot, centered vertically
        // Keep it within the slot boundaries
        const progressBarHeight = 6; // Height of the progress bar
        
        this.consumptionProgressBar.setPosition(
            screenX + this.slotSize / 2 - progressBarHeight / 2 - 2, // Shift to the right side of the slot
            screenY // Keep vertical position centered on the item
        );
    }

    /**
     * Animate the progress bar
     */
    private animateProgressBar(): void {
        if (!this.isConsuming) return;
        
        // Update progress bar position to follow the mouse cursor
        this.updateProgressBarPosition();
        
        const progressBarFill = this.consumptionProgressBar.list[1] as Phaser.GameObjects.Graphics;
        progressBarFill.clear();
        
        // Calculate progress (0 to 1) - now using 1 second duration
        const elapsed = this.consumptionTimer ? 1000 - this.consumptionTimer.getRemaining() : 0;
        const progress = Math.min(elapsed / 1000, 1);
        
        // Draw progress fill with new dimensions (centered)
        progressBarFill.fillStyle(0x32CD32, 0.8); // Lime green
        progressBarFill.fillRoundedRect(-this.slotSize/2 + 1, 1, (this.slotSize - 2) * progress, 4, 2);
        
        // Continue animation if still consuming and progress is not complete
        if (this.isConsuming && progress < 1) {
            this.scene.time.delayedCall(16, () => { // ~60fps
                this.animateProgressBar();
            });
        } else if (this.isConsuming && progress >= 1) {
            // Consumption is complete, hide progress bar immediately
            this.consumptionProgressBar.setVisible(false);
        }
    }


    private getHealthRestoreAmount(fruitType: string): number {
        switch (fruitType) {
            case 'apple':
                return 15; // Basic healing
            case 'pinecone':
                return 10; // Lower healing
            case 'ancient-fruit':
                return 25; // High healing (rare)
            case 'cherry':
                return 12; // Medium healing
            case 'tree-of-life-fruit':
                return 50; // Special healing from Tree of Life
            case 'fruit':
                return 10; // Default healing
            default:
                return 10;
        }
    }

    private showHealthRestoreFeedback(amount: number): void {
        if (!this.player) return;

        // Create floating text above player
        const feedbackText = this.scene.add.bitmapText(
            this.player.x, 
            this.player.y - 50, 
            '8-bit', 
            `+${amount} HP`, 
            16
        );
        feedbackText.setOrigin(0.5);
        feedbackText.setTint(0x00ff00);
        feedbackText.setScrollFactor(1);

        // Animate the text
        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                feedbackText.destroy();
            }
        });
    }

    /**
     * Checks if the player can consume fruit (is damaged)
     */
    private canConsumeFruit(): boolean {
        if (!this.player) return false;
        return this.player.getHitPoints() < this.player.getMaxHitPoints();
    }

    /**
     * Shows feedback when player tries to consume fruit at full health
     */
    private showHealthFullFeedback(): void {
        if (!this.player) return;

        const feedbackText = this.scene.add.bitmapText(
            this.player.x, 
            this.player.y - 50, 
            '8-bit', 
            'HEALTH FULL', 
            16
        );
        feedbackText.setOrigin(0.5);
        feedbackText.setTint(0xffaa00); // Orange color for "cannot consume"
        feedbackText.setScrollFactor(1);

        // Animate the text
        this.scene.tweens.add({
            targets: feedbackText,
            y: feedbackText.y - 30,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                feedbackText.destroy();
            }
        });
    }

    public isInventoryVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        // Clean up consumption progress bar
        if (this.consumptionProgressBar) {
            this.consumptionProgressBar.destroy();
        }
        
        // Clean up consumption timer
        if (this.consumptionTimer) {
            this.consumptionTimer.destroy();
        }
        
        if (this.inventoryContainer) {
            this.inventoryContainer.destroy();
        }
    }
}