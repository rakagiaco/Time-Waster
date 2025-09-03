import Phaser from 'phaser';
import { Player } from './Player';

export interface DialogueData {
    id: string;
    text: string;
    responses?: DialogueResponse[];
    isEnd?: boolean;
    reward?: {
        type: string;
        amount: number;
    };
}

export interface DialogueResponse {
    text: string;
    nextDialogueId?: string;
    action?: string;
    condition?: () => boolean;
}

export interface QuestData {
    id: number;
    name: string;
    description: string;
    requirements: string;
    completionText: string;
    questData: {
        questNumber: number;
        verb: string;
        type: string;
        amount: number;
    };
}

/**
 * NPC Class - Handles quest giver interactions and dialogue
 * Extends the existing Ally system with quest functionality
 */
export class NPC {
    private scene: Phaser.Scene;
    public ally: any; // Reference to the Ally object
    private player: Player | null = null;
    private interactionRange: number = 80;
    private isInteracting: boolean = false;
    private currentQuest: QuestData | null = null;

    private completedQuests: Set<number> = new Set();
    
    // Dialogue system
    private currentDialogue: DialogueData | null = null;

    private hasHadInitialConversation: boolean = false;
    private questAccepted: boolean = false;
    
    constructor(scene: Phaser.Scene, ally: any) {
        this.scene = scene;
        this.ally = ally;
        this.setupInteraction();
        this.loadQuestData();
        this.setupEventListeners();
    }

    private setupInteraction(): void {
        // Enable interaction for this NPC even if it's static
        if (this.ally.isStatic) {
            this.ally.isStatic = false; // Temporarily enable interaction
        }
        
        // Override the ally's interaction behavior
        this.ally.interact = () => {
            this.interact();
        };
        
        // Set up the ally's player reference
        this.ally.player = null; // Will be set when player is assigned
    }

    private setupEventListeners(): void {
        // Listen for dialogue events
        this.scene.events.on('dialogueAction', this.handleDialogueAction, this);
        this.scene.events.on('dialogueNext', this.handleDialogueNext, this);
        this.scene.events.on('dialogueEnded', this.handleDialogueEnded, this);
        console.log('NPC: Event listeners set up for dialogue events');
    }

    private loadQuestData(): void {
        // Quest data should already be loaded by the Loader scene
        // Just initialize the first quest
        this.initializeQuests();
    }

    private initializeQuests(): void {
        // Set up the first quest
        const quest1Data = this.scene.cache.json.get('quest-1');
        this.currentQuest = {
            id: quest1Data.questdata.questnumber,
            name: quest1Data.name,
            description: quest1Data.description,
            requirements: quest1Data.requirements,
            completionText: quest1Data.completiontext,
            questData: {
                questNumber: quest1Data.questdata.questnumber,
                verb: quest1Data.questdata.verb,
                type: quest1Data.questdata.type,
                amount: quest1Data.questdata.amount
            }
        };
        
        console.log('NPC: Initialized with quest:', this.currentQuest.name);
    }

    public setPlayer(player: Player): void {
        this.player = player;
        // Also set the player reference in the ally
        this.ally.player = player;
    }

    public isPlayerInRange(): boolean {
        if (!this.player) return false;
        
        const distance = Phaser.Math.Distance.Between(
            this.ally.x, this.ally.y,
            this.player.x, this.player.y
        );
        
        return distance <= this.interactionRange;
    }

    public interact(): void {
        if (!this.player || this.isInteracting) return;
        
        this.isInteracting = true;
        console.log('NPC: Player interaction started');
        console.log('NPC: Quest accepted:', this.hasAcceptedQuest());
        console.log('NPC: Has had initial conversation:', this.hasHadInitialConversation);
        console.log('NPC: Current quest:', this.currentQuest?.name);
        
        // Check if player has accepted the quest
        if (this.hasAcceptedQuest()) {
            // Check if quest is completed
            if (this.isQuestCompleted()) {
                console.log('NPC: Quest is completed, showing completion dialogue');
                this.startQuestCompleteDialogue();
            } else {
                console.log('NPC: Quest is incomplete, showing progress dialogue');
                this.startQuestIncompleteDialogue();
            }
        } else if (!this.hasHadInitialConversation) {
            // First time meeting - show full quest offer
            console.log('NPC: First time meeting, showing quest offer');
            this.startQuestOfferDialogue();
            this.hasHadInitialConversation = true;
        } else {
            // Return visit - check if there's a quest to offer
            if (this.currentQuest) {
                console.log('NPC: Return visit with available quest, showing quest offer');
                this.startQuestOfferDialogue();
            } else {
                console.log('NPC: Return visit, no quest available, showing general dialogue');
                this.startReturnDialogue();
            }
        }
    }



