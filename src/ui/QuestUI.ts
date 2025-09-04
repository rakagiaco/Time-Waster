/**
 * Quest UI System
 * 
 * Displays current quest information in the top right corner of the screen.
 * Follows the same pattern as the health bar with fixed camera positioning.
 * 
 * Features:
 * - Quest title and description display
 * - Progress tracking (e.g., "Collect 3/5 mysterious herbs")
 * - Dynamic updates when quest progress changes
 * - Medieval aesthetic matching the game's theme
 * - Event-driven system for future quest integration
 */

import Phaser from 'phaser';


export interface QuestData {
    id: string;
    title: string;
    description: string;
    type: string;
    amount: number;
    current: number;
}

export class QuestUI {
    private scene: Phaser.Scene;
    private questContainer: Phaser.GameObjects.Container | null = null;
    private questBackground: Phaser.GameObjects.Graphics | null = null;
    private questTitle: Phaser.GameObjects.BitmapText | null = null;
    private questDescription: Phaser.GameObjects.BitmapText | null = null;
    private questProgress: Phaser.GameObjects.BitmapText | null = null;
    private currentQuest: QuestData | null = null;
    private isVisible: boolean = false;

    // UI dimensions
    private readonly QUEST_WIDTH = 350;
    private readonly QUEST_HEIGHT = 180; // Increased height for longer text
    private readonly PADDING = 20;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for quest events
        this.scene.events.on('questAccepted', this.onQuestAccepted, this);
        this.scene.events.on('questProgress', this.onQuestProgress, this);
        this.scene.events.on('questReadyForCompletion', this.onQuestReadyForCompletion, this);
        this.scene.events.on('questCompleted', this.onQuestCompleted, this);
        this.scene.events.on('questAbandoned', this.onQuestAbandoned, this);
    }

    public showQuest(questData: QuestData): void {
        console.log('QuestUI: showQuest called with quest:', questData.title);
        console.log('QuestUI: Current visibility state:', this.isVisible);
        
        if (this.isVisible) {
            console.log('QuestUI: Quest UI already visible, hiding first');
            this.hideQuest();
        }
        
        this.currentQuest = questData;
        this.isVisible = true;
        this.createQuestUI();
        console.log('QuestUI: Quest UI shown successfully');
    }

    public hideQuest(): void {
        this.isVisible = false;
        this.currentQuest = null;
        this.destroyQuestUI();
        console.log('QuestUI: Hiding quest UI');
    }

    public updateQuestProgress(current: number): void {
        if (this.currentQuest) {
            this.currentQuest.current = current;
            this.updateQuestDisplay();
            console.log('QuestUI: Updated quest progress:', current, '/', this.currentQuest.amount);
        }
    }

    private createQuestUI(): void {
        if (!this.currentQuest) return;

        // Create container for quest UI
        this.questContainer = this.scene.add.container(0, 0);
        this.questContainer.setDepth(10000);
        this.questContainer.setScrollFactor(0);

        // Create background
        this.createQuestBackground();

        // Create text elements
        this.createQuestText();

        // Position in top right
        this.updateQuestPosition();
    }

    private createQuestBackground(): void {
        if (!this.questContainer) return;

        this.questBackground = this.scene.add.graphics();
        this.questContainer.add(this.questBackground);

        // Create gradient-like effect with multiple layers
        // Base layer - dark brown
        this.questBackground.fillStyle(0x1a0f0a, 0.95);
        this.questBackground.fillRoundedRect(0, 0, this.QUEST_WIDTH, this.QUEST_HEIGHT, 12);

        // Middle layer - slightly lighter
        this.questBackground.fillStyle(0x2d1810, 0.8);
        this.questBackground.fillRoundedRect(2, 2, this.QUEST_WIDTH - 4, this.QUEST_HEIGHT - 4, 10);

        // Inner layer - parchment-like
        this.questBackground.fillStyle(0x3d2815, 0.6);
        this.questBackground.fillRoundedRect(4, 4, this.QUEST_WIDTH - 8, this.QUEST_HEIGHT - 8, 8);

        // Outer border - gold
        this.questBackground.lineStyle(3, 0xd4af37, 1);
        this.questBackground.strokeRoundedRect(0, 0, this.QUEST_WIDTH, this.QUEST_HEIGHT, 12);

        // Middle border - bronze
        this.questBackground.lineStyle(2, 0xcd7f32, 0.8);
        this.questBackground.strokeRoundedRect(2, 2, this.QUEST_WIDTH - 4, this.QUEST_HEIGHT - 4, 10);

        // Inner border - copper
        this.questBackground.lineStyle(1, 0xb87333, 0.6);
        this.questBackground.strokeRoundedRect(4, 4, this.QUEST_WIDTH - 8, this.QUEST_HEIGHT - 8, 8);

        // Add decorative corner elements
        this.createDecorativeCorners();
    }

    private createDecorativeCorners(): void {
        if (!this.questBackground) return;

        const cornerSize = 8;
        const cornerColor = 0xd4af37;

        // Top-left corner decoration
        this.questBackground.fillStyle(cornerColor, 0.8);
        this.questBackground.fillCircle(cornerSize, cornerSize, cornerSize / 2);

        // Top-right corner decoration
        this.questBackground.fillStyle(cornerColor, 0.8);
        this.questBackground.fillCircle(this.QUEST_WIDTH - cornerSize, cornerSize, cornerSize / 2);

        // Bottom-left corner decoration
        this.questBackground.fillStyle(cornerColor, 0.8);
        this.questBackground.fillCircle(cornerSize, this.QUEST_HEIGHT - cornerSize, cornerSize / 2);

        // Bottom-right corner decoration
        this.questBackground.fillStyle(cornerColor, 0.8);
        this.questBackground.fillCircle(this.QUEST_WIDTH - cornerSize, this.QUEST_HEIGHT - cornerSize, cornerSize / 2);
    }

    private createQuestText(): void {
        if (!this.questContainer || !this.currentQuest) return;

        // Quest title with better styling
        this.questTitle = this.scene.add.bitmapText(
            this.PADDING, this.PADDING,
            'pixel-white', this.currentQuest.title, 16
        );
        this.questTitle.setTint(0xffd700); // Gold color
        this.questTitle.setMaxWidth(this.QUEST_WIDTH - this.PADDING * 2);
        this.questContainer.add(this.questTitle);

        // Quest description with better truncation and wrapping
        const maxDescLength = 120; // Increased from 60 to 120 characters
        let description = this.currentQuest.description;
        if (description.length > maxDescLength) {
            description = description.substring(0, maxDescLength) + '...';
        }

        // Calculate dynamic Y position based on title height
        const titleHeight = this.questTitle.height || 20;
        const descriptionY = this.PADDING + titleHeight + 5;

        this.questDescription = this.scene.add.bitmapText(
            this.PADDING, descriptionY,
            'pixel-white', description, 11
        );
        this.questDescription.setTint(0xf5f5dc); // Beige color for better readability
        this.questDescription.setMaxWidth(this.QUEST_WIDTH - this.PADDING * 2);
        this.questContainer.add(this.questDescription);

        // Calculate dynamic Y position for progress based on description height
        const descriptionHeight = this.questDescription.height || 30;
        const progressY = descriptionY + descriptionHeight + 10;

        // Quest progress with better styling
        this.questProgress = this.scene.add.bitmapText(
            this.PADDING, progressY,
            'pixel-white', this.getProgressText(), 13
        );
        this.questProgress.setTint(0x32cd32); // Forest green color
        this.questProgress.setMaxWidth(this.QUEST_WIDTH - this.PADDING * 2);
        this.questContainer.add(this.questProgress);

        // Add a decorative line separator
        this.createSeparatorLine();
    }

    private createSeparatorLine(): void {
        if (!this.questBackground || !this.questProgress) return;

        // Position separator line just above the progress text
        const lineY = this.questProgress.y - 5;
        const lineStartX = this.PADDING;
        const lineEndX = this.QUEST_WIDTH - this.PADDING;

        // Decorative line with gradient effect
        this.questBackground.lineStyle(2, 0xd4af37, 0.8);
        this.questBackground.lineBetween(lineStartX, lineY, lineEndX, lineY);
        
        this.questBackground.lineStyle(1, 0xffd700, 0.6);
        this.questBackground.lineBetween(lineStartX, lineY - 1, lineEndX, lineY - 1);
    }

    private getProgressText(): string {
        if (!this.currentQuest) return '';
        
        const progress = this.currentQuest.current;
        const total = this.currentQuest.amount;
        const percentage = Math.round((progress / total) * 100);
        
        return `Progress: ${progress}/${total} (${percentage}%)`;
    }

    private updateQuestPosition(): void {
        if (!this.questContainer) return;

        // Position in top right corner
        const x = this.scene.cameras.main.width - this.QUEST_WIDTH - 20;
        const y = 20;
        
        this.questContainer.setPosition(x, y);
    }

    private updateQuestDisplay(): void {
        if (!this.questProgress || !this.currentQuest) return;
        
        this.questProgress.setText(this.getProgressText());
        
        // Update separator line position if it exists
        if (this.questBackground) {
            this.createSeparatorLine();
        }
    }

    private destroyQuestUI(): void {
        if (this.questContainer) {
            this.questContainer.destroy();
            this.questContainer = null;
        }
        
        this.questBackground = null;
        this.questTitle = null;
        this.questDescription = null;
        this.questProgress = null;
    }

    // Event handlers
    private onQuestAccepted(questData: QuestData): void {
        this.showQuest(questData);
    }

    private onQuestProgress(progress: number): void {
        this.updateQuestProgress(progress);
    }

    private onQuestReadyForCompletion(_questData: any): void {
        // Make the quest UI glow green to indicate it's ready for completion
        if (this.questContainer && this.questBackground) {
            // Add a green glow effect
            this.questBackground.lineStyle(4, 0x00ff00, 0.8);
            this.questBackground.strokeRoundedRect(-2, -2, this.QUEST_WIDTH + 4, this.QUEST_HEIGHT + 4, 14);
            
            // Update progress text to show ready status
            if (this.questProgress) {
                this.questProgress.setText('Ready to Complete!');
                this.questProgress.setTint(0x00ff00); // Green color
            }
        }
    }

    private onQuestCompleted(questData: any): void {
        // Show completion message briefly, then hide
        if (this.questProgress) {
            this.questProgress.setText(`Quest Completed: ${questData.questName}!`);
            this.questProgress.setTint(0x00ff00); // Green for completion
            
            // Wait a moment for the quest system to update, then check for other active quests
            this.scene.time.delayedCall(100, () => {
                const questSystem = this.scene.data.get('questSystem');
                const hasOtherActiveQuests = questSystem && questSystem.getActiveQuests().size > 0;
                
                console.log(`QuestUI: Other active quests: ${hasOtherActiveQuests ? 'Yes' : 'No'}`);
                
                if (hasOtherActiveQuests) {
                    // Hide after 3 seconds if there are other quests
                    this.scene.time.delayedCall(2900, () => {
                        this.hideQuest();
                    });
                } else {
                    // Swipe out animation if no other active quests
                    this.scene.time.delayedCall(1900, () => {
                        this.swipeOutQuest();
                    });
                }
            });
        }
    }

    private onQuestAbandoned(): void {
        this.hideQuest();
    }

    private swipeOutQuest(): void {
        if (!this.questContainer) return;
        
        console.log('QuestUI: Starting swipe-out animation');
        
        // Get the current position
        this.questContainer.x;
        const endX = this.scene.cameras.main.width + this.QUEST_WIDTH; // Swipe right off screen
        
        // Create swipe-out animation
        this.scene.tweens.add({
            targets: this.questContainer,
            x: endX,
            duration: 800,
            ease: 'Power2.easeInOut',
            onComplete: () => {
                console.log('QuestUI: Swipe-out animation complete');
                this.hideQuest();
            }
        });
    }

    public getCurrentQuest(): QuestData | null {
        return this.currentQuest;
    }

    public isQuestVisible(): boolean {
        return this.isVisible;
    }

    /**
     * Restores active quests from the QuestSystem after game load
     */
    public restoreActiveQuests(): void {
        console.log('QuestUI: Restoring active quests from QuestSystem...');
        
        const questSystem = this.scene.data.get('questSystem');
        if (!questSystem) {
            console.log('QuestUI: No QuestSystem found, cannot restore quests');
            return;
        }
        
        const activeQuests = questSystem.getActiveQuests();
        if (activeQuests.size === 0) {
            console.log('QuestUI: No active quests to restore');
            return;
        }
        
        // Get the first active quest (assuming only one quest is active at a time)
        const [questId, questProgress] = activeQuests.entries().next().value;
        
        if (questProgress) {
            // Get quest data from cache
            const questData = this.scene.cache.json.get(`quest-${questId}`);
            if (questData) {
                console.log(`QuestUI: Restoring quest ${questId}: ${questData.name}`);
                console.log(`QuestUI: Quest progress: ${questProgress.currentAmount}/${questProgress.requiredAmount}`);
                
                // Create quest data for QuestUI
                const questUIData: QuestData = {
                    id: questId.toString(),
                    title: questData.name,
                    description: questData.requirements,
                    type: questData.questdata.type,
                    amount: questData.questdata.amount,
                    current: questProgress.currentAmount
                };
                
                // Show the quest UI with restored data
                this.showQuest(questUIData);
                
                // If quest is ready for completion, show the green glow
                if (questProgress.isReadyForCompletion) {
                    console.log('QuestUI: Quest is ready for completion, showing green glow');
                    this.onQuestReadyForCompletion({ questId: questId, questName: questData.name });
                }
            } else {
                console.error(`QuestUI: Quest data not found for quest ${questId}`);
            }
        }
    }
}
