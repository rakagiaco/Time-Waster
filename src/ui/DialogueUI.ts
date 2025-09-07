/**
 * Modern Dialogue UI System
 * 
 * A sleek, non-intrusive dialogue system inspired by World of Warcraft's UI.
 * Features compact design, modern styling, and smooth animations.
 */

import Phaser from 'phaser';

export interface DialogueData {
    id: string;
    text: string;
    responses?: DialogueResponse[];
    speaker?: string;
}

export interface DialogueResponse {
    text: string;
    nextDialogueId?: string;
    action?: string;
    condition?: () => boolean;
}

export class DialogueUI {
    private scene: Phaser.Scene;
    private dialogueContainer: Phaser.GameObjects.Container | null = null;
    private npcReference: any = null;
    private currentDialogue: DialogueData | null = null;
    private isActive: boolean = false;
    private isAnimating: boolean = false;
    private dialogueSegments: string[] = []; // Support for multi-part dialogues
    private currentSegmentIndex: number = 0;
    private currentTypewriter: Phaser.Time.TimerEvent | null = null; // Track current animation
    private isProcessingClick: boolean = false; // Prevent rapid clicking
    private currentAnimationId: number = 0; // Track current animation ID
    private dialogueText: Phaser.GameObjects.BitmapText | null = null; // Dialogue text display
    private continueButton: Phaser.GameObjects.Container | null = null; // Continue button
    private responseButtons: Phaser.GameObjects.Container[] = []; // Response buttons

    // Modern UI dimensions - compact and non-intrusive
    private readonly DIALOGUE_WIDTH = 350; // Reduced width to prevent overflow
    private readonly DIALOGUE_HEIGHT = 140; // Increased height to prevent bottom overflow
    private readonly RESPONSE_WIDTH = 350;
    private readonly RESPONSE_HEIGHT = 40;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.scene.events.on('showDialogue', (dialogue: DialogueData, npc?: any) => {
            this.showDialogue(dialogue, npc);
        });
        
        this.scene.events.on('hideDialogue', () => {
            this.hideDialogue();
        });
        
        this.scene.events.on('closeDialogue', () => {
            this.hideDialogue();
        });
        
