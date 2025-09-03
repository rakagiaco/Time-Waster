import Phaser from 'phaser';
import { DialogueData, DialogueResponse } from '../prefabs/NPC';

/**
 * DialogueUI - Handles scrolling dialogue with button responses
 * Creates a medieval scroll-style dialogue interface
 */
export class DialogueUI {
    private scene: Phaser.Scene;
    private isActive: boolean = false;
    private currentDialogue: DialogueData | null = null;
    
    // UI Elements
    private dialogueContainer: Phaser.GameObjects.Container | null = null;
    private scrollBackground: Phaser.GameObjects.Graphics | null = null;
    private dialogueText: Phaser.GameObjects.BitmapText | null = null;
    private responseButtons: Phaser.GameObjects.Container[] = [];
    private continueButton: Phaser.GameObjects.Graphics | null = null;
    private continueText: Phaser.GameObjects.BitmapText | null = null;
    private rewardDisplay: Phaser.GameObjects.Container | null = null;
    
    // Animation properties
    private textDisplaySpeed: number = 30; // Characters per second
    private currentTextIndex: number = 0;
    private fullText: string = '';
    private isTyping: boolean = false;
    private typeTimer: number = 0;
    
    // Paragraph system
    private paragraphs: string[] = [];
    private currentParagraphIndex: number = 0;
    private isWaitingForInput: boolean = false;
    
    // UI dimensions
    private readonly UI_WIDTH = 700;
    private readonly UI_HEIGHT = 400;
    private readonly SCROLL_PADDING = 30;
    private readonly TEXT_PADDING = 50;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.scene.events.on('showDialogue', (dialogue: DialogueData) => {
            this.showDialogue(dialogue);
        });
        
        this.scene.events.on('hideDialogue', () => {
            this.hideDialogue();
        });
        
        // Handle input
        this.scene.input.keyboard?.on('keydown-SPACE', () => {
            if (this.isActive) {
                this.handleContinue();
            }
        });
        
