import Phaser from 'phaser';
import { Player } from '../prefabs/Player';
import { UnifiedNPC } from '../prefabs/UnifiedNPC';

export interface QuestProgress {
    questId: number;
    currentAmount: number;
    requiredAmount: number;
    isCompleted: boolean;
    isReadyForCompletion: boolean; // New field to track if quest requirements are met
}

/**
 * QuestSystem - Manages quest progression and tracking
 * Handles quest state, progress tracking, and completion rewards
 */
export class QuestSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private npc: UnifiedNPC | null = null;
    private activeQuests: Map<number, QuestProgress> = new Map();
    private completedQuests: Set<number> = new Set();
    
    constructor(scene: Phaser.Scene, player: Player) {
        this.scene = scene;
        this.player = player;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for dialogue actions
        this.scene.events.on('dialogueAction', (action: string) => {
            this.handleDialogueAction(action);
        });
        
        // Listen for item collection events
        this.scene.events.on('itemCollected', (itemType: string, amount: number) => {
            this.updateQuestProgress(itemType, amount);
        });
        
        // Listen for enemy death events
        this.scene.events.on('enemyKilled', (enemyType: string) => {
            this.updateQuestProgress(enemyType, 1);
        });
        
        // Listen for quest start events
        this.scene.events.on('startQuest', (questId: number) => {
            console.log(`QuestSystem: Received startQuest event for quest ${questId}`);
            this.startQuest(questId);
        });
    }

    public setNPC(npc: UnifiedNPC): void {
        this.npc = npc;
    }

    public startQuest(questId: number): void {
        console.log(`QuestSystem: Starting quest ${questId}`);
        
        // Check if quest is already active
        if (this.activeQuests.has(questId)) {
            console.log(`QuestSystem: Quest ${questId} is already active, skipping start`);
            return;
        }
        
        // Check if quest is already completed
        if (this.completedQuests.has(questId)) {
            console.log(`QuestSystem: Quest ${questId} is already completed, skipping start`);
            return;
        }
        
        const questData = this.scene.cache.json.get(`quest-${questId}`);
        if (!questData) {
            console.error(`Quest ${questId} not found`);
            return;
        }
        
        // Check player's existing inventory for quest items
        const questItemType = questData.questdata.type;
        const existingAmount = this.player.p1Inventory.getItemCount(questItemType);
        const requiredAmount = questData.questdata.amount;
        
        console.log(`QuestSystem: Starting quest ${questId} - Item type: ${questItemType}, Existing: ${existingAmount}, Required: ${requiredAmount}`);
        
        const questProgress: QuestProgress = {
            questId: questId,
            currentAmount: Math.min(existingAmount, requiredAmount), // Start with existing items
            requiredAmount: requiredAmount,
            isCompleted: false,
            isReadyForCompletion: existingAmount >= requiredAmount // Check if already ready
        };
        
        this.activeQuests.set(questId, questProgress);
        
        // Emit quest accepted event for UI
        this.scene.events.emit('questAccepted', {
            id: questId.toString(),
            title: questData.name,
            description: questData.requirements, // Use requirements instead of full description
            type: questData.questdata.type,
            amount: questData.questdata.amount,
            current: questProgress.currentAmount
        });
        
        // Started quest
        // Player already has required items
        
        // Always emit quest progress event to update QuestUI with current count
        this.scene.events.emit('questProgress', questId, questProgress.currentAmount);
        
        // If quest is already ready for completion, emit the event
        if (questProgress.isReadyForCompletion) {
            // Quest requirements already met - ready for completion
            this.scene.events.emit('questReadyForCompletion', {
                questId: questId,
                questName: questData.name
            });
        }
    }

    public updateQuestProgress(itemType: string, amount: number): void {
        // Check all active quests for matching requirements
        this.activeQuests.forEach((progress, questId) => {
            if (progress.isCompleted) return;
            
            const questData = this.scene.cache.json.get(`quest-${questId}`);
            if (!questData) return;
            
            const questItemType = questData.questdata.type.toLowerCase().replace(/[-\s]/g, '');
            const currentItemType = itemType.toLowerCase().replace(/[-\s]/g, '');
            
            // Only match if the types are exactly the same (exact match)
            if (questItemType === currentItemType) {
                // Handle different quest types
                if (questData.questdata.verb === 'kill') {
                    // For kill quests, increment the progress directly
                    progress.currentAmount = Math.min(progress.currentAmount + amount, progress.requiredAmount);
                    console.log(`QuestSystem: Quest ${questId} progress update - Enemy: ${itemType}, Quest needs: ${questData.questdata.type}, Progress: ${progress.currentAmount}/${progress.requiredAmount}`);
                } else {
                    // For collect quests, use inventory count
                    const currentInventoryCount = this.player.p1Inventory.getItemCount(questData.questdata.type);
                    progress.currentAmount = Math.min(currentInventoryCount, progress.requiredAmount);
                    console.log(`QuestSystem: Quest ${questId} progress update - Item: ${itemType}, Quest needs: ${questData.questdata.type}, Inventory count: ${currentInventoryCount}, Progress: ${progress.currentAmount}/${progress.requiredAmount}`);
                }
                
                // Emit quest progress event for QuestUI with quest ID
                this.scene.events.emit('questProgress', questId, progress.currentAmount);
                
                // Check if quest requirements are met (but don't complete yet)
                if (progress.currentAmount >= progress.requiredAmount && !progress.isReadyForCompletion) {
                    progress.isReadyForCompletion = true;
                    // console.log(`QuestSystem: Quest ${questId} requirements met - ready for completion`);
                    
                    // Emit quest ready event for QuestUI to show green
                    this.scene.events.emit('questReadyForCompletion', {
                        questId: questId,
                        questName: questData.name
                    });
                }
            }
        });
    }

    public completeQuestAtNPC(questId: number): boolean {
        const questProgress = this.activeQuests.get(questId);
        if (!questProgress || !questProgress.isReadyForCompletion) {
            return false;
        }
        
        const questData = this.scene.cache.json.get(`quest-${questId}`);
        if (!questData) return false;
        
        // Mark as completed
        questProgress.isCompleted = true;
        this.completedQuests.add(questId);
        
        // Quest is ready for completion, so we can complete it
        // Remove items from player inventory now
        const itemType = questData.questdata.type;
        const amount = questData.questdata.amount;
        
        if (this.player.p1Inventory.hasItem(itemType, amount)) {
            this.player.p1Inventory.remove(itemType, amount);
            // console.log(`QuestSystem: Removed ${amount} ${itemType} from player inventory`);
        } else {
            // console.log(`QuestSystem: Warning - player doesn't have required items, but quest is marked as ready`);
        }
        
        // Get reward (but don't add to inventory yet - player must accept it)
        const reward = this.getQuestReward(questId);
        
        // console.log(`QuestSystem: Quest ${questId} completed: ${questData.name}`);
        // console.log(`QuestSystem: Reward available: ${reward.amount} ${reward.type}`);
        
        // Remove from active quests
        this.activeQuests.delete(questId);
        
        // Emit quest completion event with proper QuestData structure and reward
        const questCompletionData = {
            id: questId, // Keep as number for quest icon cleanup
            questId: questId, // Add questId field for compatibility
            questName: questData.name, // Add questName field for compatibility
            title: questData.name,
            description: questData.description,
            type: questData.questdata.type,
            amount: questData.questdata.amount,
            current: questData.questdata.amount, // Quest is complete, so current equals amount
            reward: reward // Include the reward information
        };
        
        console.log('QuestSystem: Emitting quest completed event:', questCompletionData);
        this.scene.events.emit('questCompleted', questCompletionData);
        
        // Don't automatically start the next quest - let the NPC handle it through dialogue
        
        return true;
    }



    /**
     * Automatically start the next quest in sequence
     */
    private startNextQuest(completedQuestId: number): void {
        const nextQuestId = completedQuestId + 1;
        
        // Check if next quest exists and hasn't been completed
        if (!this.completedQuests.has(nextQuestId) && !this.activeQuests.has(nextQuestId)) {
            try {
                const nextQuestData = this.scene.cache.json.get(`quest-${nextQuestId}`);
                if (nextQuestData) {
                    console.log(`Starting next quest: ${nextQuestId} - ${nextQuestData.name}`);
                    this.startQuest(nextQuestId);
                }
            } catch (error) {
                console.log(`No next quest found after quest ${completedQuestId}`);
            }
        }
    }

    private getQuestReward(questId: number): any {
        // Define rewards for each quest
        const rewards: { [key: number]: any } = {
            1: { type: 'gold-coin', amount: 10 }, // Dimensional herbs quest
            2: { type: 'gold-coin', amount: 15 }, // Nepian scouts quest
            3: { type: 'gold-coin', amount: 10 }, // Nepian blood quest
            4: { type: 'gold-coin', amount: 50 }, // Electro Lord quest
            5: { type: 'gold-coin', amount: 100 }, // Mine gateway quest
            6: { type: 'gold-coin', amount: 150 }, // Valley cleansing quest
            7: { type: 'gold-coin', amount: 200 }, // Gateway investigation quest
            8: { type: 'gold-coin', amount: 250 }, // Pure dimensional energy quest
            9: { type: 'gold-coin', amount: 300 }, // Anchor fragment quest
            10: { type: 'gold-coin', amount: 400 }, // Nepian stronghold quest
            11: { type: 'gold-coin', amount: 500 }, // Gateway activation quest
            12: { type: 'gold-coin', amount: 600 }, // Empire ruins quest
            13: { type: 'gold-coin', amount: 750 }, // Sand Kingdoms quest
            14: { type: 'gold-coin', amount: 1000 } // Elden Forest quest
        };
        
        return rewards[questId] || { type: 'gold-coin', amount: 10 };
    }

    private handleDialogueAction(action: string): void {
        switch (action) {
            case 'continue':
                // Continue current quest
                break;
            case 'turn_in':
                // Turn in quest items
                this.handleQuestTurnIn();
                break;
            case 'close':
                // Close dialogue
                if (this.npc) {
                    this.npc.endInteraction();
                }
                break;
        }
    }

    private handleQuestTurnIn(): void {
        if (!this.npc) return;
        
        const currentQuest = this.npc.getCurrentQuest();
        if (!currentQuest) return;
        
        const questProgress = this.activeQuests.get(currentQuest.id);
        if (!questProgress || !questProgress.isCompleted) {
            // console.log('QuestSystem: Quest not ready for turn-in');
            return;
        }
        
        // Remove items from player inventory
        const itemType = currentQuest.questData.type;
        const amount = currentQuest.questData.amount;
        
        if (this.player.p1Inventory.hasItem(itemType, amount)) {
            this.player.p1Inventory.remove(itemType, amount);
            
            // Give reward
            const reward = this.getQuestReward(currentQuest.id);
            this.player.p1Inventory.add(reward.type, reward.amount);
            
            // console.log(`QuestSystem: Gave reward: ${reward.amount} ${reward.type}`);
            
            // Remove from active quests
            this.activeQuests.delete(currentQuest.id);
        }
    }

    public getActiveQuests(): Map<number, QuestProgress> {
        return this.activeQuests;
    }

    public getCompletedQuests(): Set<number> {
        return this.completedQuests;
    }

    public isQuestActive(questId: number): boolean {
        return this.activeQuests.has(questId);
    }

    public isQuestCompleted(questId: number): boolean {
        return this.completedQuests.has(questId);
    }

    public isQuestReadyForCompletion(questId: number): boolean {
        const progress = this.activeQuests.get(questId);
        const isReady = progress ? progress.isReadyForCompletion : false;
        // console.log(`QuestSystem: Quest ${questId} ready for completion: ${isReady}`);
        if (progress) {
            // console.log(`QuestSystem: Quest progress: ${progress.currentAmount}/${progress.requiredAmount}, isReady: ${progress.isReadyForCompletion}`);
        } else {
            // console.log(`QuestSystem: No progress found for quest ${questId}`);
        }
        return isReady;
    }

    public getQuestProgress(questId: number): QuestProgress | null {
        return this.activeQuests.get(questId) || null;
    }

    /**
     * Check if there are any active quests
     */
    public hasActiveQuests(): boolean {
        return this.activeQuests.size > 0;
    }

    /**
     * Get the number of active quests
     */
    public getActiveQuestsCount(): number {
        return this.activeQuests.size;
    }

    /**
     * Reset the quest system for new game
     */
    public reset(): void {
        console.log('QuestSystem: Resetting for new game');
        this.activeQuests.clear();
        this.completedQuests.clear();
    }

    /**
     * Saves the QuestSystem state to the player's quest status
     */
    public saveQuestState(): any {
        const questState = {
            activeQuests: Array.from(this.activeQuests.entries()),
            completedQuests: Array.from(this.completedQuests)
        };
        console.log('QuestSystem: Saving quest state:', questState);
        console.log('QuestSystem: Active quests count:', this.activeQuests.size);
        console.log('QuestSystem: Completed quests count:', this.completedQuests.size);
        return questState;
    }

    /**
     * Restores the QuestSystem state from saved data
     */
    public restoreQuestState(savedState: any): void {
        if (!savedState) {
            // console.log('QuestSystem: No saved quest state to restore');
            return;
        }

        console.log('QuestSystem: Restoring quest state:', savedState);

        // Restore active quests
        if (savedState.activeQuests && Array.isArray(savedState.activeQuests)) {
            this.activeQuests.clear();
            console.log(`QuestSystem: Restoring ${savedState.activeQuests.length} active quests`);
            savedState.activeQuests.forEach(([questId, questProgress]: [number, QuestProgress]) => {
                this.activeQuests.set(questId, questProgress);
                console.log(`QuestSystem: Restored active quest ${questId}: ${questProgress.currentAmount}/${questProgress.requiredAmount}, completed: ${questProgress.isCompleted}`);
            });
        } else {
            console.log('QuestSystem: No active quests to restore');
        }

        // Restore completed quests
        if (savedState.completedQuests && Array.isArray(savedState.completedQuests)) {
            this.completedQuests.clear();
            savedState.completedQuests.forEach((questId: number) => {
                this.completedQuests.add(questId);
                console.log(`QuestSystem: Restored completed quest ${questId}`);
            });
        }
        
        // Synchronize quest progress with current inventory after restoration
        this.synchronizeQuestProgressWithInventory();
    }

    /**
     * Synchronizes quest progress with current inventory count
     * This is called after save data is loaded to ensure quest progress matches inventory
     */
    private synchronizeQuestProgressWithInventory(): void {
        console.log('QuestSystem: Synchronizing quest progress with inventory...');
        
        this.activeQuests.forEach((progress, questId) => {
            if (progress.isCompleted) return;
            
            const questData = this.scene.cache.json.get(`quest-${questId}`);
            if (!questData) return;
            
            // Only sync inventory-based quests (collect quests), not kill quests
            if (questData.questdata.verb === 'kill') {
                console.log(`QuestSystem: Quest ${questId} is a kill quest, preserving saved progress: ${progress.currentAmount}/${progress.requiredAmount}`);
                // For kill quests, keep the saved progress as-is
                return;
            }
            
            const currentInventoryCount = this.player.p1Inventory.getItemCount(questData.questdata.type);
            const newProgress = Math.min(currentInventoryCount, progress.requiredAmount);
            
            console.log(`QuestSystem: Quest ${questId} sync - Inventory: ${currentInventoryCount}, Saved progress: ${progress.currentAmount}, New progress: ${newProgress}`);
            
            // Update progress to match inventory (this ensures consistency after save load)
            progress.currentAmount = newProgress;
            
            // Check if quest requirements are met
            if (progress.currentAmount >= progress.requiredAmount && !progress.isReadyForCompletion) {
                progress.isReadyForCompletion = true;
                console.log(`QuestSystem: Quest ${questId} requirements met after sync - ready for completion`);
                
                // Emit quest ready event for QuestUI to show green
                this.scene.events.emit('questReadyForCompletion', {
                    questId: questId,
                    questName: questData.name
                });
            }
        });
        
        console.log('QuestSystem: Quest progress synchronization complete');
    }
}
