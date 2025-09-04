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

        // Check if animation exists before playing
        if (npc.anims.exists('npc-1')) {
            npc.anims.play('npc-1', true);
            npc.anims.stop();
        } else {
            console.warn('Animation "npc-1" not found');
        }
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
        if (!this.player || this.isInteracting) return;
        
        this.isInteracting = true;
        
        if (this.isQuestGiver) {
            this.handleQuestInteraction();
        } else {
            this.handleBasicInteraction();
        }
    }

    private handleQuestInteraction(): void {
        
        // Check if player has accepted the quest
        if (this.hasAcceptedQuest()) {
            // Check if quest is completed
            if (this.isQuestCompleted()) {
                this.startQuestCompleteDialogue();
            } else {
                this.startQuestIncompleteDialogue();
            }
        } else if (!this.hasHadInitialConversation) {
            // First time meeting - show full quest offer
            this.startQuestOfferDialogue();
            this.hasHadInitialConversation = true;
        } else if (this.questDeclined) {
            // Player previously declined quest - show return dialogue
            this.startReturnDialogue();
        } else {
            // Return visit - check if there's a quest to offer
            if (this.currentQuest) {
                this.startQuestOfferDialogue();
            } else {
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
        
        
        // Mark quest as accepted and reset declined flag
        this.questAccepted = true;
        this.questDeclined = false;
        
        // Start quest in QuestSystem
        this.scene.events.emit('startQuest', this.currentQuest.id);
        
        // Wait a moment for QuestSystem to process the quest start, then emit quest accepted event
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
        
        // Just close the dialogue and return to game
        this.scene.events.emit('hideDialogue');
    }

    private completeQuest(): void {
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
        
        
        // Use the quest system to complete the quest
        const questSystem = this.scene.data.get('questSystem');
        if (questSystem) {
            const success = questSystem.completeQuestAtNPC(this.currentQuest.id);
            if (success) {
                // Mark quest as completed in NPC
                this.completedQuests.add(this.currentQuest.id);
                
                // Add reward to player inventory immediately
                if (this.player) {
                    this.player.p1Inventory.add('gold-coin', 10);
                }
                
                // Close dialogue and return to game
                this.scene.events.emit('hideDialogue');
                
                // Move to next quest
                this.advanceToNextQuest();
            } else {
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
        // Emit event to show dialogue UI with NPC reference for distance checking
        this.scene.events.emit('showDialogue', dialogue, this);
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
            return isReady;
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
                    text: "Here are the herbs you requested.",
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
            case 'continue':
                // console.log('NPC: Player will continue quest, closing dialogue');
                this.scene.events.emit('hideDialogue');
                break;
            case 'close_dialogue':
                // console.log('NPC: Closing dialogue and returning to game');
                this.scene.events.emit('hideDialogue');
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
        // Quest decline logic would go here
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
            this.questIcon = this.scene.add.sprite(this.x, this.y - 40, 'quest-icon');
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
        
        // Check for interaction
        const playerInRange = this.player && this.isPlayerInRange() && !this.isInteracting;
        
        if (playerInRange && !this.playerInRangeLastFrame) {
            // Player just entered range - show interaction prompt
            this.showInteractionPrompt();
        } else if (!playerInRange && this.playerInRangeLastFrame) {
            // Player just left range - hide interaction prompt
            this.hideInteractionPrompt();
        }
        
        this.playerInRangeLastFrame = playerInRange ?? false;
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
