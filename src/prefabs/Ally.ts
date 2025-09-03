import Phaser from 'phaser';
import { Entity } from './Entity';
import { StateMachine, State } from '../lib/StateMachine';



// Ally States
class AllyIdleState extends State {
    enter(_scene: Phaser.Scene, ally: Ally): void {
        ally.setVelocity(0, 0);

        // Check if animation exists before playing
        if (ally.anims.exists('npc-1')) {
            ally.anims.play('npc-1', true);
            ally.anims.stop();
        } else {
            console.warn('Animation "npc-1" not found');
        }
    }

    execute(_scene: Phaser.Scene, ally: Ally): void {
        // For static NPCs, don't do any interaction detection
        if (ally.getIsStatic()) {
            return; // Static NPCs don't interact
        }

        // For regular villagers, check if player is nearby using simple distance calculation
        const player = ally.getPlayer();
        if (player) {
            const distance = Phaser.Math.Distance.Between(ally.x, ally.y, player.x, player.y);
            if (distance < 100) { // Interaction range
                ally.animsFSM.transition('interacting');
            }
        }
    }
}

class AllyInteractingState extends State {
    enter(_scene: Phaser.Scene, ally: Ally): void {
        // Show quest icon or interaction prompt
        ally.showQuestIcon();
    }

    execute(_scene: Phaser.Scene, ally: Ally): void {
        // For static NPCs, don't do any interaction detection
        if (ally.getIsStatic()) {
            return; // Static NPCs don't interact
        }

        // Check if player is still nearby using simple distance calculation
        const player = ally.getPlayer();
        if (player) {
            const distance = Phaser.Math.Distance.Between(ally.x, ally.y, player.x, player.y);
            if (distance > 100) { // Out of interaction range
                ally.animsFSM.transition('idle');
            }
        }

        // Check for player interaction
        if (ally.isPlayerInteracting()) {
            ally.handlePlayerInteraction();
        }
    }
}

export class Ally extends Entity {
    public animsFSM!: StateMachine;
    private player: any;
    private isStatic: boolean = false; // For static NPCs like quest givers
    private questIcon?: Phaser.GameObjects.Sprite;
    private isInteracting: boolean = false;
    private questData: any;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'npc-1');

        // Set ally-specific properties
        this.HIT_POINTS = 100;
        this.MAX_HIT_POINTS = 100;
        this.VELOCITY = 0; // NPCs don't move

        // Setup state machine
        this.setupStateMachine();

        // Setup physics
        this.setupPhysics();

        // Find player reference
        this.findPlayer();

        // Load quest data
        this.loadQuestData();

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

    public getPlayer(): any {
        return this.player;
    }

    private setupStateMachine(): void {
        const states = {
            'idle': new AllyIdleState(),
            'interacting': new AllyInteractingState()
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
                    console.log('Ally: Player too far away for interaction');
                }
            } else {
                console.log('Ally: No player reference for interaction');
            }
        });
    }

    private findPlayer(): void {
        // Find player in the scene
        this.player = this.scene.children.getByName('player') || this.scene.children.getByName('Player');
    }

    private loadQuestData(): void {
        // Load quest data from scene cache
        this.questData = this.scene.cache.json.get('quest-1');
    }

    public interact(): void {
        // Default interaction - can be overridden by NPC class
        console.log('Ally: Default interaction triggered');
    }

    public update(): void {
        // Update state machine
        this.animsFSM.step();

        // Update health bar position
        this.updateHealthBar();

        // Update name tag position
        this.updateNameTag();
    }

    public takeDamage(_amount: number): void {
        // Allies don't take damage
        return;
    }

    protected die(): void {
        // Allies don't die
        return;
    }

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
        console.log('Quest dialog: ' + this.questData.description);
    }

    private completeQuest(): void {
        const currentQuest = this.player.getQuestStatus().currentQuest;
        if (!currentQuest) return;

        // Remove items from inventory
        this.player.getInventory().remove(currentQuest.type, currentQuest.amount);

        // Update quest status
        this.player.setQuestStatus({
            finished: false,
            currentQuest: this.getNextQuest()
        });

        // Play completion sound
        this.scene.sound.play('complete-quest', { volume: 0.5 });

        // Show completion message
        console.log('Quest completed!');

        // Save game
        this.player.saveGame();
    }

    private getNextQuest(): any {
        // Get next quest in sequence
        // This is a simplified version
        return this.questData;
    }

    public getQuestData(): any {
        return this.questData;
    }
}