        // Keyboard support
        this.scene.input.keyboard?.on('keydown-SPACE', () => {
            if (this.isActive && !this.isAnimating) {
                this.handleContinue();
            }
        });
    }

    public showDialogue(dialogue: DialogueData, npc?: any): void {
        if (this.isActive) {
            console.log('DialogueUI: Dialogue already active, ignoring duplicate show request');
            return;
        }
        
        this.isActive = true;
        this.currentDialogue = dialogue;
        this.npcReference = npc;
        
        // Split long dialogue text into segments
        this.dialogueSegments = this.splitDialogueIntoSegments(dialogue.text);
        this.currentSegmentIndex = 0;
        
        this.createModernDialogueUI();
        this.startTextAnimation(this.dialogueSegments[0]);
    }

    private createModernDialogueUI(): void {
        // Clean up any existing dialogue container first
        if (this.dialogueContainer) {
            console.log('DialogueUI: Cleaning up existing container before creating new one');
            this.dialogueContainer.destroy();
            this.dialogueContainer = null;
        }
        
        // Reset all text elements
        this.dialogueText = null;
        this.continueButton = null;
        this.responseButtons = [];
        
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // Position in bottom-middle, non-intrusive
        const x = screenWidth / 2;
        const y = screenHeight - 20;
        
        this.dialogueContainer = this.scene.add.container(x, y);
        this.dialogueContainer.setDepth(50000); // Much higher depth to ensure it's above everything
        this.dialogueContainer.setScrollFactor(0);
        
        console.log(`DialogueUI: Created container at (${x}, ${y}) with depth 50000`);
        
        // Create modern dialogue panel
        this.createDialoguePanel();
        
        // Create dialogue text
        this.createDialogueText();
        
        // Don't create buttons yet - wait for text animation to complete
    }

    private createDialoguePanel(): void {
        if (!this.dialogueContainer) return;
        
        // Modern panel background with subtle transparency
        const panel = this.scene.add.graphics();
        this.dialogueContainer.add(panel);
        
        // Main panel with modern styling - centered horizontally
        const panelX = -this.DIALOGUE_WIDTH / 2;
        panel.fillStyle(0x1a1a1a, 0.95); // Dark background with transparency
        panel.fillRoundedRect(panelX, -this.DIALOGUE_HEIGHT, this.DIALOGUE_WIDTH, this.DIALOGUE_HEIGHT, 8);
        
        // Subtle border
        panel.lineStyle(2, 0x4a4a4a, 0.8);
        panel.strokeRoundedRect(panelX, -this.DIALOGUE_HEIGHT, this.DIALOGUE_WIDTH, this.DIALOGUE_HEIGHT, 8);
        
        // Inner highlight
        panel.lineStyle(1, 0x666666, 0.6);
        panel.strokeRoundedRect(panelX + 2, -this.DIALOGUE_HEIGHT + 2, this.DIALOGUE_WIDTH - 4, this.DIALOGUE_HEIGHT - 4, 6);
        
        // Make the dialogue panel clickable to skip animation or continue
        const clickArea = this.scene.add.rectangle(
            panelX + this.DIALOGUE_WIDTH / 2, -this.DIALOGUE_HEIGHT / 2,
            this.DIALOGUE_WIDTH, this.DIALOGUE_HEIGHT
        );
        clickArea.setInteractive();
        clickArea.setAlpha(0); // Invisible but clickable
        clickArea.on('pointerdown', () => this.handleDialogueClick());
        this.dialogueContainer.add(clickArea);
        
        // Speaker name if available - centered
        if (this.currentDialogue?.speaker) {
            const speakerText = this.scene.add.bitmapText(
                panelX + 15, -this.DIALOGUE_HEIGHT + 15,
                'pixel-white', this.currentDialogue.speaker, 14
            );
            speakerText.setTint(0xFFD700); // Gold color for speaker name
            this.dialogueContainer.add(speakerText);
        }
        
        // Dialogue text area
        this.createDialogueText();
    }

    private createDialogueText(): void {
        if (!this.dialogueContainer || !this.currentDialogue) return;
        
        const textY = this.currentDialogue.speaker ? -this.DIALOGUE_HEIGHT + 35 : -this.DIALOGUE_HEIGHT + 20;
        const panelX = -this.DIALOGUE_WIDTH / 2;
        
        this.dialogueText = this.scene.add.bitmapText(
            panelX + 20, textY,
            'pixel-white', '', 12
        );
        this.dialogueText.setTint(0xFFFFFF);
        this.dialogueText.setMaxWidth(this.DIALOGUE_WIDTH - 40); // Increased padding for better text spacing
        
        this.dialogueContainer.add(this.dialogueText);
    }

    private clearDialogueText(): void {
        if (this.dialogueText) {
            this.dialogueText.setText('');
            this.dialogueText.setVisible(false);
            this.dialogueText.setVisible(true);
        }
    }

    private createContinueButton(): void {
        if (!this.dialogueContainer) return;
        
        const buttonY = -15;
        const panelX = -this.DIALOGUE_WIDTH / 2;
        
        const continueBtn = this.createModernButton(
            panelX + this.DIALOGUE_WIDTH - 90, buttonY, // Moved slightly left to accommodate wider button
            80, 25, 'Continue', () => this.handleContinue() // Increased width from 60 to 80
        );
        
        this.dialogueContainer.add(continueBtn);
    }

    private createResponseButtons(): void {
        if (!this.dialogueContainer || !this.currentDialogue?.responses) return;
        
        const responses = this.currentDialogue.responses;
        const startY = -this.DIALOGUE_HEIGHT - 20; // Position buttons below the dialogue panel
        const buttonSpacing = 50; // Increased spacing between buttons for better readability
        
        responses.forEach((response: DialogueResponse, index: number) => {
            const buttonY = startY - (index * buttonSpacing);
            
            
            const responseBtn = this.createModernButton(
                0, buttonY,
                this.RESPONSE_WIDTH, this.RESPONSE_HEIGHT,
                response.text, () => this.handleResponse(response)
            );
            
            this.dialogueContainer!.add(responseBtn);
        });
    }

    private createModernButton(x: number, y: number, width: number, height: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const button = this.scene.add.container(x, y);
        
        // Modern button background
        const buttonBg = this.scene.add.graphics();
        button.add(buttonBg);
        
        // Button styling
        buttonBg.fillStyle(0x2a2a2a, 0.9);
        buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 6);
        
        buttonBg.lineStyle(2, 0x4a4a4a, 0.8);
        buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
        
        // Button text - calculate size based on button dimensions and text length
        const textSize = Math.min(12, Math.floor(height * 0.6)); // Scale text to fit button height
        const buttonText = this.scene.add.bitmapText(0, 0, 'pixel-white', text, textSize);
        buttonText.setOrigin(0.5);
        buttonText.setTint(0xFFFFFF);
        
        // Calculate appropriate max width based on button size and text length
        const maxTextWidth = Math.max(width - 20, Math.min(width - 10, text.length * 8)); // Dynamic width based on text length
        buttonText.setMaxWidth(maxTextWidth);
        buttonText.setCenterAlign();
        button.add(buttonText);
        
        // Make the button background interactive instead of the container
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
        
        // Modern hover effects
        buttonBg.on('pointerover', () => {
            button.setScale(1.02);
            buttonText.setTint(0xFFD700); // Gold on hover
            buttonBg.clear();
            buttonBg.fillStyle(0x3a3a3a, 0.95);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 6);
            buttonBg.lineStyle(2, 0x666666, 0.9);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
        });
        
        buttonBg.on('pointerout', () => {
            button.setScale(1.0);
            buttonText.setTint(0xFFFFFF);
            buttonBg.clear();
            buttonBg.fillStyle(0x2a2a2a, 0.9);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 6);
            buttonBg.lineStyle(2, 0x4a4a4a, 0.8);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
        });
        
        buttonBg.on('pointerdown', callback);
        
        return button;
    }

    private startTextAnimation(text: string): void {
        if (!this.dialogueText) return;
        
        // Clean up any existing animation
        this.stopCurrentAnimation();
        
        this.isAnimating = true;
        
        // Clear the text completely and force a render update
        this.clearDialogueText();
        
        // Increment animation ID to invalidate any previous animations
        this.currentAnimationId++;
        const animationId = this.currentAnimationId;
        
        // Break text into lines that fit within the dialogue width
        const maxWidth = this.DIALOGUE_WIDTH - 40; // Match the increased padding
        const lines = this.wrapText(text, maxWidth);
        const fullText = lines.join('\n');
        
        let currentText = '';
        let index = 0;
        
        this.currentTypewriter = this.scene.time.addEvent({
            delay: 30, // Faster typing speed
            callback: () => {
                // Check if this animation is still the current one
                if (this.currentAnimationId === animationId && this.isAnimating) {
                    if (index < fullText.length) {
                        currentText += fullText[index];
                        this.dialogueText!.setText(currentText);
                        index++;
                    } else {
                        this.isAnimating = false;
                        this.currentTypewriter = null;
                        // Show continue button if there are more segments, or response buttons if this is the last segment
                        this.showSegmentButtons();
                    }
                }
            },
            loop: true
        });
    }

    private wrapText(text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        // Very conservative character width estimation for pixel font
        const charWidth = 10; // Increased to provide better spacing and prevent overflow
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            
            // Calculate estimated width
            const estimatedWidth = testLine.length * charWidth;
            
            if (estimatedWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    private splitDialogueIntoSegments(text: string): string[] {
        // Split dialogue at sentence boundaries to create manageable segments
        const sentences = text.split(/(?<=[.!?])\s+/);
        const segments: string[] = [];
        let currentSegment = '';
        
        for (const sentence of sentences) {
            const testSegment = currentSegment + (currentSegment ? ' ' : '') + sentence;
            const maxWidth = this.DIALOGUE_WIDTH - 40; // Match the increased padding
            const lines = this.wrapText(testSegment, maxWidth);
            
            // If adding this sentence would create more than 4 lines, start a new segment
            if (lines.length > 4) {
                if (currentSegment) {
                    segments.push(currentSegment.trim());
                    currentSegment = sentence;
                } else {
                    // Single sentence is too long, split it
                    segments.push(sentence);
                }
            } else {
                currentSegment = testSegment;
            }
        }
        
        if (currentSegment) {
            segments.push(currentSegment.trim());
        }
        
        return segments.length > 0 ? segments : [text];
    }

    private handleDialogueClick(): void {
        // Prevent rapid clicking
        if (this.isProcessingClick) return;
        
        this.isProcessingClick = true;
        
        if (this.isAnimating) {
            // Skip animation if still typing
            this.skipAnimation();
        } else {
            // Move to next segment or close dialogue
            this.nextSegment();
        }
        
        // Reset click processing after a very short delay to prevent rapid clicking
        this.scene.time.delayedCall(50, () => {
            this.isProcessingClick = false;
        });
    }

    private stopCurrentAnimation(): void {
        // Invalidate current animation by incrementing ID
        this.currentAnimationId++;
        
        if (this.currentTypewriter) {
            this.currentTypewriter.destroy();
            this.currentTypewriter = null;
        }
        this.isAnimating = false;
    }

    private skipAnimation(): void {
        // Stop current animation
        this.stopCurrentAnimation();
        
        if (this.dialogueText && this.dialogueSegments.length > 0) {
            // Clear text completely first
            this.clearDialogueText();
            
            const maxWidth = this.DIALOGUE_WIDTH - 40; // Match the increased padding
            const lines = this.wrapText(this.dialogueSegments[this.currentSegmentIndex], maxWidth);
            this.dialogueText.setText(lines.join('\n'));
        }
        // Show continue button if there are more segments, or response buttons if this is the last segment
        this.showSegmentButtons();
    }

    private nextSegment(): void {
        this.currentSegmentIndex++;
        
        if (this.currentSegmentIndex < this.dialogueSegments.length) {
            // Show next segment
            this.startTextAnimation(this.dialogueSegments[this.currentSegmentIndex]);
        } else {
            // All segments shown, show response buttons or close
            if (this.currentDialogue?.responses && this.currentDialogue.responses.length > 0) {
                this.createResponseButtons();
            } else {
            this.hideDialogue();
            }
        }
    }

    private showSegmentButtons(): void {
        if (!this.dialogueContainer) return;
        
        // Check if this is the last segment
        const isLastSegment = this.currentSegmentIndex >= this.dialogueSegments.length - 1;
        
        if (isLastSegment) {
            // Last segment - show response buttons if available, otherwise show continue button
            if (this.currentDialogue?.responses && this.currentDialogue.responses.length > 0) {
                this.createResponseButtons();
            } else {
                this.createContinueButton();
            }
        } else {
            // Not the last segment - show continue button to go to next segment
            this.createContinueButton();
        }
    }


    private handleContinue(): void {
        // Prevent rapid clicking
        if (this.isProcessingClick) return;
        
        this.isProcessingClick = true;
        
        if (this.isAnimating) {
            // Skip animation if still typing
            this.skipAnimation();
        } else {
            // Move to next segment or close dialogue
            this.nextSegment();
        }
        
        // Reset click processing after a very short delay to prevent rapid clicking
        this.scene.time.delayedCall(50, () => {
            this.isProcessingClick = false;
        });
    }

    private handleResponse(response: DialogueResponse): void {
        if (this.isAnimating || this.isProcessingClick) return;
        
        // Handle actions
        if (response.action) {
            this.scene.events.emit('dialogueAction', response.action);
            
            if (response.action === 'show_snarky_remark' && this.npcReference) {
                this.npcReference.startQuestDeclinedDialogue();
            }
        }
        
        // Handle next dialogue
        if (response.nextDialogueId) {
            this.scene.events.emit('dialogueNext', response.nextDialogueId);
            
            if (this.npcReference) {
                this.npcReference.handleDialogueNext(response.nextDialogueId);
                
                if (response.nextDialogueId === 'quest_accepted') {
                    this.npcReference.startQuestAcceptedDialogue();
                }
            }
        }
        
        // Close if no next dialogue
        if (!response.nextDialogueId && !response.action) {
            this.hideDialogue();
        }
    }

    public hideDialogue(): void {
        if (!this.isActive) return;
        
        console.log('DialogueUI: Hiding dialogue and cleaning up');
        this.isActive = false;
        this.stopCurrentAnimation();
        this.isProcessingClick = false; // Reset click processing
        this.currentDialogue = null;
        this.npcReference = null;
        this.dialogueSegments = [];
        this.currentSegmentIndex = 0;
        
        // Force invalidate any remaining animations
        this.currentAnimationId += 1000;
        
        if (this.dialogueContainer) {
            this.dialogueContainer.destroy();
            this.dialogueContainer = null;
        }
        
        // Reset all text elements
        this.dialogueText = null;
        this.continueButton = null;
        this.responseButtons = [];
        
        this.scene.events.emit('dialogueEnded');
    }

    public getDialogueContainer(): Phaser.GameObjects.Container | null {
        return this.dialogueContainer;
    }
        
    public update(_delta: number): void {
        // Update method called by World scene
        // Currently no continuous updates needed, but keeping for compatibility
    }

    public isDialogueActive(): boolean {
        return this.isActive;
    }

    public destroy(): void {
        this.hideDialogue();
        
        // Remove all event listeners
        this.scene.events.off('showDialogue');
        this.scene.events.off('hideDialogue');
        this.scene.events.off('closeDialogue');
        
        // Remove keyboard listeners
        this.scene.input.keyboard?.off('keydown-SPACE');
        
        // Force invalidate any remaining animations
        this.currentAnimationId += 1000;
    }
}