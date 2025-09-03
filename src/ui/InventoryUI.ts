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
    private slotCount: number = 36; // 4 rows x 9 columns (Minecraft style)
    private slotSize: number = 24; // Further reduced from 32 to 24
    private slotSpacing: number = 1; // Further reduced from 2 to 1
    private inventoryWidth: number = 0;
    private inventoryHeight: number = 0;
    private playerInventory: any; // Reference to player's inventory
    private player: Player | null = null; // Reference to player for health restoration
    private draggedItem: any = null;
    private draggedSlotIndex: number = -1;

    constructor(scene: Phaser.Scene) {
        console.log('InventoryUI constructor called'); // Debug logging
        this.scene = scene;
        this.setupInventory();
        this.setupKeybinds();
        console.log('InventoryUI constructor complete'); // Debug logging
    }

    private setupInventory(): void {
        // Calculate inventory dimensions with proper spacing
        const cols = 9;
        const rows = 4;
        const titleHeight = 30;
        const padding = 15; // Increased padding for better containment
        
        // Calculate total content width/height
        const contentWidth = (cols * this.slotSize) + ((cols - 1) * this.slotSpacing);
        const contentHeight = (rows * this.slotSize) + ((rows - 1) * this.slotSpacing);
        
        this.inventoryWidth = contentWidth + (padding * 2);
        this.inventoryHeight = titleHeight + contentHeight + (padding * 2);

        // Create main inventory container
        this.inventoryContainer = this.scene.add.container(0, 0);
        this.inventoryContainer.setScrollFactor(0);
        this.inventoryContainer.setDepth(10000);
        this.inventoryContainer.setVisible(false);

        // Create background with proper bounds
        const background = this.scene.add.graphics();
        background.fillStyle(0x2a2a2a, 0.95);
        background.fillRoundedRect(0, 0, this.inventoryWidth, this.inventoryHeight, 8);
        background.lineStyle(3, 0x8B4513, 1);
        background.strokeRoundedRect(0, 0, this.inventoryWidth, this.inventoryHeight, 8);
        background.setScrollFactor(0);
        this.inventoryContainer.add(background);



        // Create title
        const title = this.scene.add.bitmapText(this.inventoryWidth / 2, 15, '8-bit', 'INVENTORY', 20);
        title.setOrigin(0.5);
        title.setTint(0x8B4513);
        title.setScrollFactor(0);
        this.inventoryContainer.add(title);

        // Create inventory slots with proper positioning
        this.createInventorySlots(padding, titleHeight + padding);
    }

        private createInventorySlots(startX: number, startY: number): void {
        const cols = 9;
        const rows = 4;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const slotIndex = row * cols + col;
                const slotX = startX + (col * (this.slotSize + this.slotSpacing));
                const slotY = startY + (row * (this.slotSize + this.slotSpacing));
                
                // Create slot background with proper bounds
                const slotBg = this.scene.add.graphics();
                slotBg.fillStyle(0x1a1a1a, 1);
                slotBg.fillRect(0, 0, this.slotSize, this.slotSize);
                slotBg.lineStyle(1, 0x8B4513, 1);
                slotBg.strokeRect(0, 0, this.slotSize, this.slotSize);
                slotBg.setScrollFactor(0);
                
                // Create slot container positioned at the calculated coordinates
                const slotContainer = this.scene.add.container(slotX, slotY);
                slotContainer.setScrollFactor(0);
                slotContainer.add(slotBg);
                
                // Make slot interactive for drag and drop
                slotContainer.setSize(this.slotSize, this.slotSize);
                slotContainer.setInteractive({ useHandCursor: true });
                
                // Add click handler for item consumption
                slotContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    this.handleSlotClick(slotIndex, pointer);
                });
                
                // Add drag handlers
                slotContainer.on('dragstart', (pointer: Phaser.Input.Pointer) => {
                    this.handleDragStart(slotIndex, pointer);
                });
                
                slotContainer.on('drag', (pointer: Phaser.Input.Pointer) => {
                    this.handleDrag(slotIndex, pointer);
                });
                
                slotContainer.on('dragend', (pointer: Phaser.Input.Pointer) => {
                    this.handleDragEnd(slotIndex, pointer);
                });
                
                this.inventorySlots.push(slotContainer);
                this.inventoryContainer.add(slotContainer);
            }
        }
    }

    private setupKeybinds(): void {
        console.log('Setting up inventory keybinds...'); // Debug logging
        
        if (!this.scene.input.keyboard) {
            console.error('Keyboard input not available!'); // Debug logging
            return;
        }
        
        // Use Phaser's key system instead of generic keyboard events
        const keyI = this.scene.input.keyboard.addKey('I');
        const keyEsc = this.scene.input.keyboard.addKey('ESC');
        
        keyI.on('down', () => {
            console.log('I key pressed, toggling inventory'); // Debug logging
            this.toggle();
        });
        
        keyEsc.on('down', () => {
            const worldScene = this.scene as any;
            if (worldScene.getPauseMenu && worldScene.getPauseMenu().isMenuVisible()) {
                // Let pause menu handle ESC
                return;
            }
            this.hide();
        });
        
        console.log('Inventory keybinds setup complete'); // Debug logging
    }

    public toggle(): void {
        console.log('Inventory toggle called, current visibility:', this.isVisible); // Debug logging
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public show(): void {
        console.log('Inventory show called, current visibility:', this.isVisible); // Debug logging
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.positionInventory();
        this.updateInventoryDisplay();
        this.inventoryContainer.setVisible(true);
        console.log('Inventory should now be visible'); // Debug logging
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

    public updateInventoryDisplay(): void {
        if (!this.playerInventory) return;

        // Clear all slots
        this.inventorySlots.forEach(slot => {
            // Remove all children except the background (index 0)
            while (slot.length > 1) {
                slot.removeAt(1);
            }
        });

        // Get inventory data with safety check
        let inventoryData: [string, number][];
        try {
            const data = this.playerInventory.getInventoryData();
            inventoryData = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error getting inventory data:', error);
            inventoryData = [];
        }
        
        let slotIndex = 0;

        inventoryData.forEach(([itemType, count]) => {
            if (slotIndex >= this.inventorySlots.length) return;

            const slot = this.inventorySlots[slotIndex];
            
            // Create item icon
            const itemIcon = this.scene.add.image(this.slotSize / 2, this.slotSize / 2, itemType);
            itemIcon.setScale(0.8);
            itemIcon.setScrollFactor(0);
            slot.add(itemIcon);

            // Create count text
            if (count > 1) {
                const countText = this.scene.add.bitmapText(this.slotSize - 5, this.slotSize - 5, '8-bit', count.toString(), 12);
                countText.setOrigin(1, 1);
                countText.setTint(0xffffff);
                countText.setScrollFactor(0);
                slot.add(countText);
            }

            // Make fruit items clickable
            if (this.isFruitItem(itemType)) {
                itemIcon.setInteractive({ useHandCursor: true });
                itemIcon.on('pointerdown', () => {
                    this.consumeFruit(itemType);
                });
                // Add visual indicator that it's consumable
                itemIcon.setTint(0x88ff88); // Light green tint for consumable items
            } else {
                itemIcon.removeInteractive();
                itemIcon.clearTint();
            }

            slotIndex++;
        });
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

        // Remove fruit from inventory
        this.playerInventory.remove(fruitType, 1);

        // Restore health based on fruit type
        const healthRestore = this.getHealthRestoreAmount(fruitType);
        this.player.heal(healthRestore);

        // Play consumption sound
        this.scene.sound.play('collect-herb', { volume: 0.5 });

        // Show health restoration feedback
        this.showHealthRestoreFeedback(healthRestore);

        // Update inventory display
        this.updateInventoryDisplay();

        console.log(`Consumed ${fruitType} and restored ${healthRestore} health`);
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

    public isInventoryVisible(): boolean {
        return this.isVisible;
    }

    public destroy(): void {
        if (this.inventoryContainer) {
            this.inventoryContainer.destroy();
        }
    }

    private handleSlotClick(slotIndex: number, pointer: Phaser.Input.Pointer): void {
        if (!this.playerInventory) return;
        
        try {
            const inventoryData = this.playerInventory.getInventoryData();
            if (!Array.isArray(inventoryData)) return;
            
            const item = inventoryData[slotIndex];
            if (item && item[0] && item[1] > 0) {
                // Consume item (heal player)
                this.consumeItem(item[0], slotIndex);
            }
        } catch (error) {
            console.error('Error handling slot click:', error);
        }
    }

    private handleDragStart(slotIndex: number, pointer: Phaser.Input.Pointer): void {
        if (!this.playerInventory) return;
        
        try {
            const inventoryData = this.playerInventory.getInventoryData();
            if (!Array.isArray(inventoryData)) return;
            
            const item = inventoryData[slotIndex];
            if (item && item[0] && item[1] > 0) {
                this.draggedItem = item;
                this.draggedSlotIndex = slotIndex;
                
                // Enable dragging on the slot
                const slot = this.inventorySlots[slotIndex];
                if (slot) {
                    slot.setInteractive({ draggable: true });
                }
            }
        } catch (error) {
            console.error('Error handling drag start:', error);
        }
    }

    private handleDrag(slotIndex: number, pointer: Phaser.Input.Pointer): void {
        // Visual feedback during drag
        if (this.draggedItem && this.inventorySlots[slotIndex]) {
            const slot = this.inventorySlots[slotIndex];
            slot.setAlpha(0.7);
        }
    }

    private handleDragEnd(slotIndex: number, pointer: Phaser.Input.Pointer): void {
        if (!this.playerInventory || !this.draggedItem) return;
        
        try {
            // Reset visual feedback
            this.inventorySlots.forEach(slot => slot.setAlpha(1));
            
            // If dropped on a different slot, swap items
            if (slotIndex !== this.draggedSlotIndex && slotIndex >= 0 && slotIndex < this.slotCount) {
                this.swapItems(this.draggedSlotIndex, slotIndex);
            }
            
            // Reset drag state
            this.draggedItem = null;
            this.draggedSlotIndex = -1;
            
            // Update display
            this.updateInventoryDisplay();
        } catch (error) {
            console.error('Error handling drag end:', error);
        }
    }

    private swapItems(fromSlot: number, toSlot: number): void {
        if (!this.playerInventory) return;
        
        try {
            const inventoryData = this.playerInventory.getInventoryData();
            if (!Array.isArray(inventoryData)) return;
            
            // Swap items
            const temp = inventoryData[fromSlot];
            inventoryData[fromSlot] = inventoryData[toSlot];
            inventoryData[toSlot] = temp;
            
            // Update inventory
            this.playerInventory.setInventoryData(inventoryData);
        } catch (error) {
            console.error('Error swapping items:', error);
        }
    }

    private consumeItem(itemType: string, slotIndex: number): void {
        if (!this.player || !this.playerInventory) return;
        
        try {
            // Remove one item from inventory
            this.playerInventory.removeItem(itemType, 1);
            
            // Heal player (assuming fruits heal)
            if (itemType === 'fruit') {
                this.player.heal(10); // Heal 10 HP
                console.log('Consumed fruit, healed 10 HP');
            }
            
            // Update display
            this.updateInventoryDisplay();
        } catch (error) {
            console.error('Error consuming item:', error);
        }
    }
}