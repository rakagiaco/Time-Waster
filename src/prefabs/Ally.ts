import Phaser from 'phaser';
import { Entity } from './Entity';
import { StateMachine, State } from '../../lib/StateMachine';
import { listen } from '../../lib/HelperFunc';


// Ally States
class AllyIdleState extends State {
    enter(_scene: Phaser.Scene, ally: Ally): void {
        ally.setVelocity(0, 0);
        ally.anims.play('npc-1', true);
        ally.anims.stop();
    }

    execute(scene: Phaser.Scene, ally: Ally): void {
        // Check if player is nearby for interaction
        if (listen(scene as any, ally)) {
            ally.animsFSM.transition('interacting');
        }
    }
}

class AllyInteractingState extends State {
    enter(_scene: Phaser.Scene, ally: Ally): void {
        // Show quest icon or interaction prompt
        ally.showQuestIcon();
    }

    execute(scene: Phaser.Scene, ally: Ally): void {
        // Check if player is still nearby
        if (!listen(scene as any, ally)) {
            ally.animsFSM.transition('idle');
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
            this.isInteracting = true;
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

    public update(): void {
        // Update state machine
        this.animsFSM.step();
        
        // Update health bar position
        this.updateHealthBar();
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