    private startQuestOfferDialogue(): void {
        if (!this.currentQuest) return;
        
        const dialogue: DialogueData = {
            id: 'quest_offer',
            text: this.currentQuest.description,
            responses: [
                {
                    text: "I'll help you with this task.",
                    nextDialogueId: 'quest_accepted'
                },
                {
                    text: "I need to think about it.",
                    action: 'show_snarky_remark'
                }
            ]
        };
        
        this.showDialogue(dialogue);
    }

    private startReturnDialogue(): void {
        const dialogue: DialogueData = {
            id: 'return_visit',
            text: "Ah, you're back again. I see you've had time to think about my request. The valley's mysteries still await, and those mysterious herbs won't collect themselves. Have you decided to help me gather five of these strange herbs so that I may study their properties?",
            responses: [
                {
                    text: "Yes, I'll help you with this task.",
                    nextDialogueId: 'quest_accepted'
                },
                {
                    text: "I still need to think about it.",
                    action: 'show_snarky_remark'
                }
            ]
        };
        
        this.showDialogue(dialogue);
    }

    public startQuestDeclinedDialogue(): void {
        console.log('NPC: Starting quest declined dialogue');
        
        // Hide current dialogue first
        this.scene.events.emit('hideDialogue');
        
        // Wait a moment for the dialogue to hide, then show the new one
        this.scene.time.delayedCall(100, () => {
            const dialogue: DialogueData = {
                id: 'quest_declined',
                text: "Ah, I see. Another traveler who lacks the courage to face the valley's mysteries. Very well, then. Perhaps when you've grown a spine and are ready to make a difference in this world, you'll return. Until then, the valley's secrets will remain hidden, and its curse will continue to spread. Don't expect me to be so generous with my time next time you come crawling back.",
                responses: [
                    {
                        text: "I understand.",
                        action: 'close_dialogue'
                    }
                ]
            };
            
            console.log('NPC: Showing snarky remark dialogue');
            this.showDialogue(dialogue);
        });
    }

    public startQuestAcceptedDialogue(): void {
        if (!this.currentQuest) return;
        
        console.log('NPC: Quest accepted, closing dialogue and returning to game');
        
        // Mark quest as accepted
        this.questAccepted = true;
        
        // Start quest in QuestSystem
        this.scene.events.emit('startQuest', this.currentQuest.id);
        
        // Emit quest accepted event for QuestUI
        console.log('NPC: Emitting questAccepted event for quest:', this.currentQuest.name);
        this.scene.events.emit('questAccepted', {
            id: this.currentQuest.id.toString(),
            title: this.currentQuest.name,
            description: this.currentQuest.requirements,
            type: this.currentQuest.questData.type,
            amount: this.currentQuest.questData.amount,
            current: 0
        });
        
        // Just close the dialogue and return to game
        this.scene.events.emit('hideDialogue');
    }

