import Phaser from 'phaser';
import { Entity } from './Entity';
import { StateMachine, State } from '../lib/StateMachine';
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

// NPC States
class NPCIdleState extends State {
    enter(_scene: Phaser.Scene, npc: UnifiedNPC): void {
        npc.setVelocity(0, 0);

        // NPC uses static image, no animation needed
        // The texture is already set in the constructor
    }

    execute(_scene: Phaser.Scene, npc: UnifiedNPC): void {
        // For static NPCs, don't do any interaction detection
        if (npc.getIsStatic()) {
            return; // Static NPCs don't interact
        }

        // For regular NPCs, check if player is nearby using simple distance calculation
        const player = npc.getPlayer();
        if (player) {
            const distance = Phaser.Math.Distance.Between(npc.x, npc.y, player.x, player.y);
            if (distance < 100) { // Interaction range
                npc.animsFSM.transition('interacting');
            }
        }
    }
}

class NPCInteractingState extends State {
    enter(_scene: Phaser.Scene, npc: UnifiedNPC): void {
        // Show quest icon or interaction prompt
        npc.showQuestIcon();
    }

    execute(_scene: Phaser.Scene, npc: UnifiedNPC): void {
        // For static NPCs, don't do any interaction detection
        if (npc.getIsStatic()) {
            return; // Static NPCs don't interact
        }

        // Check if player is still nearby using simple distance calculation
        const player = npc.getPlayer();
        if (player) {
            const distance = Phaser.Math.Distance.Between(npc.x, npc.y, player.x, player.y);
            if (distance > 100) { // Out of interaction range
                npc.animsFSM.transition('idle');
            }
        }

        // Check for player interaction
        if (npc.isPlayerInteracting()) {
            npc.handlePlayerInteraction();
        }
    }
}

/**
 * Unified NPC Class - Combines Ally and NPC functionality
 * Handles both basic NPC interactions and complex quest systems
 */
export class UnifiedNPC extends Entity {
    public animsFSM!: StateMachine;
    private player: Player | null = null;
    private isStatic: boolean = false; // For static NPCs like quest givers
    private questIcon?: Phaser.GameObjects.Sprite;
    private isInteracting: boolean = false;
    private questData: any;

    // Quest system properties
    private interactionRange: number = 80;
    private currentQuest: QuestData | null = null;
    private completedQuests: Set<number> = new Set();
    
    // Dialogue system
    private currentDialogue: DialogueData | null = null;
    private hasHadInitialConversation: boolean = false;
    private questAccepted: boolean = false;
    private questDeclined: boolean = false;
    private interactionPrompt: Phaser.GameObjects.Container | null = null;
    private playerInRangeLastFrame: boolean = false;
    private dialogueJustOpened: boolean = false;

