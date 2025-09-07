/**
 * Lore Manager System
 * 
 * Handles loading, storing, and displaying lore items including tablets,
 * scrolls, and artifacts that players can collect and read throughout the game.
 * 
 * Features:
 * - Centralized lore data management
 * - Collectible lore items system
 * - Readable tablets, scrolls, and artifacts
 * - Progress tracking for discovered lore
 */

import Phaser from 'phaser';

export interface LoreItem {
    id: string;
    title: string;
    content: string;
    type: 'tablet' | 'scroll' | 'artifact';
    description?: string;
    discovered: boolean;
    location?: string;
}

export interface LoreData {
    world: any;
    realms: any;
    history: any;
    characters: any;
    locations: any;
    creatures: any;
    artifacts: any;
    lore_items: {
        tablets: any;
        scrolls: any;
        artifacts: any;
    };
}

export class LoreManager {
    private scene: Phaser.Scene;
    private loreData: LoreData | null = null;
    private discoveredLore: Set<string> = new Set();
    private loreUI: Phaser.GameObjects.Container | null = null;
    private isLoreUIOpen: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.loadLoreData();
        this.loadDiscoveredLore();
    }

    /**
     * Load lore data from JSON file
     */
    private loadLoreData(): void {
        try {
            this.loreData = this.scene.cache.json.get('lore-data');
            console.log('LoreManager: Lore data loaded successfully');
        } catch (error) {
            console.error('LoreManager: Failed to load lore data:', error);
        }
    }

    /**
     * Load discovered lore from localStorage
     */
    private loadDiscoveredLore(): void {
        try {
            const saved = localStorage.getItem('discoveredLore');
            if (saved) {
                const discovered = JSON.parse(saved);
                this.discoveredLore = new Set(discovered);
                console.log(`LoreManager: Loaded ${this.discoveredLore.size} discovered lore items`);
            }
        } catch (error) {
            console.error('LoreManager: Failed to load discovered lore:', error);
        }
    }

    /**
     * Save discovered lore to localStorage
     */
    private saveDiscoveredLore(): void {
        try {
            const discovered = Array.from(this.discoveredLore);
            localStorage.setItem('discoveredLore', JSON.stringify(discovered));
        } catch (error) {
            console.error('LoreManager: Failed to save discovered lore:', error);
        }
    }

    /**
     * Discover a lore item
     */
    public discoverLore(loreId: string): void {
        if (!this.discoveredLore.has(loreId)) {
            this.discoveredLore.add(loreId);
            this.saveDiscoveredLore();
            console.log(`LoreManager: Discovered lore item: ${loreId}`);
            
            // Emit event for UI updates
            this.scene.events.emit('loreDiscovered', loreId);
        }
    }

    /**
     * Check if a lore item has been discovered
     */
    public isLoreDiscovered(loreId: string): boolean {
        return this.discoveredLore.has(loreId);
    }

    /**
     * Get a specific lore item
     */
    public getLoreItem(loreId: string): LoreItem | null {
        if (!this.loreData) return null;

        // Search through all lore items
        const { tablets, scrolls, artifacts } = this.loreData.lore_items;
        
        // Check tablets
        if (tablets[loreId]) {
            return {
                id: loreId,
                title: tablets[loreId].title,
                content: tablets[loreId].content,
                type: 'tablet',
                discovered: this.isLoreDiscovered(loreId)
            };
        }
        
        // Check scrolls
        if (scrolls[loreId]) {
            return {
                id: loreId,
                title: scrolls[loreId].title,
                content: scrolls[loreId].content,
                type: 'scroll',
                discovered: this.isLoreDiscovered(loreId)
            };
        }
        
        // Check artifacts
        if (artifacts[loreId]) {
            return {
                id: loreId,
                title: artifacts[loreId].title,
                content: artifacts[loreId].content,
                type: 'artifact',
                description: artifacts[loreId].description,
                discovered: this.isLoreDiscovered(loreId)
            };
        }

        return null;
    }

    /**
     * Get all discovered lore items
     */
    public getDiscoveredLore(): LoreItem[] {
        const discovered: LoreItem[] = [];
        
        for (const loreId of this.discoveredLore) {
            const loreItem = this.getLoreItem(loreId);
            if (loreItem) {
                discovered.push(loreItem);
            }
        }
        
        return discovered;
    }

    /**
     * Show lore UI with a specific lore item
     */
    public showLoreUI(loreId: string): void {
        const loreItem = this.getLoreItem(loreId);
        if (!loreItem) {
            console.error(`LoreManager: Lore item not found: ${loreId}`);
            return;
        }

        this.createLoreUI(loreItem);
    }

    /**
     * Create the lore UI
     */
    private createLoreUI(loreItem: LoreItem): void {
        if (this.loreUI) {
            this.loreUI.destroy();
        }

        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        // Create main container
        this.loreUI = this.scene.add.container(screenWidth / 2, screenHeight / 2);
        this.loreUI.setDepth(60000);
        this.loreUI.setScrollFactor(0);

        // Background
        const background = this.scene.add.graphics();
        background.fillStyle(0x1a1a1a, 0.95);
        background.fillRoundedRect(-400, -300, 800, 600, 10);
        background.lineStyle(3, 0x4a4a4a, 0.8);
        background.strokeRoundedRect(-400, -300, 800, 600, 10);
        this.loreUI.add(background);

        // Title
        const title = this.scene.add.bitmapText(0, -250, 'pixel-white', loreItem.title, 20);
        title.setOrigin(0.5);
        title.setTint(0xFFD700);
        this.loreUI.add(title);

        // Type indicator
        const typeText = this.scene.add.bitmapText(0, -220, 'pixel-white', `[${loreItem.type.toUpperCase()}]`, 12);
        typeText.setOrigin(0.5);
        typeText.setTint(0x888888);
        this.loreUI.add(typeText);

        // Description (for artifacts)
        if (loreItem.description) {
            const description = this.scene.add.bitmapText(0, -190, 'pixel-white', loreItem.description, 14);
            description.setOrigin(0.5);
            description.setTint(0xCCCCCC);
            description.setMaxWidth(750);
            description.setCenterAlign();
            this.loreUI.add(description);
        }

        // Content
        const content = this.scene.add.bitmapText(0, loreItem.description ? -140 : -180, 'pixel-white', loreItem.content, 14);
        content.setOrigin(0.5);
        content.setTint(0xFFFFFF);
        content.setMaxWidth(750);
        content.setCenterAlign();
        this.loreUI.add(content);

        // Close button
        const closeButton = this.scene.add.graphics();
        closeButton.fillStyle(0x2a2a2a, 0.9);
        closeButton.fillRoundedRect(-50, 250, 100, 30, 5);
        closeButton.lineStyle(2, 0x4a4a4a, 0.8);
        closeButton.strokeRoundedRect(-50, 250, 100, 30, 5);
        closeButton.setInteractive(new Phaser.Geom.Rectangle(-50, 250, 100, 30), Phaser.Geom.Rectangle.Contains);
        
        const closeText = this.scene.add.bitmapText(0, 265, 'pixel-white', 'Close', 12);
        closeText.setOrigin(0.5);
        closeText.setTint(0xFFFFFF);
        
        closeButton.on('pointerdown', () => {
            this.hideLoreUI();
        });
        
        closeButton.on('pointerover', () => {
            closeButton.clear();
            closeButton.fillStyle(0x3a3a3a, 0.9);
            closeButton.fillRoundedRect(-50, 250, 100, 30, 5);
            closeButton.lineStyle(2, 0x5a5a5a, 0.8);
            closeButton.strokeRoundedRect(-50, 250, 100, 30, 5);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.clear();
            closeButton.fillStyle(0x2a2a2a, 0.9);
            closeButton.fillRoundedRect(-50, 250, 100, 30, 5);
            closeButton.lineStyle(2, 0x4a4a4a, 0.8);
            closeButton.strokeRoundedRect(-50, 250, 100, 30, 5);
        });

        this.loreUI.add(closeButton);
        this.loreUI.add(closeText);

        this.isLoreUIOpen = true;
    }

    /**
     * Hide the lore UI
     */
    public hideLoreUI(): void {
        if (this.loreUI) {
            this.loreUI.destroy();
            this.loreUI = null;
        }
        this.isLoreUIOpen = false;
    }

    /**
     * Check if lore UI is open
     */
    public isUIOpen(): boolean {
        return this.isLoreUIOpen;
    }

    /**
     * Get all available lore items (for debugging or admin purposes)
     */
    public getAllLoreItems(): LoreItem[] {
        if (!this.loreData) return [];

        const allItems: LoreItem[] = [];
        const { tablets, scrolls, artifacts } = this.loreData.lore_items;

        // Add tablets
        for (const [id, data] of Object.entries(tablets)) {
            allItems.push({
                id,
                title: (data as any).title,
                content: (data as any).content,
                type: 'tablet',
                discovered: this.isLoreDiscovered(id)
            });
        }

        // Add scrolls
        for (const [id, data] of Object.entries(scrolls)) {
            allItems.push({
                id,
                title: (data as any).title,
                content: (data as any).content,
                type: 'scroll',
                discovered: this.isLoreDiscovered(id)
            });
        }

        // Add artifacts
        for (const [id, data] of Object.entries(artifacts)) {
            allItems.push({
                id,
                title: (data as any).title,
                content: (data as any).content,
                type: 'artifact',
                description: (data as any).description,
                discovered: this.isLoreDiscovered(id)
            });
        }

        return allItems;
    }

    /**
     * Clear all discovered lore (for testing or reset)
     */
    public clearDiscoveredLore(): void {
        this.discoveredLore.clear();
        this.saveDiscoveredLore();
        console.log('LoreManager: All discovered lore cleared');
    }
}
