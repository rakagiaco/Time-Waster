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
    private slotSize: number = 40;
    private slotSpacing: number = 4;
    private inventoryWidth: number = 0;
    private inventoryHeight: number = 0;
    private playerInventory: any; // Reference to player's inventory
    private player: Player | null = null; // Reference to player for health restoration

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInventory();
        this.setupKeybinds();
    }

    private setupInventory(): void {
        // Calculate inventory dimensions
        const cols = 9;
        const rows = 4;
        const titleHeight = 30; // Space for title
        const padding = 20; // Padding around slots
        
        this.inventoryWidth = (cols * this.slotSize) + ((cols - 1) * this.slotSpacing) + (padding * 2);
        this.inventoryHeight = titleHeight + (rows * this.slotSize) + ((rows - 1) * this.slotSpacing) + (padding * 2);

        // Create main inventory container
        this.inventoryContainer = this.scene.add.container(0, 0);
        this.inventoryContainer.setScrollFactor(0);
        this.inventoryContainer.setDepth(10000);
        this.inventoryContainer.setVisible(false);

        // Create background
        const background = this.scene.add.graphics();
        background.fillStyle(0x2a2a2a, 0.95);
        background.fillRoundedRect(0, 0, this.inventoryWidth, this.inventoryHeight, 8);
        background.lineStyle(3, 0x8B4513, 1);
        background.strokeRoundedRect(0, 0, this.inventoryWidth, this.inventoryHeight, 8);
        this.inventoryContainer.add(background);

        // Create title
        const title = this.scene.add.bitmapText(padding, padding, 'pixel-white', 'INVENTORY', 16);
        title.setScrollFactor(0);
        this.inventoryContainer.add(title);

        // Create inventory slots
        this.createInventorySlots();

        // Center the inventory on screen
        this.centerInventory();
    }

    private createInventorySlots(): void {
        const cols = 9;
        const rows = 4;
        const padding = 20;
        const titleHeight = 30;
        const startX = padding;
        const startY = titleHeight + padding;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const slotIndex = row * cols + col;
                const x = startX + (col * (this.slotSize + this.slotSpacing));
                const y = startY + (row * (this.slotSize + this.slotSpacing));

                const slotContainer = this.createSlot(x, y, slotIndex);
                this.inventorySlots.push(slotContainer);
                this.inventoryContainer.add(slotContainer);
            }
        }
    }

    private createSlot(x: number, y: number, index: number): Phaser.GameObjects.Container {
        const slotContainer = this.scene.add.container(x, y);

        // Slot background
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(0x8B4513, 1);
        slotBg.fillRoundedRect(0, 0, this.slotSize, this.slotSize, 4);
        slotBg.lineStyle(2, 0x654321, 1);
        slotBg.strokeRoundedRect(0, 0, this.slotSize, this.slotSize, 4);
        slotContainer.add(slotBg);

        // Slot highlight (for hover/selection)
        const slotHighlight = this.scene.add.graphics();
        slotHighlight.lineStyle(3, 0xffff00, 0);
        slotHighlight.strokeRoundedRect(-2, -2, this.slotSize + 4, this.slotSize + 4, 6);
        slotContainer.add(slotHighlight);

        // Item icon (will be added when items are present)
        const itemIcon = this.scene.add.image(this.slotSize / 2, this.slotSize / 2, 'rect');
        itemIcon.setVisible(false);
        itemIcon.setScale(0.8);
        slotContainer.add(itemIcon);

        // Item count text
        const itemCount = this.scene.add.bitmapText(this.slotSize - 5, this.slotSize - 5, 'pixel-white', '', 10);
        itemCount.setOrigin(1, 1);
        itemCount.setVisible(false);
        slotContainer.add(itemCount);

        // Store references for later use
        (slotContainer as any).slotIndex = index;
        (slotContainer as any).itemIcon = itemIcon;
        (slotContainer as any).itemCount = itemCount;
        (slotContainer as any).slotHighlight = slotHighlight;

        return slotContainer;
    }

    private centerInventory(): void {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        this.inventoryContainer.setPosition(
            centerX - this.inventoryWidth / 2,
            centerY - this.inventoryHeight / 2
        );
    }

    private setupKeybinds(): void {
        // Toggle inventory with I or Tab
        this.scene.input.keyboard?.on('keydown-I', () => {
            this.toggle();
        });

        this.scene.input.keyboard?.on('keydown-TAB', () => {
            this.toggle();
        });

        // Close inventory with Escape
        this.scene.input.keyboard?.on('keydown-ESC', () => {
            if (this.isVisible) {
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
        this.isVisible = true;
        this.inventoryContainer.setVisible(true);
        this.updateInventoryDisplay();
        console.log('Inventory opened');
    }

    public hide(): void {
        this.isVisible = false;
        this.inventoryContainer.setVisible(false);
        console.log('Inventory closed');
    }

    public isInventoryVisible(): boolean {
        return this.isVisible;
    }

    public setPlayerInventory(inventory: any): void {
        this.playerInventory = inventory;
        if (this.isVisible) {
            this.updateInventoryDisplay();
        }
    }

    public setPlayer(player: Player): void {
        this.player = player;
    }

    private updateInventoryDisplay(): void {
        if (!this.playerInventory) return;

        // Clear all slots first
        this.inventorySlots.forEach(slot => {
            const itemIcon = (slot as any).itemIcon;
            const itemCount = (slot as any).itemCount;
            
            itemIcon.setVisible(false);
            itemCount.setVisible(false);
        });

        // Get inventory data
        const inventoryData = this.playerInventory.getInventoryData();
        let slotIndex = 0;

        // Display items in slots
        inventoryData.forEach((item: any) => {
            if (slotIndex < this.inventorySlots.length) {
                const slot = this.inventorySlots[slotIndex];
                const itemIcon = (slot as any).itemIcon;
                const itemCount = (slot as any).itemCount;

                // Set item icon
                itemIcon.setTexture(item.type || 'rect');
                itemIcon.setVisible(true);

                // Set item count if more than 1
                if (item.count > 1) {
                    itemCount.setText(item.count.toString());
                    itemCount.setVisible(true);
                } else {
                    itemCount.setVisible(false);
                }

                // Make fruit items clickable for consumption
                if (this.isFruitItem(item.type)) {
                    itemIcon.setInteractive();
                    itemIcon.on('pointerdown', () => {
                        this.consumeFruit(item.type);
                    });
                    // Add visual indicator that it's consumable
                    itemIcon.setTint(0x88ff88); // Light green tint for consumable items
                } else {
                    itemIcon.removeInteractive();
                    itemIcon.clearTint();
                }

                slotIndex++;
            }
        });
    }

    public update(): void {
        // Update inventory display if visible
        if (this.isVisible && this.playerInventory) {
            this.updateInventoryDisplay();
        }
    }

    private isFruitItem(itemType: string): boolean {
        const fruitTypes = ['apple', 'pinecone', 'ancient-fruit', 'cherry', 'fruit'];
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
            case 'fruit':
                return 10; // Default healing
            default:
                return 10;
        }
    }

    private showHealthRestoreFeedback(amount: number): void {
        if (!this.player) return;

        // Create floating text showing health restoration
        const healText = this.scene.add.bitmapText(
            this.player.x + Phaser.Math.Between(-20, 20),
            this.player.y - 30,
            'pixel-green',
            `+${amount} HP`,
            16
        );
        healText.setOrigin(0.5);

        // Animate the text floating up and fading out
        this.scene.tweens.add({
            targets: healText,
            y: healText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                healText.destroy();
            }
        });
    }

    public destroy(): void {
        this.inventoryContainer.destroy();
    }
}
