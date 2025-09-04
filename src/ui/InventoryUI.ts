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
    private inventorySlots: Phaser.GameObjects.Container[] = [];

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
                const slotX = startX + (col * (this.slotSize + this.slotSpacing));
                const slotY = startY + (row * (this.slotSize + this.slotSpacing));
                
                // Create medieval slot background
                const slotBg = this.createMedievalSlot(slotX, slotY);
                
                // Create slot container
                const slotContainer = this.scene.add.container(0, 0);
                slotContainer.setScrollFactor(0);
                slotContainer.add(slotBg);
                
                // Add hover effects
                this.addSlotInteractivity(slotContainer, slotX, slotY);
                
                this.inventorySlots.push(slotContainer);
                this.inventoryContainer.add(slotContainer);
            }
        }
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
    private addSlotInteractivity(slotContainer: Phaser.GameObjects.Container, slotX: number, slotY: number): void {
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
     * Highlights a slot when hovered - VERY SUBTLE effect
     */
    private highlightSlot(slotContainer: Phaser.GameObjects.Container, highlight: boolean): void {
        if (highlight) {
            // Very subtle glow effect
            slotContainer.list.forEach(child => {
                if (child instanceof Phaser.GameObjects.Graphics) {
                    child.setAlpha(0.95);
                }
            });
            
            // Barely noticeable scale - just a hint
            this.scene.tweens.add({
                targets: slotContainer,
                scaleX: 1.01,
                scaleY: 1.01,
                duration: 200,
                ease: 'Power1'
            });
        } else {
            // Remove glow
            slotContainer.list.forEach(child => {
                if (child instanceof Phaser.GameObjects.Graphics) {
                    child.setAlpha(1);
                }
            });
            
            // Scale back to normal
            this.scene.tweens.add({
                targets: slotContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Power1'
            });
        }
    }

    private setupKeybinds(): void {
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (event.code === 'KeyI') {
                this.toggle();
            }
            
            // Handle ESC key with priority system
            if (event.code === 'Escape') {
                const worldScene = this.scene as any;
                if (worldScene.getPauseMenu && worldScene.getPauseMenu().isMenuVisible()) {
                    // Let pause menu handle ESC
                    return;
                }
                this.hide();
            }
        });
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
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
        
        this.isVisible = false;
        this.inventoryContainer.setVisible(false);
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

        // Now populate with inventory data
        const inventoryData = this.playerInventory.getInventoryData();
        let slotIndex = 0;

        inventoryData.forEach(([itemType, count]: [string, number]) => {
            if (slotIndex >= this.inventorySlots.length) return;

            const slot = this.inventorySlots[slotIndex];
            const slotX = 30 + ((slotIndex % 9) * (this.slotSize + this.slotSpacing));
            const slotY = 70 + (Math.floor(slotIndex / 9) * (this.slotSize + this.slotSpacing));
            
            // Create enhanced item icon with medieval styling
            const itemIcon = this.createMedievalItemIcon(itemType, slotX, slotY);
            slot.add(itemIcon);

            // Create enhanced count display with the nice gold ring
            if (count > 1) {
                const countDisplay = this.createItemCountDisplay(count, slotX, slotY);
                slot.add(countDisplay);
            }

            // Add item interactions and tooltips
            this.addItemInteractions(itemIcon, itemType, count, slot);

            slotIndex++;
        });
    }

    /**
     * Creates a medieval-styled item icon with shadows and proper scaling
     */
    private createMedievalItemIcon(itemType: string, slotX: number, slotY: number): Phaser.GameObjects.Image {
        // Check if texture exists, create fallback if not
        if (!this.scene.textures.exists(itemType)) {
            this.createFallbackTexture(itemType);
        }
        
        const itemIcon = this.scene.add.image(
            slotX + this.slotSize / 2, 
            slotY + this.slotSize / 2, 
            itemType
        );
        itemIcon.setScale(0.8); // Good size for medieval slots
        itemIcon.setScrollFactor(0);
        
        // Apply visual modifications to fruit types to make them distinct
        this.applyFruitVisualModifications(itemIcon, itemType);
        
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

    private applyFruitVisualModifications(itemIcon: Phaser.GameObjects.Image, itemType: string): void {
        // Apply different visual modifications to make fruit types distinct
        switch (itemType) {
            case 'apple':
                // Red tint for apples
                itemIcon.setTint(0xff6b6b);
                break;
            case 'pinecone':
                // Brown tint for pinecones
                itemIcon.setTint(0x8b4513);
                break;
            case 'ancient-fruit':
                // Purple tint for ancient fruit
                itemIcon.setTint(0x9b59b6);
                break;
            case 'cherry':
                // Pink tint for cherries
                itemIcon.setTint(0xff69b4);
                break;
            case 'tree-of-life-fruit':
                // Golden tint for Tree of Life fruit
                itemIcon.setTint(0xffd700);
                break;
            case 'fruit':
                // No tint for generic fruit
                itemIcon.clearTint();
                break;
            default:
                // No modification for other items
                break;
        }
    }

    /**
     * Creates the nice gold ring item count display you liked
     */
    private createItemCountDisplay(count: number, slotX: number, slotY: number): Phaser.GameObjects.Container {
        const countContainer = this.scene.add.container(0, 0);
        
        // Background for count (small medieval badge) - the original design you liked
        const countBg = this.scene.add.graphics();
        countBg.fillStyle(0x8B4513, 0.9); // Bronze background
        countBg.fillCircle(slotX + this.slotSize - 8, slotY + this.slotSize - 8, 8);
        countBg.lineStyle(1, 0xDAA520, 1); // Gold border
        countBg.strokeCircle(slotX + this.slotSize - 8, slotY + this.slotSize - 8, 8);
        countBg.setScrollFactor(0);
        countContainer.add(countBg);
        
        // Count text
        const countText = this.scene.add.bitmapText(
            slotX + this.slotSize - 8, 
            slotY + this.slotSize - 8, 
            '8-bit', 
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
        itemIcon.setInteractive({ useHandCursor: true });
        
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
            } else {
                itemIcon.setTint(0xCCCCCC); // Subtle highlight for other items
            }
            
            // Very subtle scale effect
            this.scene.tweens.add({
                targets: itemIcon,
                scaleX: 0.85,
                scaleY: 0.85,
                duration: 200,
                ease: 'Power1'
            });
        });
        
        itemIcon.on('pointerout', () => {
            this.hideItemTooltip();
            itemIcon.clearTint();
            
            // Scale back
            this.scene.tweens.add({
                targets: itemIcon,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 200,
                ease: 'Power1'
            });
        });
        
        // Click interactions - FRUIT CONSUMPTION WORKS
        itemIcon.on('pointerdown', () => {
            if (this.isFruitItem(itemType)) {
                // Hide tooltip immediately when attempting to consume
                this.hideItemTooltip();
                
                    this.consumeFruit(itemType);
                
                // Add click animation regardless (visual feedback for interaction)
                this.scene.tweens.add({
                    targets: itemIcon,
                    scaleX: 0.9,
                    scaleY: 0.9,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        });
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
                '8-bit', 
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
    private createMedievalTooltipBackground(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
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
    private addTooltipCornerDecorations(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
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
    private addTooltipTexture(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
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

    private consumeFruit(fruitType: string): void {
        if (!this.player || !this.playerInventory) {
            console.error('Player or inventory not available for fruit consumption');
            return;
        }

        // Check if player has the fruit
        if (!this.playerInventory.has(fruitType, 1)) {
            console.log(`No ${fruitType} available to consume`);
            return;
        }

        // Check if player is at full health - prevent consumption if already at 100%
        const currentHealth = this.player.getHitPoints();
        const maxHealth = this.player.getMaxHitPoints();
        
        if (currentHealth >= maxHealth) {
            console.log(`Player health is already full (${currentHealth}/${maxHealth}) - cannot consume fruit`);
            // Show feedback that health is already full
            this.showHealthFullFeedback();
            return;
        }

        // Calculate actual health that will be restored (prevent overfilling)
        const healthRestore = this.getHealthRestoreAmount(fruitType);
        const actualHealthRestore = Math.min(healthRestore, maxHealth - currentHealth);
        
        // Only proceed if we can actually restore health
        if (actualHealthRestore <= 0) {
            console.log(`No health can be restored - player at max health`);
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

        console.log(`Consumed ${fruitType} and restored ${actualHealthRestore} health (${currentHealth + actualHealthRestore}/${maxHealth})`);
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
        if (this.inventoryContainer) {
            this.inventoryContainer.destroy();
        }
    }
}