    private completeQuest(): void {
        console.log('NPC: completeQuest method called');
        if (!this.currentQuest) {
            console.log('NPC: No current quest found');
            return;
        }
        
        console.log(`NPC: Attempting to complete quest ${this.currentQuest.id}`);
        
        // Use the quest system to complete the quest
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const success = questSystem.completeQuestAtNPC(this.currentQuest.id);
            console.log(`NPC: Quest completion result: ${success}`);
            if (success) {
                // Mark quest as completed in NPC
                this.completedQuests.add(this.currentQuest.id);
                
                // Quest completed - reward will be handled by completeQuestAndReward method
                console.log('NPC: Quest completed through quest system');
                
                // Move to next quest
                this.advanceToNextQuest();
            } else {
                console.log('NPC: Quest completion failed - not ready or missing items');
            }
        } else {
            console.error('NPC: Quest system not found');
        }
    }

    private acceptReward(): void {
        if (!this.currentDialogue || !this.currentDialogue.reward || !this.player) return;
        
        // Add reward to player inventory
        const reward = this.currentDialogue.reward;
        this.player.p1Inventory.add(reward.type, reward.amount);
        
        console.log(`NPC: Added reward to player inventory: ${reward.amount} ${reward.type}`);
        console.log('NPC: Player accepted reward, closing dialogue and returning to game');
        this.scene.events.emit('hideDialogue');
    }

    private completeQuestAndReward(): void {
        console.log('NPC: completeQuestAndReward method called');
        if (!this.currentQuest) {
            console.log('NPC: No current quest found');
            return;
        }
        
        console.log(`NPC: Attempting to complete quest ${this.currentQuest.id} and give reward`);
        
        // Use the quest system to complete the quest
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const success = questSystem.completeQuestAtNPC(this.currentQuest.id);
            console.log(`NPC: Quest completion result: ${success}`);
            if (success) {
                // Mark quest as completed in NPC
                this.completedQuests.add(this.currentQuest.id);
                
                // Add reward to player inventory immediately
                if (this.player) {
                    this.player.p1Inventory.add('gold-coin', 10);
                    console.log('NPC: Added 10 gold coins to player inventory');
                }
                
                // Close dialogue and return to game
                console.log('NPC: Quest completed and reward given, closing dialogue');
                this.scene.events.emit('hideDialogue');
                
                // Move to next quest
                this.advanceToNextQuest();
            } else {
                console.log('NPC: Quest completion failed - not ready or missing items');
            }
        } else {
            console.error('NPC: Quest system not found');
        }
    }

    private advanceToNextQuest(): void {
        const nextQuestId = this.currentQuest!.id + 1;
        
        if (nextQuestId <= 7) {
            const questData = this.scene.cache.json.get(`quest-${nextQuestId}`);
            this.currentQuest = {
                id: questData.questdata.questnumber,
                name: questData.name,
                description: questData.description,
                requirements: questData.requirements,
                completionText: questData.completiontext,
                questData: {
                    questNumber: questData.questdata.questnumber,
                    verb: questData.questdata.verb,
                    type: questData.questdata.type,
                    amount: questData.questdata.amount
                }
            };
            
            // Reset quest acceptance state for the new quest
            this.questAccepted = false;
            
            console.log('NPC: Advanced to next quest:', this.currentQuest.name);
            console.log('NPC: Reset quest acceptance state for new quest');
            
            // Show placeholder dialogue for next quest
            this.showNextQuestPlaceholder();
        } else {
            this.currentQuest = null;
            this.questAccepted = false;
            console.log('NPC: All quests completed!');
        }
    }

    private showNextQuestPlaceholder(): void {
        if (!this.currentQuest) return;
        
        // Wait a moment after quest completion, then show next quest placeholder
        this.scene.time.delayedCall(1000, () => {
            const dialogue: DialogueData = {
                id: 'next_quest_placeholder',
                text: "Excellent work, traveler! Your efforts have not gone unnoticed. The valley's mysteries run deeper than we first imagined. There is another task that requires your attention, one that may hold even greater secrets than the herbs you just gathered. Are you ready to continue your journey into the unknown?",
                responses: [
                    {
                        text: "I'll help you with this task.",
                        nextDialogueId: 'quest_accepted'
                    },
                    {
                        text: "I need to think about it.",
                        action: 'show_snarky_remark'
                    }
                ]
            };
            
            console.log('NPC: Showing next quest placeholder dialogue');
            this.showDialogue(dialogue);
        });
    }

    private getQuestProgress(): number {
        if (!this.currentQuest || !this.player) return 0;
        
        const itemType = this.currentQuest.questData.type;
        return this.player.p1Inventory.getItemCount(itemType);
    }



    private showDialogue(dialogue: DialogueData): void {
        // Emit event to show dialogue UI
        this.scene.events.emit('showDialogue', dialogue);
    }

    public update(): void {
        // Check for interaction
        if (this.player && this.isPlayerInRange() && !this.isInteracting) {
            // Show interaction prompt
            this.showInteractionPrompt();
        } else {
            this.hideInteractionPrompt();
        }
    }

    private showInteractionPrompt(): void {
        // Could add visual prompt here
        console.log('NPC: Player in range - press E to interact');
    }

    private hideInteractionPrompt(): void {
        // Hide interaction prompt
    }

    public endInteraction(): void {
        this.isInteracting = false;
        this.scene.events.emit('hideDialogue');
    }

    public getCurrentQuest(): QuestData | null {
        return this.currentQuest;
    }

    public getCompletedQuests(): Set<number> {
        return this.completedQuests;
    }

    private handleDialogueAction(action: string): void {
        console.log('NPC: Handling dialogue action:', action);
        
        switch (action) {
            case 'accept_quest':
                this.acceptQuest();
                break;
            case 'decline_quest':
                this.declineQuest();
                break;
            case 'turn_in':
                this.completeQuest();
                break;
            case 'complete_quest':
                this.completeQuest();
                break;
            case 'accept_reward':
                this.acceptReward();
                break;
            case 'complete_quest_and_reward':
                this.completeQuestAndReward();
                break;
            case 'continue':
                console.log('NPC: Player will continue quest, closing dialogue');
                this.scene.events.emit('hideDialogue');
                break;
            case 'close_dialogue':
                console.log('NPC: Closing dialogue and returning to game');
                this.scene.events.emit('hideDialogue');
                break;
            case 'show_snarky_remark':
                console.log('NPC: Showing snarky remark');
                this.startQuestDeclinedDialogue();
                break;
            default:
                console.log('NPC: Unknown dialogue action:', action);
        }
    }

    public handleDialogueNext(dialogueId: string): void {
        console.log('NPC: Handling dialogue next:', dialogueId);
        
        switch (dialogueId) {
            case 'quest_accepted':
                this.startQuestAcceptedDialogue();
                break;
            case 'quest_declined':
                this.startQuestDeclinedDialogue();
                break;
            default:
                console.log('NPC: Unknown dialogue ID:', dialogueId);
        }
    }

    private acceptQuest(): void {
        console.log('NPC: Quest accepted');
        // Quest acceptance logic would go here
    }

    private declineQuest(): void {
        console.log('NPC: Quest declined');
        // Quest decline logic would go here
    }

    private handleDialogueEnded(): void {
        console.log('NPC: Dialogue ended, resetting interaction state');
        this.isInteracting = false;
    }

    private hasAcceptedQuest(): boolean {
        return this.questAccepted;
    }

    private isQuestCompleted(): boolean {
        if (!this.currentQuest || !this.player) return false;
        
        // Check if quest is ready for completion in the quest system
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const isReady = questSystem.isQuestReadyForCompletion(this.currentQuest.id);
            console.log(`NPC: Quest ${this.currentQuest.id} ready for completion: ${isReady}`);
            return isReady;
        }
        
        // Fallback to checking inventory
        const progress = this.getQuestProgress();
        const isComplete = progress >= this.currentQuest.questData.amount;
        console.log(`NPC: Quest progress: ${progress}/${this.currentQuest.questData.amount}, complete: ${isComplete}`);
        return isComplete;
    }

    private getQuestItemName(): string {
        if (!this.currentQuest) return 'items';
        
        const questItemType = this.currentQuest.questData.type;
        
        // Convert quest item type to readable name
        switch (questItemType) {
            case 'mysterious herb':
                return 'mysterious herbs';
            case 'lesser nepian blood':
                return 'lesser nepian blood samples';
            case 'nepian scout':
                return 'nepian scouts';
            case 'nepian observer':
                return 'nepian observers';
            case 'nepian heart':
                return 'nepian hearts';
            case 'electro lord':
                return 'electro lords';
            default:
                // Fallback: convert underscores/hyphens to spaces and pluralize
                return questItemType.replace(/[_-]/g, ' ') + 's';
        }
    }

    private startQuestIncompleteDialogue(): void {
        if (!this.currentQuest) return;
        
        // Get the quest item name from the current quest
        const questItemName = this.getQuestItemName();
        const questAmount = this.currentQuest.questData.amount;
        
        // Create dynamic dialogue text based on quest requirements
        const dialogueText = `I see you're still working on gathering ${questAmount} ${questItemName}. Keep searching, traveler. The valley's secrets await those with patience and determination.`;
        
        const dialogue: DialogueData = {
            id: 'quest_incomplete',
            text: dialogueText,
            responses: [
                {
                    text: "I'll keep looking.",
                    action: 'continue'
                }
            ]
        };
        
        console.log('NPC: Showing quest incomplete dialogue for:', questItemName);
        this.showDialogue(dialogue);
    }

    private startQuestCompleteDialogue(): void {
        if (!this.currentQuest) return;
        
        const dialogue: DialogueData = {
            id: 'quest_complete',
            text: this.currentQuest.completionText,
            responses: [
                {
                    text: "Here are the herbs you requested.",
                    action: 'complete_quest_and_reward'
                }
            ],
            reward: {
                type: 'gold-coin',
                amount: 10
            }
        };
        
        console.log('NPC: Showing quest complete dialogue with reward');
        this.showDialogue(dialogue);
    }
}