    // NPC type and behavior
    public entity_type: string = 'NPC';
    public isQuestGiver: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, isQuestGiver: boolean = false) {
        super(scene, x, y, 'npc-1');

        // Set NPC-specific properties
        this.HIT_POINTS = 100;
        this.MAX_HIT_POINTS = 100;
        this.VELOCITY = 0; // NPCs don't move
        this.isQuestGiver = isQuestGiver;
        
        // Reset quest state for new game (will be overridden by save data if loading)
        this.hasHadInitialConversation = false;
        this.questAccepted = false;
        this.questDeclined = false;
        this.currentQuest = null;
        this.completedQuests.clear();

        // Setup state machine
        this.setupStateMachine();

        // Setup physics
        this.setupPhysics();

        // Find player reference
        this.findPlayer();

        // Load quest data if quest giver
        if (isQuestGiver) {
            this.loadQuestData();
            this.setupEventListeners();
        }

        // Create name tag
        this.createNameTag();
    }

    public setStatic(isStatic: boolean = true): void {
        this.isStatic = isStatic;
        if (isStatic) {
            // Static NPCs have physics and collision but don't move
            this.setVelocity(0, 0);
            if (this.body && 'setImmovable' in this.body) {
                (this.body as Phaser.Physics.Arcade.Body).setImmovable(true);
            }
            if (this.body && 'setCollideWorldBounds' in this.body) {
                (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false);
            }
            // Don't start the state machine for static NPCs
            if (this.animsFSM) {
                this.animsFSM.transition('idle');
            }
        }
    }

    public getIsStatic(): boolean {
        return this.isStatic;
    }

    public getPlayer(): Player | null {
        return this.player;
    }

    private setupStateMachine(): void {
        const states = {
            'idle': new NPCIdleState(),
            'interacting': new NPCInteractingState()
        };

        this.animsFSM = new StateMachine('idle', states, [this.scene, this]);
    }

    private setupPhysics(): void {
        this.setCollideWorldBounds(false);
        this.setSize(16, 16);
        this.setOffset(8, 8);

        // Make interactive
        this.setInteractive();
        this.on('pointerdown', () => {
            // Check if player is within interaction range
            if (this.player) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
                if (distance <= 100) { // Same range as E key interaction
                    this.interact();
                } else {
                    // Player too far away for interaction
                }
            } else {
                // No player reference for interaction
            }
        });
    }

    private findPlayer(): void {
        // Find player in the scene
        this.player = this.scene.children.getByName('player') as Player || 
                     this.scene.children.getByName('Player') as Player;
    }

    private loadQuestData(): void {
        // Load quest data from scene cache
        this.questData = this.scene.cache.json.get('quest-1');
        this.initializeQuests();
    }

    /**
     * Restore NPC state from quest system after save data is loaded
     */
    public restoreStateFromQuestSystem(): void {
        console.log('=== RESTORING NPC STATE FROM QUEST SYSTEM ===');
        
        // Get the quest system from the scene
        const questSystem = this.scene.data.get('questSystem');
        if (!questSystem) {
            console.warn('Quest system not available for NPC state restoration');
            return;
        }

        // Get active quests from quest system
        const activeQuests = questSystem.getActiveQuests();
        console.log('Active quests from quest system:', Array.from(activeQuests.keys()));

        if (activeQuests.size > 0) {
            // Find the current quest (lowest ID active quest)
            const currentQuestId = Math.min(...Array.from(activeQuests.keys()) as number[]);
            const questProgress = activeQuests.get(currentQuestId);
            
            if (questProgress && !questProgress.isCompleted) {
                // Restore the current quest
                const questData = this.scene.cache.json.get(`quest-${currentQuestId}`);
                if (questData) {
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
                    
                    // Mark as accepted since it's active in quest system
                    this.questAccepted = true;
                    this.questDeclined = false;
                    this.hasHadInitialConversation = true;
                    
                    console.log(`Restored NPC state: Quest ${currentQuestId} active, accepted: ${this.questAccepted}`);
                }
            } else if (questProgress && questProgress.isCompleted) {
                // Quest is completed, advance to next quest
                this.advanceToNextQuest();
                console.log('Quest was completed, advanced to next quest');
            }
        } else {
            // No active quests, check if we should start the first quest or advance to next available quest
            const completedQuests = questSystem.getCompletedQuests();
            console.log('Completed quests from quest system:', Array.from(completedQuests));
            
            if (completedQuests.size > 0) {
                // Find the highest completed quest ID and advance to the next one
                const highestCompletedQuestId = Math.max(...Array.from(completedQuests) as number[]);
                const nextQuestId = highestCompletedQuestId + 1;
                
                if (nextQuestId <= 14) {
                    // Load the next quest
                    const questData = this.scene.cache.json.get(`quest-${nextQuestId}`);
                    if (questData) {
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
                        
                        // Mark as not accepted yet (player needs to accept the new quest)
                        this.questAccepted = false;
                        this.questDeclined = false;
                        this.hasHadInitialConversation = false;
                        
                        console.log(`Restored NPC state: Quest ${nextQuestId} available after completing quest ${highestCompletedQuestId}`);
                    }
                } else {
                    // All quests completed
                    this.currentQuest = null;
                    console.log('All quests completed');
                }
            } else {
                // No completed quests, start with first quest
                this.initializeQuests();
                console.log('No completed quests, initialized first quest');
            }
        }
        
        console.log('=== END NPC STATE RESTORATION ===');
    }

    private setupEventListeners(): void {
        // Listen for dialogue events
        this.scene.events.on('dialogueAction', this.handleDialogueAction, this);
        this.scene.events.on('dialogueNext', this.handleDialogueNext, this);
        this.scene.events.on('dialogueEnded', this.handleDialogueEnded, this);
        // Event listeners set up for dialogue events
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
        
        // Initialized with quest
    }

    public setPlayer(player: Player): void {
        this.player = player;
    }

    public isPlayerInRange(): boolean {
        if (!this.player) return false;
        
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );
        
        return distance <= this.interactionRange;
    }

    public interact(): void {
        console.log('=== NPC INTERACT CALLED ===');
        console.log('Player exists:', !!this.player);
        console.log('Is interacting:', this.isInteracting);
        console.log('Is quest giver:', this.isQuestGiver);
        console.log('Has had initial conversation:', this.hasHadInitialConversation);
        console.log('Quest accepted:', this.questAccepted);
        console.log('Quest declined:', this.questDeclined);
        console.log('Current quest:', this.currentQuest);
        
        if (!this.player || this.isInteracting) {
            console.log('Cannot interact - no player or already interacting');
            return;
        }
        
        this.isInteracting = true;
        
        if (this.isQuestGiver) {
            console.log('Handling quest interaction');
            this.handleQuestInteraction();
        } else {
            console.log('Handling basic interaction');
            this.handleBasicInteraction();
        }
    }

    private handleQuestInteraction(): void {
        console.log('=== HANDLING QUEST INTERACTION ===');
        console.log('hasAcceptedQuest():', this.hasAcceptedQuest());
        console.log('questDeclined:', this.questDeclined);
        console.log('hasHadInitialConversation:', this.hasHadInitialConversation);
        console.log('isQuestCompleted():', this.isQuestCompleted());
        console.log('questDeclined:', this.questDeclined);
        console.log('currentQuest:', this.currentQuest);
        
        // Check if player has accepted the quest
        if (this.hasAcceptedQuest()) {
            console.log('Quest has been accepted');
            // Check if quest is completed
            if (this.isQuestCompleted()) {
                console.log('Quest is completed, starting completion dialogue');
                this.startQuestCompleteDialogue();
            } else {
                console.log('Quest is active but not completed, starting incomplete dialogue');
                this.startQuestIncompleteDialogue();
            }
        } else if (!this.hasHadInitialConversation) {
            console.log('First time meeting - showing quest offer');
            // First time meeting - show full quest offer
            this.startQuestOfferDialogue();
            this.hasHadInitialConversation = true;
        } else if (this.questDeclined) {
            console.log('Quest was declined, showing return dialogue');
            // Player previously declined quest - show return dialogue
            this.startReturnDialogue();
        } else {
            console.log('Return visit - checking for quest to offer');
            // Return visit - check if there's a quest to offer
            if (this.currentQuest) {
                console.log('Current quest exists, offering quest');
                this.startQuestOfferDialogue();
            } else {
                console.log('No current quest, showing return dialogue');
                this.startReturnDialogue();
            }
        }
    }

    private handleBasicInteraction(): void {
        // Default interaction for non-quest NPCs
    }

    // Quest System Methods
    private startQuestOfferDialogue(): void {
        if (!this.currentQuest) return;
        
        // Create proper dialogue based on quest ID instead of using quest description
        let dialogueText = '';
        
        switch (this.currentQuest.id) {
            case 1:
                dialogueText = "Greetings, traveler. I am Narvark, a scholar of the dimensional arts. You've entered the Convergence Valley - a place where three realms once met in harmony. Now it's a reality storm where time and space constantly shift. Strange herbs grow here, pulsing with dimensional energy. Will you help me collect five of these dimensional herbs?";
                break;
            case 2:
                dialogueText = "My analysis reveals something disturbing. The herbs contain traces of Void energy - the same force corrupting this valley. Creatures called Nepian emerged when the dimensional barriers collapsed. I need you to eliminate five Nepian scouts in the southern regions. They're spreading the corruption.";
                break;
            case 3:
                dialogueText = "Your success has given me an idea. The Nepian's blood contains concentrated Void energy. If we can collect enough, we might create a weapon against them. I need you to collect the blood of three Nepian warriors. Be careful - their blood is highly corrosive.";
                break;
            case 4:
                dialogueText = "I've discovered something crucial. The Nepian are being led by an Electro Lord - a Void entity corrupting the valley's dimensional anchors. If we can destroy it and claim its heart, we might restore the dimensional barriers. The Electro Lord resides in the southeastern corner.";
                break;
            case 5:
                dialogueText = "The Electro Lord's heart has revealed the truth. This valley was once the Convergence Point where three realms met. The old mine contains a gateway to the Crystalline Empire's ruins. I need you to clear the mine of Nepian forces and secure the gateway.";
                break;
            case 6:
                dialogueText = "The Electro Lord's defeat has weakened the Nepian's hold on the valley, but they're not giving up easily. More scouts and warriors are moving in to replace their fallen leader. I need you to clear the valley of these reinforcements.";
                break;
            case 7:
                dialogueText = "With the valley secured, we can now safely investigate the mine gateway. The Electro Lord's heart revealed that it leads to the Crystalline Empire's ruins. I need you to explore the mine and gather information about the gateway's mechanism.";
                break;
            case 8:
                dialogueText = "The crystal fragments have given me an idea. The gateway requires pure dimensional energy to activate, but the valley's energy is corrupted. I need you to collect pure energy crystals from the northern regions.";
                break;
            case 9:
                dialogueText = "Before we can activate the gateway, we need to understand more about the Reality Anchors. There might be fragments of the Crystalline Anchor scattered throughout the valley. I need you to search for any remaining pieces.";
                break;
            case 10:
                dialogueText = "The Nepian have established a major stronghold in the valley's eastern regions. They're using it as a staging ground for their invasion. I need you to assault their stronghold and eliminate their leader.";
                break;
            case 11:
                dialogueText = "With the Nepian threat neutralized and all components gathered, we can now attempt to activate the gateway to the Crystalline Empire's ruins. I need you to activate the gateway and secure the passage.";
                break;
            case 12:
                dialogueText = "The gateway has opened a path to the Crystalline Empire's ruins. These ancient structures contain the knowledge we need to understand the Reality Anchors. I need you to explore the ruins and recover the Empire's knowledge.";
                break;
            case 13:
                dialogueText = "The Empire's knowledge has revealed the locations of the other Reality Anchors. The Sand Anchor is protected by the Sand Kingdoms' last strongholds, but they're under siege. I need you to venture into the desert and help defend them.";
                break;
            case 14:
                dialogueText = "The final piece of the puzzle. The Forest Anchor is deep in the western forest regions, but the Elden Forest has been corrupted by the Void. I need you to venture into the forest and help cleanse the corruption.";
                break;
            default:
                dialogueText = this.currentQuest.description; // Fallback to description for other quests
        }
        
        const dialogue: DialogueData = {
            id: 'quest_offer',
            text: dialogueText,
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
        
        // Mark quest as declined
        this.questDeclined = true;
        
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
            
            this.showDialogue(dialogue);
        });
    }

    public startQuestAcceptedDialogue(): void {
        if (!this.currentQuest) return;
        
        // Prevent multiple quest starts
        if (this.questAccepted) {
            console.log(`NPC: Quest ${this.currentQuest.id} already accepted, skipping duplicate start`);
            return;
        }
        
        // Mark quest as accepted and reset declined flag
        this.questAccepted = true;
        this.questDeclined = false;
        
        // Start quest in QuestSystem
        console.log(`NPC: Emitting startQuest event for quest ${this.currentQuest.id}`);
        if (this.scene && this.scene.events) {
            this.scene.events.emit('startQuest', this.currentQuest.id);
        } else {
            console.error('NPC: Scene or events not available for quest start');
            return;
        }
        
        // Wait a moment for QuestSystem to process the quest start, then emit quest accepted event
        if (this.scene && this.scene.time) {
            this.scene.time.delayedCall(50, () => {
                // Get current progress from QuestSystem
                const questSystem = this.scene.data.get('questSystem');
            let currentProgress = 0;
            if (questSystem && this.currentQuest) {
                const activeQuests = questSystem.getActiveQuests();
                const questProgress = activeQuests.get(this.currentQuest.id);
                if (questProgress) {
                    currentProgress = questProgress.currentAmount;
                }
            }
            
            // Emit quest accepted event for QuestUI with correct current progress
            if (this.currentQuest) {
                this.scene.events.emit('questAccepted', {
                    id: this.currentQuest.id.toString(),
                    title: this.currentQuest.name,
                    description: this.currentQuest.requirements,
                    type: this.currentQuest.questData.type,
                    amount: this.currentQuest.questData.amount,
                    current: currentProgress
                });
            }
            });
        } else {
            console.error('NPC: Scene or time not available for quest start');
        }
        
        // Just close the dialogue and return to game
        this.scene.events.emit('hideDialogue');
    }

    private completeQuest(): void {
        if (!this.currentQuest) {
            return;
        }
        
        // Prevent duplicate quest completion
        if (this.completedQuests.has(this.currentQuest.id)) {
            console.log(`NPC: Quest ${this.currentQuest.id} already completed, skipping duplicate completion`);
            return;
        }
        
        // Use the quest system to complete the quest
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const success = questSystem.completeQuestAtNPC(this.currentQuest.id);
            if (success) {
                // Mark quest as completed in NPC
                this.completedQuests.add(this.currentQuest.id);
                
                // Quest completed - reward will be handled by completeQuestAndReward method
                
                // Move to next quest
                this.advanceToNextQuest();
            } else {
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
        
        this.scene.events.emit('hideDialogue');
    }

    private completeQuestAndReward(): void {
        if (!this.currentQuest) {
            return;
        }
        
        // Safety check for scene
        if (!this.scene || !this.scene.data) {
            console.error('UnifiedNPC: Scene or scene.data not available for quest completion');
            return;
        }
        
        // Use the quest system to complete the quest
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const success = questSystem.completeQuestAtNPC(this.currentQuest.id);
            if (success) {
                // Mark quest as completed in NPC
                this.completedQuests.add(this.currentQuest.id);
                
                // Reward will be handled by the World scene's quest completion event handler
                
                // Close dialogue and return to game
                if (this.scene && this.scene.events) {
                    this.scene.events.emit('hideDialogue');
                }
                
                // Move to next quest
                this.advanceToNextQuest();
            } else {
            }
        } else {
            console.error('NPC: Quest system not found');
        }
    }

    private completeQuestOnly(): void {
        if (!this.currentQuest) {
            return;
        }
        
        // Use the quest system to complete the quest
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const success = questSystem.completeQuestAtNPC(this.currentQuest.id);
            if (success) {
                // Mark quest as completed in NPC
                this.completedQuests.add(this.currentQuest.id);
                
                // Close dialogue and return to game
                this.scene.events.emit('hideDialogue');
                
                // Move to next quest but don't start it automatically
                this.advanceToNextQuest();
            } else {
            }
        } else {
            console.error('NPC: Quest system not found');
        }
    }

    private advanceToNextQuest(): void {
        const nextQuestId = this.currentQuest!.id + 1;
        
        if (nextQuestId <= 14) {
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
            this.questDeclined = false;
            
            
            // Show placeholder dialogue for next quest
            this.showNextQuestPlaceholder();
        } else {
            this.currentQuest = null;
            this.questAccepted = false;
            this.questDeclined = false;
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
            
            this.showDialogue(dialogue);
        });
    }

    private getQuestProgress(): number {
        if (!this.currentQuest || !this.player) return 0;
        
        const itemType = this.currentQuest.questData.type;
        return this.player.p1Inventory.getItemCount(itemType);
    }

    private showDialogue(dialogue: DialogueData): void {
        // Set flag to prevent immediate closing
        this.dialogueJustOpened = true;
        
        // Emit event to show dialogue UI with NPC reference for distance checking
        this.scene.events.emit('showDialogue', dialogue, this);
    }

    private hasAcceptedQuest(): boolean {
        return this.questAccepted;
    }

    private isQuestCompleted(): boolean {
        if (!this.currentQuest || !this.player) return false;
        
        // Check if quest is ready for completion in the quest system
        if (this.scene && this.scene.data) {
            const questSystem = this.scene.data.get('questSystem');
            if (questSystem) {
                const isReady = questSystem.isQuestReadyForCompletion(this.currentQuest.id);
                return isReady;
            }
        }
        
        // Fallback to checking inventory
        const progress = this.getQuestProgress();
        const isComplete = progress >= this.currentQuest.questData.amount;
        return isComplete;
    }

    private getQuestItemName(): string {
        if (!this.currentQuest) return 'items';
        
        const questItemType = this.currentQuest.questData.type;
        
        // Convert quest item type to readable name
        switch (questItemType) {
            case 'mysterious herb':
                return 'mysterious herbs';
            case 'dimensional herb':
                return 'dimensional herbs';
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
        
        // console.log('NPC: Showing quest incomplete dialogue for:', questItemName);
        this.showDialogue(dialogue);
    }

    private startQuestCompleteDialogue(): void {
        if (!this.currentQuest) return;
        
        const dialogue: DialogueData = {
            id: 'quest_complete',
            text: this.currentQuest.completionText,
            responses: [
                {
                    text: "Here are the items you requested.",
                    action: 'complete_quest_and_reward'
                }
            ],
            reward: {
                type: 'gold-coin',
                amount: 10
            }
        };
        
        // console.log('NPC: Showing quest complete dialogue with reward');
        this.showDialogue(dialogue);
    }

    // Dialogue Event Handlers
    private handleDialogueAction(action: string): void {
        // console.log('NPC: Handling dialogue action:', action);
        
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
            case 'complete_quest_only':
                this.completeQuestOnly();
                break;
            case 'continue':
                // console.log('NPC: Player will continue quest, closing dialogue');
                if (this.scene && this.scene.events) {
                    this.scene.events.emit('hideDialogue');
                }
                break;
            case 'close_dialogue':
                // console.log('NPC: Closing dialogue and returning to game');
                if (this.scene && this.scene.events) {
                    this.scene.events.emit('hideDialogue');
                }
                break;
            case 'show_snarky_remark':
                // console.log('NPC: Showing snarky remark');
                this.startQuestDeclinedDialogue();
                break;
            default:
                // console.log('NPC: Unknown dialogue action:', action);
        }
    }

    public handleDialogueNext(dialogueId: string): void {
        // console.log('NPC: Handling dialogue next:', dialogueId);
        
        switch (dialogueId) {
            case 'quest_accepted':
                this.startQuestAcceptedDialogue();
                break;
            case 'quest_declined':
                this.startQuestDeclinedDialogue();
                break;
            default:
                // console.log('NPC: Unknown dialogue ID:', dialogueId);
        }
    }

    private acceptQuest(): void {
        // console.log('NPC: Quest accepted');
        // Quest acceptance logic would go here
    }

    private declineQuest(): void {
        // console.log('NPC: Quest declined');
        // Emit quest abandoned event to hide quest UI
        if (this.currentQuest) {
            this.scene.events.emit('questAbandoned', {
                id: this.currentQuest.id.toString(),
                title: this.currentQuest.name,
                description: this.currentQuest.description,
                type: this.currentQuest.questData.type,
                amount: this.currentQuest.questData.amount,
                current: 0
            });
        }
    }

    private handleDialogueEnded(): void {
        // console.log('NPC: Dialogue ended, resetting interaction state');
        this.isInteracting = false;
    }

    // Legacy Ally Methods (for compatibility)
    public handlePlayerInteraction(): void {
        if (!this.player || !this.questData) return;

        // Check if player has required items
        const currentQuest = this.player.getQuestStatus().currentQuest;
        if (currentQuest && this.player.getInventory().has(currentQuest.type, currentQuest.amount)) {
            // Complete quest
            this.completeQuest();
        } else {
            // Show quest dialog
            this.showQuestDialog();
        }

        this.isInteracting = false;
    }

    private showQuestDialog(): void {
        // Show quest dialog to player
        // This would typically open a UI dialog
        // console.log('Quest dialog: ' + this.questData.description);
    }


    public getQuestData(): any {
        return this.questData;
    }

    // Visual and Interaction Methods
    public showQuestIcon(): void {
        if (!this.questIcon) {
            this.questIcon = this.scene.add.sprite(this.x, this.y - 40, 'quest-icon', 0);
            this.questIcon.setScale(2);
            this.questIcon.play('quest-icon-bounce');
        }
    }

    public hideQuestIcon(): void {
        if (this.questIcon) {
            this.questIcon.destroy();
            this.questIcon = undefined;
        }
    }

    public isPlayerInteracting(): boolean {
        return this.isInteracting;
    }

    private showInteractionPrompt(): void {
        // Create medieval-themed visual prompt above NPC's head
        if (!this.interactionPrompt) {
            this.interactionPrompt = this.scene.add.container(this.x, this.y - 40);
            
            // Create medieval shield-like background (smaller size)
            const bg = this.scene.add.graphics();
            
            // Outer bronze ring
            bg.fillStyle(0x8B4513, 0.9); // Bronze color
            bg.fillCircle(0, 0, 16);
            
            // Inner dark leather background
            bg.fillStyle(0x2F1F14, 0.95); // Dark brown leather
            bg.fillCircle(0, 0, 13);
            
            // Inner highlight ring
            bg.lineStyle(1, 0x4A3C28, 0.8); // Lighter brown highlight
            bg.strokeCircle(0, 0, 12);
            
            // Outer bronze border
            bg.lineStyle(2, 0xCD853F, 1); // Light bronze border
            bg.strokeCircle(0, 0, 16);
            
            // Decorative corner studs (medieval style) - smaller
            bg.fillStyle(0x696969, 1); // Dim gray for metal studs
            bg.fillCircle(-10, -10, 1);
            bg.fillCircle(10, -10, 1);
            bg.fillCircle(-10, 10, 1);
            bg.fillCircle(10, 10, 1);
            
            // Create "E" text - centered properly in the circle (much smaller)
            const eText = this.scene.add.bitmapText(0, 0, 'pixel-white', 'E', 8);
            eText.setOrigin(0.5, 0.5);
            
            // Add subtle glow effect (smaller)
            const glow = this.scene.add.graphics();
            glow.fillStyle(0xFFD700, 0.3); // Golden glow
            glow.fillCircle(0, 0, 20);
            glow.setBlendMode(Phaser.BlendModes.ADD);
            
            this.interactionPrompt.add([glow, bg, eText]);
            this.interactionPrompt.setDepth(1000); // High depth to appear above everything
        }
        
        this.interactionPrompt.setVisible(true);
        // console.log('NPC: Player in range - press E to interact');
    }

    private hideInteractionPrompt(): void {
        // Hide interaction prompt
        if (this.interactionPrompt) {
            this.interactionPrompt.setVisible(false);
        }
    }

    public endInteraction(): void {
        this.isInteracting = false;
        this.scene.events.emit('hideDialogue');
    }

    public updatePosition(): void {
        // Update interaction prompt position to follow NPC
        if (this.interactionPrompt) {
            this.interactionPrompt.setPosition(this.x, this.y - 40);
        }
    }

    // Getters for quest system
    public getCurrentQuest(): QuestData | null {
        return this.currentQuest;
    }

    public getCompletedQuests(): Set<number> {
        return this.completedQuests;
    }

    // Entity overrides
    public update(): void {
        // Update state machine
        this.animsFSM.step();

        // Update health bar position
        this.updateHealthBar();

        // Update name tag position
        this.updateNameTag();

        // Update interaction prompt position
        this.updatePosition();
        
        // Check for interaction proximity (separate from interaction state)
        const playerInRange = this.player && this.isPlayerInRange();
        
        if (playerInRange && !this.playerInRangeLastFrame && !this.isInteracting) {
            // Player just entered range - show interaction prompt
            this.showInteractionPrompt();
        } else if (!playerInRange && this.playerInRangeLastFrame) {
            // Player just left range - hide interaction prompt and close dialogue
            this.hideInteractionPrompt();
            // Only close dialogue if it wasn't just opened (to prevent immediate closing)
            if (!this.dialogueJustOpened) {
                this.closeDialogueIfOpen();
            }
        }
        
        // Reset dialogue just opened flag after a short delay
        if (this.dialogueJustOpened) {
            this.scene.time.delayedCall(200, () => {
                this.dialogueJustOpened = false;
            });
        }
        
        this.playerInRangeLastFrame = playerInRange ?? false;
    }

    private closeDialogueIfOpen(): void {
        // Check if dialogue is currently open and close it
        console.log('NPC: Closing dialogue due to player leaving range');
        this.scene.events.emit('closeDialogue');
    }

    public takeDamage(_amount: number): void {
        // NPCs don't take damage
        return;
    }

    protected die(): void {
        // NPCs don't die
        return;
    }

    public destroy(): void {
        // Clean up interaction prompt
        if (this.interactionPrompt) {
            this.interactionPrompt.destroy();
            this.interactionPrompt = null;
        }

        // Clean up quest icon
        if (this.questIcon) {
            this.questIcon.destroy();
            this.questIcon = undefined;
        }

        // Call parent destroy
        super.destroy();
    }
}