        this.scene.input.keyboard?.on('keydown-ENTER', () => {
            if (this.isActive) {
                this.handleContinue();
            }
        });
    }

    public showDialogue(dialogue: DialogueData): void {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentDialogue = dialogue;
        this.createDialogueUI();
        this.startTextAnimation(dialogue.text);
        
        console.log('DialogueUI: Showing dialogue:', dialogue.id);
        console.log('DialogueUI: Dialogue text:', dialogue.text);
    }

    private createDialogueUI(): void {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Create main container
        this.dialogueContainer = this.scene.add.container(centerX, centerY);
        this.dialogueContainer.setDepth(20000);
        this.dialogueContainer.setScrollFactor(0);
        
        // Create scroll background
        this.createScrollBackground();
        
        // Create dialogue text area
        this.createDialogueText();
        
        // Create continue button
        this.createContinueButton();
    }

    private createScrollBackground(): void {
        if (!this.dialogueContainer) return;
        
        this.scrollBackground = this.scene.add.graphics();
        this.dialogueContainer.add(this.scrollBackground);
        
        // Draw medieval scroll background
        this.scrollBackground.fillStyle(0xF5E6C3); // Parchment color
        this.scrollBackground.fillRoundedRect(
            -this.UI_WIDTH / 2, -this.UI_HEIGHT / 2,
            this.UI_WIDTH, this.UI_HEIGHT,
            15
        );
        
        // Add scroll border
        this.scrollBackground.lineStyle(3, 0x8B4513); // Brown border
        this.scrollBackground.strokeRoundedRect(
            -this.UI_WIDTH / 2, -this.UI_HEIGHT / 2,
            this.UI_WIDTH, this.UI_HEIGHT,
            15
        );
        
        // Add scroll details
        this.addScrollDetails();
    }

    private addScrollDetails(): void {
        if (!this.scrollBackground) return;
        
        // Add corner decorations
        const cornerSize = 20;
        this.scrollBackground.fillStyle(0x8B4513);
        
        // Top-left corner
        this.scrollBackground.fillCircle(-this.UI_WIDTH / 2 + cornerSize, -this.UI_HEIGHT / 2 + cornerSize, 8);
        // Top-right corner
        this.scrollBackground.fillCircle(this.UI_WIDTH / 2 - cornerSize, -this.UI_HEIGHT / 2 + cornerSize, 8);
        // Bottom-left corner
        this.scrollBackground.fillCircle(-this.UI_WIDTH / 2 + cornerSize, this.UI_HEIGHT / 2 - cornerSize, 8);
        // Bottom-right corner
        this.scrollBackground.fillCircle(this.UI_WIDTH / 2 - cornerSize, this.UI_HEIGHT / 2 - cornerSize, 8);
        
        // Add scroll texture lines
        this.scrollBackground.lineStyle(1, 0xD2B48C, 0.3);
        for (let i = 0; i < 5; i++) {
            const y = -this.UI_HEIGHT / 2 + 50 + (i * 40);
            this.scrollBackground.lineBetween(-this.UI_WIDTH / 2 + 30, y, this.UI_WIDTH / 2 - 30, y);
        }
    }

    private createDialogueText(): void {
        if (!this.dialogueContainer) return;
        
        this.dialogueText = this.scene.add.bitmapText(
            0, -this.UI_HEIGHT / 2 + 100,
            'pixel-black', '', 20
        );
        this.dialogueText.setTint(0x000000); // Black text for better visibility
        this.dialogueText.setOrigin(0.5, 0);
        this.dialogueText.setMaxWidth(this.UI_WIDTH - this.TEXT_PADDING * 2);
        this.dialogueText.setCenterAlign();
        this.dialogueText.setLineSpacing(8); // Add extra line spacing
        
        this.dialogueContainer.add(this.dialogueText);
    }

    private createContinueButton(): void {
        if (!this.dialogueContainer) return;
        
        const buttonY = this.UI_HEIGHT / 2 - 50;
        
        this.continueButton = this.scene.add.graphics();
        this.dialogueContainer.add(this.continueButton);
        
        // Draw button background
        this.continueButton.fillStyle(0x8B4513);
        this.continueButton.fillRoundedRect(-60, buttonY - 15, 120, 30, 8);
        
        this.continueButton.lineStyle(2, 0x654321);
        this.continueButton.strokeRoundedRect(-60, buttonY - 15, 120, 30, 8);
        
        // Add button text
        this.continueText = this.scene.add.bitmapText(
            0, buttonY,
            'pixel-black', 'CONTINUE', 16
        );
        this.continueText.setTint(0x000000); // Black text for better visibility
        this.continueText.setOrigin(0.5, 0.5);
        
        this.dialogueContainer.add(this.continueText);
        
        // Make button interactive
        this.continueButton.setInteractive(
            new Phaser.Geom.Rectangle(-60, buttonY - 15, 120, 30),
            Phaser.Geom.Rectangle.Contains
        );
        
        this.continueButton.on('pointerdown', () => {
            this.handleContinue();
        });
        
        this.continueButton.on('pointerover', () => {
            this.continueButton?.clear();
            this.continueButton?.fillStyle(0x654321);
            this.continueButton?.fillRoundedRect(-60, buttonY - 15, 120, 30, 8);
            this.continueButton?.lineStyle(2, 0x8B4513);
            this.continueButton?.strokeRoundedRect(-60, buttonY - 15, 120, 30, 8);
        });
        
        this.continueButton.on('pointerout', () => {
            this.continueButton?.clear();
            this.continueButton?.fillStyle(0x8B4513);
            this.continueButton?.fillRoundedRect(-60, buttonY - 15, 120, 30, 8);
            this.continueButton?.lineStyle(2, 0x654321);
            this.continueButton?.strokeRoundedRect(-60, buttonY - 15, 120, 30, 8);
        });
    }

    private startTextAnimation(text: string): void {
        // Break text into paragraphs (split by double newlines or periods followed by space and capital)
        this.paragraphs = this.breakIntoParagraphs(text);
        this.currentParagraphIndex = 0;
        this.isWaitingForInput = false;
        
        console.log('DialogueUI: Starting paragraph-based dialogue with', this.paragraphs.length, 'paragraphs');
        
        if (this.dialogueText) {
            this.dialogueText.setText('');
            console.log('DialogueUI: Dialogue text element created');
        } else {
            console.error('DialogueUI: Dialogue text element is null!');
        }
        
        // Start with the first paragraph
        this.showNextParagraph();
    }

    /**
     * Breaks long text into manageable paragraphs
     */
    private breakIntoParagraphs(text: string): string[] {
        // Split by periods followed by space and capital letter, or by double newlines
        const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/);
        const paragraphs: string[] = [];
        
        let currentParagraph = '';
        let sentenceCount = 0;
        
        for (const sentence of sentences) {
            currentParagraph += sentence + ' ';
            sentenceCount++;
            
            // Create a new paragraph every 3-4 sentences or if we hit a natural break
            if (sentenceCount >= 3 || sentence.includes('.') && currentParagraph.length > 200) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = '';
                sentenceCount = 0;
            }
        }
        
        // Add any remaining text as the last paragraph
        if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
        }
        
        return paragraphs;
    }

    /**
     * Shows the next paragraph in the sequence
     */
    private showNextParagraph(): void {
        if (this.currentParagraphIndex >= this.paragraphs.length) {
            // All paragraphs shown, show response buttons
            this.showResponseButtons();
            return;
        }
        
        const paragraph = this.paragraphs[this.currentParagraphIndex];
        this.fullText = paragraph;
        this.currentTextIndex = 0;
        this.isTyping = true;
        this.typeTimer = 0;
        this.isWaitingForInput = false;
        
        console.log(`DialogueUI: Showing paragraph ${this.currentParagraphIndex + 1}/${this.paragraphs.length}`);
    }

    public update(delta: number): void {
        if (!this.isActive || !this.isTyping) return;
        
        this.typeTimer += delta;
        const charsPerSecond = this.textDisplaySpeed;
        const charsToShow = Math.floor(this.typeTimer * charsPerSecond);
        
        if (charsToShow > this.currentTextIndex) {
            this.currentTextIndex = Math.min(charsToShow, this.fullText.length);
            
            if (this.dialogueText) {
                this.dialogueText.setText(this.fullText.substring(0, this.currentTextIndex));
            }
            
            if (this.currentTextIndex >= this.fullText.length) {
                this.isTyping = false;
                this.isWaitingForInput = true;
                // Show continue button to advance to next paragraph
                this.showContinueButton();
            }
        }
    }

    private showContinueButton(): void {
        if (!this.dialogueContainer) return;
        
        // Show continue button
        if (this.continueButton) {
            this.continueButton.setVisible(true);
        }
        if (this.continueText) {
            this.continueText.setVisible(true);
        }
    }

    private showResponseButtons(): void {
        if (!this.currentDialogue || !this.dialogueContainer) return;
        
        // Hide continue button
        if (this.continueButton) {
            this.continueButton.setVisible(false);
        }
        if (this.continueText) {
            this.continueText.setVisible(false);
        }
        
        // Show reward display if present
        if (this.currentDialogue.reward) {
            this.createRewardDisplay();
        }
        
        // Show response buttons if available
        if (this.currentDialogue.responses && this.currentDialogue.responses.length > 0) {
            this.createResponseButtons();
        } else {
            // Show continue button for dialogue without responses
            if (this.continueButton) {
                this.continueButton.setVisible(true);
            }
            if (this.continueText) {
                this.continueText.setVisible(true);
            }
        }
    }

    private createResponseButtons(): void {
        if (!this.currentDialogue || !this.dialogueContainer) return;
        
        const responses = this.currentDialogue.responses!;
        const buttonSpacing = 50;
        const startY = this.UI_HEIGHT / 2 - 80;
        
        responses.forEach((response, index) => {
            const buttonY = startY - (index * buttonSpacing);
            
            const buttonContainer = this.scene.add.container(0, buttonY);
            this.dialogueContainer!.add(buttonContainer);
            
            // Create button background
            const buttonBg = this.scene.add.graphics();
            buttonContainer.add(buttonBg);
            
            buttonBg.fillStyle(0x8B4513);
            buttonBg.fillRoundedRect(-200, -15, 400, 30, 8);
            
            buttonBg.lineStyle(2, 0x654321);
            buttonBg.strokeRoundedRect(-200, -15, 400, 30, 8);
            
            // Create button text
            const buttonText = this.scene.add.bitmapText(
                0, 0,
                'pixel-black', response.text, 14
            );
            buttonText.setTint(0x000000); // Black text for better visibility
            buttonText.setOrigin(0.5, 0.5);
            buttonText.setMaxWidth(380);
            buttonText.setCenterAlign();
            
            buttonContainer.add(buttonText);
            
            // Make button interactive
            buttonBg.setInteractive(
                new Phaser.Geom.Rectangle(-200, -15, 400, 30),
                Phaser.Geom.Rectangle.Contains
            );
            
            buttonBg.on('pointerdown', () => {
                console.log('DialogueUI: Button clicked:', response.text);
                this.handleResponse(response);
            });
            
            buttonBg.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x654321);
                buttonBg.fillRoundedRect(-200, -15, 400, 30, 8);
                buttonBg.lineStyle(2, 0x8B4513);
                buttonBg.strokeRoundedRect(-200, -15, 400, 30, 8);
            });
            
            buttonBg.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x8B4513);
                buttonBg.fillRoundedRect(-200, -15, 400, 30, 8);
                buttonBg.lineStyle(2, 0x654321);
                buttonBg.strokeRoundedRect(-200, -15, 400, 30, 8);
            });
            
            this.responseButtons.push(buttonContainer);
        });
    }

    private createRewardDisplay(): void {
        if (!this.currentDialogue || !this.dialogueContainer || !this.currentDialogue.reward) return;
        
        const reward = this.currentDialogue.reward;
        const rewardY = this.UI_HEIGHT / 2 - 120; // Position above response buttons
        
        // Create reward container
        const rewardContainer = this.scene.add.container(0, rewardY);
        this.dialogueContainer.add(rewardContainer);
        
        // Create reward background (inventory slot style)
        const rewardBg = this.scene.add.graphics();
        rewardContainer.add(rewardBg);
        
        // Draw inventory slot background with better styling
        rewardBg.fillStyle(0x2a2a2a, 0.95);
        rewardBg.fillRoundedRect(-32, -32, 64, 64, 8);
        
        rewardBg.lineStyle(3, 0x8B4513, 1);
        rewardBg.strokeRoundedRect(-32, -32, 64, 64, 8);
        
        rewardBg.lineStyle(2, 0x654321, 0.8);
        rewardBg.strokeRoundedRect(-30, -30, 60, 60, 6);
        
        rewardBg.lineStyle(1, 0x4a4a4a, 0.6);
        rewardBg.strokeRoundedRect(-28, -28, 56, 56, 4);
        
        // Add item sprite (gold coin) with fallback
        let itemSprite: Phaser.GameObjects.Sprite;
        if (this.scene.textures.exists('gold-coin')) {
            itemSprite = this.scene.add.sprite(0, 0, 'gold-coin');
        } else {
            // Fallback: create a simple gold circle
            itemSprite = this.scene.add.sprite(0, 0, 'gold-coin-fallback');
            if (!this.scene.textures.exists('gold-coin-fallback')) {
                // Create a simple gold circle texture
                const graphics = this.scene.add.graphics();
                graphics.fillStyle(0xffd700);
                graphics.fillCircle(16, 16, 12);
                graphics.generateTexture('gold-coin-fallback', 32, 32);
                graphics.destroy();
            }
            itemSprite = this.scene.add.sprite(0, 0, 'gold-coin-fallback');
        }
        itemSprite.setScale(0.7);
        rewardContainer.add(itemSprite);
        
        // Add quantity text with better styling
        const quantityText = this.scene.add.bitmapText(
            28, -28,
            'pixel-white', reward.amount.toString(), 14
        );
        quantityText.setTint(0xffffff); // White text for better visibility
        quantityText.setOrigin(1, 0);
        // Add background to quantity text
        const quantityBg = this.scene.add.graphics();
        quantityBg.fillStyle(0x000000, 0.8);
        quantityBg.fillRoundedRect(quantityText.x - quantityText.width - 4, quantityText.y - 2, quantityText.width + 8, quantityText.height + 4, 4);
        quantityBg.setPosition(0, 0);
        rewardContainer.add(quantityBg);
        rewardContainer.add(quantityText);
        
        // Add "Reward:" label
        const rewardLabel = this.scene.add.bitmapText(
            -80, 0,
            'pixel-white', 'Reward:', 14
        );
        rewardLabel.setTint(0xffd700); // Gold color
        rewardLabel.setOrigin(0, 0.5);
        rewardContainer.add(rewardLabel);
        
        this.rewardDisplay = rewardContainer;
    }

    private handleResponse(response: DialogueResponse): void {
        console.log('DialogueUI: Response selected:', response.text);
        console.log('DialogueUI: Response action:', response.action);
        console.log('DialogueUI: Response nextDialogueId:', response.nextDialogueId);
        
        // Check conditions
        if (response.condition && !response.condition()) {
            console.log('DialogueUI: Response condition not met');
            return;
        }
        
        // Handle actions
        if (response.action) {
            console.log('DialogueUI: Emitting dialogueAction event:', response.action);
            this.scene.events.emit('dialogueAction', response.action);
            
            // Direct handling for specific actions
            if (response.action === 'show_snarky_remark') {
                console.log('DialogueUI: Direct handling of show_snarky_remark action');
                if (this.scene.data && this.scene.data.get('npc')) {
                    const npc = this.scene.data.get('npc');
                    console.log('DialogueUI: Found NPC, calling startQuestDeclinedDialogue directly');
                    npc.startQuestDeclinedDialogue();
                }
            }
        }
        
        // Handle next dialogue
        if (response.nextDialogueId) {
            console.log('DialogueUI: Emitting dialogueNext event:', response.nextDialogueId);
            this.scene.events.emit('dialogueNext', response.nextDialogueId);
            
            // Also try to find and call the NPC directly
            if (this.scene.data && this.scene.data.get('npc')) {
                const npc = this.scene.data.get('npc');
                console.log('DialogueUI: Found NPC in scene data, calling handleDialogueNext directly');
                npc.handleDialogueNext(response.nextDialogueId);
                
                // Direct handling for quest_accepted
                if (response.nextDialogueId === 'quest_accepted') {
                    console.log('DialogueUI: Direct handling of quest_accepted');
                    npc.startQuestAcceptedDialogue();
                }
            }
        }
        
        // Close dialogue if no next dialogue
        if (!response.nextDialogueId && !response.action) {
            console.log('DialogueUI: No next dialogue or action, closing dialogue');
            this.hideDialogue();
        }
    }

    private handleContinue(): void {
        if (this.isTyping) {
            // Skip typing animation
            this.isTyping = false;
            this.currentTextIndex = this.fullText.length;
            if (this.dialogueText) {
                this.dialogueText.setText(this.fullText);
            }
            this.isWaitingForInput = true;
            this.showContinueButton();
        } else if (this.isWaitingForInput) {
            // Move to next paragraph
            this.currentParagraphIndex++;
            this.showNextParagraph();
        } else {
            // Close dialogue
            this.hideDialogue();
        }
    }

    public hideDialogue(): void {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.currentDialogue = null;
        this.isTyping = false;
        this.isWaitingForInput = false;
        
        // Reset paragraph system
        this.paragraphs = [];
        this.currentParagraphIndex = 0;
        
        // Clear response buttons
        this.responseButtons.forEach(button => button.destroy());
        this.responseButtons = [];
        
        // Clear reward display
        if (this.rewardDisplay) {
            this.rewardDisplay.destroy();
            this.rewardDisplay = null;
        }
        
        // Destroy UI elements
        if (this.dialogueContainer) {
            this.dialogueContainer.destroy();
            this.dialogueContainer = null;
        }
        
        this.scrollBackground = null;
        this.dialogueText = null;
        this.continueButton = null;
        this.continueText = null;
        
        // Emit event to notify NPC that dialogue has ended
        this.scene.events.emit('dialogueEnded');
        
        console.log('DialogueUI: Dialogue hidden');
    }

    public isDialogueActive(): boolean {
        return this.isActive;
    }

    public destroy(): void {
        this.hideDialogue();
        this.scene.events.off('showDialogue');
        this.scene.events.off('hideDialogue');
    }
}
