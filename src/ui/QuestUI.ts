/**
 * Modern Quest UI System
 * 
 * A sleek, compact quest tracking system positioned in the top-right corner.
 * Features modern styling, progress bars, and smooth animations.
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
    private questTitle: Phaser.GameObjects.Text | null = null;
    private questDescription: Phaser.GameObjects.Text | null = null;
    private questProgress: Phaser.GameObjects.Text | null = null;
    private progressBar: Phaser.GameObjects.Graphics | null = null;
    private progressBarBg: Phaser.GameObjects.Graphics | null = null;
    private currentQuest: QuestData | null = null;
    private isVisible: boolean = false;

    // Modern UI dimensions - compact and sleek
    private readonly QUEST_WIDTH = 280;
    private readonly QUEST_HEIGHT = 130; // Increased from 120 to 130 to accommodate progress text
    private readonly PADDING = 15;
    private readonly PROGRESS_BAR_WIDTH = 200;
    private readonly PROGRESS_BAR_HEIGHT = 8;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.scene.events.on('questAccepted', this.onQuestAccepted, this);
        this.scene.events.on('questProgress', this.onQuestProgress, this);
        this.scene.events.on('questCompleted', this.onQuestCompleted, this);
        this.scene.events.on('questAbandoned', this.onQuestAbandoned, this);
    }

    private onQuestAccepted(questData: QuestData): void {
        console.log('QuestUI: Quest accepted, data:', questData);
        
        // Prevent duplicate quest acceptance
        if (this.currentQuest && this.currentQuest.id === questData.id) {
            console.log('QuestUI: Quest already active, ignoring duplicate acceptance');
            return;
        }
        
        this.currentQuest = questData;
        this.showQuestUI();
        // updateQuestDisplay() will be called after the UI is created in showQuestUI()
    }

    private onQuestProgress(questId: number, currentAmount: number): void {
        if (this.currentQuest && this.currentQuest.id === questId.toString()) {
            this.currentQuest.current = currentAmount;
            this.updateQuestDisplay();
        }
    }

    private onQuestCompleted(questData: QuestData): void {
        console.log('QuestUI: Quest completed event received for quest:', questData.id);
        console.log('QuestUI: Current quest ID:', this.currentQuest?.id);
        
        // Check both id and questId fields for compatibility (with type conversion)
        const questIdMatches = this.currentQuest && (
            this.currentQuest.id == questData.id || 
            this.currentQuest.id == questData.questId ||
            String(this.currentQuest.id) === String(questData.id) ||
            String(this.currentQuest.id) === String(questData.questId)
        );
        
        if (questIdMatches) {
            console.log('QuestUI: Showing completion animation and scheduling hide');
            this.showCompletionAnimation();
            this.scene.time.delayedCall(1500, () => { // Reduced from 3000ms to 1500ms
                console.log('QuestUI: Hiding quest UI after delay');
                this.hideQuestUI();
            });
        } else {
            console.log('QuestUI: Quest ID mismatch or no current quest, not hiding UI');
        }
    }

    private onQuestAbandoned(questData: QuestData): void {
        if (this.currentQuest && this.currentQuest.id === questData.id) {
            this.hideQuestUI();
        }
    }

    private showQuestUI(): void {
        if (this.isVisible) return;
        
        // Clean up any existing container first
        if (this.questContainer) {
            console.log('QuestUI: Cleaning up existing container before creating new one');
            this.questContainer.destroy();
            this.questContainer = null;
        }
        
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // Position in top-right corner (start off-screen to the right)
        const startX = screenWidth + 300; // Start off-screen
        const endX = screenWidth - 20;    // End position
        const y = 20;
        
        this.questContainer = this.scene.add.container(startX, y);
        this.questContainer.setDepth(15000);
        this.questContainer.setScrollFactor(0);

        console.log(`QuestUI: Created container at (${startX}, ${y}) with depth 15000`);
        
        // Add a longer delay to ensure the scene and WebGL context are fully ready before creating text objects
        this.scene.time.delayedCall(500, () => {
            this.createQuestPanel();
            this.isVisible = true;
            
            // Update the quest display after the panel is created
            this.updateQuestDisplay();
            
            // Slide in animation
            this.scene.tweens.add({
                targets: this.questContainer,
                x: endX,
                duration: 500,
                ease: 'Power2.easeOut'
            });
        });
    }

    private createQuestPanel(): void {
        if (!this.questContainer) return;

        // Modern quest panel background
        this.questBackground = this.scene.add.graphics();
        this.questContainer.add(this.questBackground);

        // Main panel with modern styling
        this.questBackground.fillStyle(0x1a1a1a, 0.95);
        this.questBackground.fillRoundedRect(
            -this.QUEST_WIDTH, 0,
            this.QUEST_WIDTH, this.QUEST_HEIGHT,
            8
        );
        
        // Subtle border
        this.questBackground.lineStyle(2, 0x4a4a4a, 0.8);
        this.questBackground.strokeRoundedRect(
            -this.QUEST_WIDTH, 0,
            this.QUEST_WIDTH, this.QUEST_HEIGHT,
            8
        );
        
        // Inner highlight
        this.questBackground.lineStyle(1, 0x666666, 0.6);
        this.questBackground.strokeRoundedRect(
            -this.QUEST_WIDTH + 2, 2,
            this.QUEST_WIDTH - 4, this.QUEST_HEIGHT - 4,
            6
        );
        
        // Quest header with icon
        this.createQuestHeader();
        
        // Quest content
        this.createQuestContent();
    }

    private createQuestHeader(): void {
        if (!this.questContainer) return;
        
        // Quest icon (simple circle for now)
        const questIcon = this.scene.add.graphics();
        questIcon.fillStyle(0xFFD700, 0.8);
        questIcon.fillCircle(-this.QUEST_WIDTH + 25, 20, 8);
        questIcon.lineStyle(2, 0xFFA500, 0.9);
        questIcon.strokeCircle(-this.QUEST_WIDTH + 25, 20, 8);
        this.questContainer.add(questIcon);
        
        // Quest title - using BitmapText for crisp rendering
        try {
            this.questTitle = this.scene.add.bitmapText(
                -this.QUEST_WIDTH + 45, 15,
                'pixel-white', '', 14
            );
            this.questTitle.setTint(0xFFD700); // Gold color
            this.questTitle.setMaxWidth(this.QUEST_WIDTH - 60);
            this.questContainer.add(this.questTitle);
        } catch (error) {
            console.warn('QuestUI: Error creating quest title text:', error);
            // Fallback: create a simple bitmap text
            this.questTitle = this.scene.add.bitmapText(
                -this.QUEST_WIDTH + 45, 15,
                'pixel-white', '', 12
            );
            this.questTitle.setTint(0xFFD700);
            this.questContainer.add(this.questTitle);
        }
    }

    private createQuestContent(): void {
        if (!this.questContainer) return;

        // Quest description - using BitmapText for crisp rendering
        try {
            this.questDescription = this.scene.add.bitmapText(
                -this.QUEST_WIDTH + this.PADDING, 45,
                'pixel-white', '', 10
            );
            this.questDescription.setTint(0xCCCCCC); // Light gray color
            this.questDescription.setMaxWidth(this.QUEST_WIDTH - (this.PADDING * 2));
            this.questContainer.add(this.questDescription);
        } catch (error) {
            console.warn('QuestUI: Error creating quest description text:', error);
            // Fallback: create a simple bitmap text
            this.questDescription = this.scene.add.bitmapText(
                -this.QUEST_WIDTH + this.PADDING, 45,
                'pixel-white', '', 8
            );
            this.questDescription.setTint(0xCCCCCC);
            this.questContainer.add(this.questDescription);
        }

        // Progress bar background
        this.progressBarBg = this.scene.add.graphics();
        this.questContainer.add(this.progressBarBg);
        
        // Progress bar
        this.progressBar = this.scene.add.graphics();
        this.questContainer.add(this.progressBar);
        
        // Progress text - using BitmapText for crisp rendering
        try {
            this.questProgress = this.scene.add.bitmapText(
                -this.QUEST_WIDTH + this.PADDING, 100, // Moved from 95 to 100 for better positioning
                'pixel-white', '', 10
            );
            this.questProgress.setTint(0xFFFFFF); // White color
            this.questContainer.add(this.questProgress);
        } catch (error) {
            console.warn('QuestUI: Error creating quest progress text:', error);
            // Fallback: create a simple bitmap text
            this.questProgress = this.scene.add.bitmapText(
                -this.QUEST_WIDTH + this.PADDING, 100, // Moved from 95 to 100 for better positioning
                'pixel-white', '', 8
            );
            this.questProgress.setTint(0xFFFFFF);
            this.questContainer.add(this.questProgress);
        }
    }

    private updateQuestDisplay(): void {
        console.log('QuestUI: updateQuestDisplay called, currentQuest:', this.currentQuest, 'isVisible:', this.isVisible);
        if (!this.currentQuest || !this.isVisible) {
            console.log('QuestUI: updateQuestDisplay early return - no quest or not visible');
            return;
        }
        
        // Update title
        if (this.questTitle) {
            try {
                console.log('QuestUI: Setting quest title to:', this.currentQuest.title);
                this.questTitle.setText(this.currentQuest.title);
            } catch (error) {
                console.warn('QuestUI: Error updating quest title:', error);
            }
        } else {
            console.warn('QuestUI: questTitle is null, cannot update title');
        }
        
        // Update description
        if (this.questDescription) {
            try {
                this.questDescription.setText(this.currentQuest.description);
            } catch (error) {
                console.warn('QuestUI: Error updating quest description:', error);
            }
        }
        
        // Update progress
        this.updateProgressBar();
        this.updateProgressText();
    }

    private updateProgressBar(): void {
        if (!this.progressBar || !this.progressBarBg || !this.currentQuest) return;
        
        const progressX = -this.QUEST_WIDTH + this.PADDING;
        const progressY = 80; // Moved down to account for description being lower
        
        // Clear previous progress
        this.progressBar.clear();
        this.progressBarBg.clear();
        
        // Progress bar background
        this.progressBarBg.fillStyle(0x333333, 0.8);
        this.progressBarBg.fillRoundedRect(
            progressX, progressY,
            this.PROGRESS_BAR_WIDTH, this.PROGRESS_BAR_HEIGHT,
            4
        );
        
        // Progress bar border
        this.progressBarBg.lineStyle(1, 0x555555, 0.6);
        this.progressBarBg.strokeRoundedRect(
            progressX, progressY,
            this.PROGRESS_BAR_WIDTH, this.PROGRESS_BAR_HEIGHT,
            4
        );
        
        // Calculate progress percentage
        const progressPercent = Math.min(this.currentQuest.current / this.currentQuest.amount, 1);
        const progressWidth = this.PROGRESS_BAR_WIDTH * progressPercent;
        
        // Progress bar fill with gradient effect
        if (progressWidth > 0) {
            this.progressBar.fillStyle(0x4CAF50, 0.9); // Green for progress
            this.progressBar.fillRoundedRect(
                progressX, progressY,
                progressWidth, this.PROGRESS_BAR_HEIGHT,
                4
            );
            
            // Progress bar highlight
            this.progressBar.fillStyle(0x66BB6A, 0.7);
            this.progressBar.fillRoundedRect(
                progressX, progressY,
                progressWidth, this.PROGRESS_BAR_HEIGHT / 2,
                4
            );
        }
    }

    private updateProgressText(): void {
        if (!this.questProgress || !this.currentQuest) return;
        
        try {
            const progressText = `${this.currentQuest.current}/${this.currentQuest.amount}`;
            this.questProgress.setText(progressText);
            
            // Change color based on completion
            if (this.currentQuest.current >= this.currentQuest.amount) {
                this.questProgress.setTint(0x4CAF50); // Green when complete
                } else {
                this.questProgress.setTint(0xFFFFFF); // White when in progress
            }
        } catch (error) {
            console.warn('QuestUI: Error updating progress text:', error);
        }
    }

    private showCompletionAnimation(): void {
        if (!this.questContainer) return;
        
        // Add completion effect - using regular Text with proper initialization checks
        try {
            const completionText = this.scene.add.text(
                -this.QUEST_WIDTH / 2, this.QUEST_HEIGHT / 2,
                'QUEST COMPLETE!', {
                    fontSize: '16px',
                    color: '#4CAF50',
                    fontFamily: 'Arial, sans-serif'
                }
            );
            completionText.setOrigin(0.5);
            this.questContainer.add(completionText);
            
            // Animate completion
            this.scene.tweens.add({
                targets: completionText,
                alpha: 0,
                y: completionText.y - 20,
                duration: 2000,
                ease: 'Power2'
            });
        } catch (error) {
            console.warn('QuestUI: Error creating completion animation text:', error);
            // Fallback: create a simple text without advanced styling
            const completionText = this.scene.add.text(
                -this.QUEST_WIDTH / 2, this.QUEST_HEIGHT / 2,
                'QUEST COMPLETE!', {
                    fontSize: '16px',
                    color: '#4CAF50'
                }
            );
            completionText.setOrigin(0.5);
            this.questContainer.add(completionText);
            
            // Animate completion
            this.scene.tweens.add({
                targets: completionText,
                alpha: 0,
                y: completionText.y - 20,
                duration: 2000,
                ease: 'Power2'
            });
        }
    }

    private hideQuestUI(): void {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.currentQuest = null;
        
        if (this.questContainer) {
            const screenWidth = this.scene.cameras.main.width;
            const endX = screenWidth + 300; // Slide off-screen to the right
            
            // Slide out animation
        this.scene.tweens.add({
            targets: this.questContainer,
            x: endX,
                duration: 500,
                ease: 'Power2.easeIn',
            onComplete: () => {
                    this.questContainer?.destroy();
                    this.questContainer = null;
            }
        });
    }

        this.questBackground = null;
        this.questTitle = null;
        this.questDescription = null;
        this.questProgress = null;
        this.progressBar = null;
        this.progressBarBg = null;
    }

    public getQuestContainer(): Phaser.GameObjects.Container | null {
        return this.questContainer;
    }

    public isQuestVisible(): boolean {
        return this.isVisible;
    }

    public restoreActiveQuests(): void {
        console.log('QuestUI: Restoring active quests from quest system...');
        
        // Get the quest system from the scene
        const questSystem = this.scene.data.get('questSystem');
        if (!questSystem) {
            console.warn('QuestUI: Quest system not available for restoration');
            return;
        }
        
        // Get active quests from quest system
        const activeQuests = questSystem.getActiveQuests();
        console.log('QuestUI: Active quests to restore:', Array.from(activeQuests.keys()));
        console.log('QuestUI: Active quests size:', activeQuests.size);
        
        // Debug: Log each active quest
        activeQuests.forEach((progress, questId) => {
            console.log(`QuestUI: Active quest ${questId}: ${progress.currentAmount}/${progress.requiredAmount}, completed: ${progress.isCompleted}`);
        });

        if (activeQuests.size > 0) {
            // Find the current quest (lowest ID active quest)
            const currentQuestId = Math.min(...Array.from(activeQuests.keys()));
            const questProgress = activeQuests.get(currentQuestId);
            
            console.log(`QuestUI: Processing quest ${currentQuestId}, progress:`, questProgress);
            
            if (questProgress && !questProgress.isCompleted) {
                // Restore the quest UI with current progress
                const questData = this.scene.cache.json.get(`quest-${currentQuestId}`);
                console.log(`QuestUI: Quest data for ${currentQuestId}:`, questData);
                
                if (questData) {
                    this.currentQuest = {
                        id: currentQuestId.toString(),
                    title: questData.name,
                        description: questData.requirements, // Use requirements instead of description
                        current: questProgress.currentAmount,
                        amount: questProgress.requiredAmount,
                        isCompleted: questProgress.isCompleted,
                        isReadyForCompletion: questProgress.isReadyForCompletion
                    };
                    
                    console.log(`QuestUI: Created quest object:`, this.currentQuest);
                    
                    // Show the quest UI with restored progress
                    this.showQuestUI();
                    // updateQuestDisplay() will be called automatically in showQuestUI()
                    
                    console.log(`QuestUI: ✅ Successfully restored quest ${currentQuestId} with progress ${questProgress.currentAmount}/${questProgress.requiredAmount}`);
                } else {
                    console.error(`QuestUI: Failed to load quest data for quest ${currentQuestId}`);
                }
            } else {
                console.log(`QuestUI: Quest ${currentQuestId} is completed or invalid, not restoring UI`);
            }
        } else {
            console.log('QuestUI: No active quests to restore, quest UI will remain hidden');
        }
        
        console.log('QuestUI: Active quests restoration complete');
    }

    public reset(): void {
        console.log('QuestUI: Resetting for new game');
        this.hideQuestUI();
        this.currentQuest = null;
        this.isVisible = false;
    }

    public destroy(): void {
        console.log('QuestUI: Destroying');
        this.hideQuestUI();
        this.currentQuest = null;
        this.isVisible = false;
        
        // Remove all event listeners
        this.scene.events.off('questAccepted');
        this.scene.events.off('questProgress');
        this.scene.events.off('questCompleted');
        this.scene.events.off('questFailed');
    }
}