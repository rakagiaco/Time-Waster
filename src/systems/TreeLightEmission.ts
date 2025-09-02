import Phaser from 'phaser';
import { Tree } from '../prefabs/Tree';

export interface TreeLightConfig {
    maxRadius: number;
    baseIntensity: number;
    color: number;
    falloffRate: number;
    pulseIntensity: number;
    pulseSpeed: number;
}

export class TreeLightEmission {
    private scene: Phaser.Scene;
    private config: TreeLightConfig;
    private lightGraphics: Map<Tree, Phaser.GameObjects.Graphics> = new Map();
    private isActive: boolean = false;
    private pulseTimer: number = 0;

    constructor(scene: Phaser.Scene, config?: Partial<TreeLightConfig>) {
        this.scene = scene;
        this.config = {
            maxRadius: 150,
            baseIntensity: 0.3,
            color: 0x90EE90, // Light green
            falloffRate: 0.8,
            pulseIntensity: 0.1,
            pulseSpeed: 0.015,
            ...config
        };
    }

    public addTreeLight(tree: Tree): void {
        if (this.lightGraphics.has(tree)) return;

        // Determine if this tree should emit light based on its type
        if (!this.shouldTreeEmitLight(tree)) return;

        const lightGraphic = this.scene.add.graphics();
        lightGraphic.setDepth(tree.depth - 1);
        this.lightGraphics.set(tree, lightGraphic);
    }

    public removeTreeLight(tree: Tree): void {
        const lightGraphic = this.lightGraphics.get(tree);
        if (lightGraphic) {
            lightGraphic.destroy();
            this.lightGraphics.delete(tree);
        }
    }

    private shouldTreeEmitLight(tree: Tree): boolean {
        // Only certain tree types emit light
        const lightEmittingTypes = ['tree-2-second', 'tree-3']; // Ancient trees and cherry blossoms
        return lightEmittingTypes.includes(tree.treeType);
    }

    public update(delta: number): void {
        if (!this.isActive) return;

        this.pulseTimer += delta * this.config.pulseSpeed;

        // Update each tree's light emission
        this.lightGraphics.forEach((lightGraphic, tree) => {
            this.updateTreeLight(tree, lightGraphic);
        });
    }

    private updateTreeLight(tree: Tree, lightGraphic: Phaser.GameObjects.Graphics): void {
        // Calculate pulse effect
        const pulse = Math.sin(this.pulseTimer) * this.config.pulseIntensity;
        const currentIntensity = this.config.baseIntensity + pulse;

        // Clear previous graphics
        lightGraphic.clear();

        // Create gradient light effect
        this.createGradientLight(lightGraphic, tree.x, tree.y, currentIntensity);
    }

    private createGradientLight(lightGraphic: Phaser.GameObjects.Graphics, centerX: number, centerY: number, intensity: number): void {
        const maxRadius = this.config.maxRadius;
        const color = this.config.color;
        const falloffRate = this.config.falloffRate;

        // Create multiple concentric circles with decreasing intensity
        const numRings = 8;
        const ringSpacing = maxRadius / numRings;

        for (let i = 0; i < numRings; i++) {
            const radius = (i + 1) * ringSpacing;
            const ringIntensity = intensity * Math.pow(falloffRate, i);
            
            if (ringIntensity > 0.01) { // Only draw if intensity is significant
                lightGraphic.fillStyle(color, ringIntensity);
                lightGraphic.fillCircle(centerX, centerY, radius);
            }
        }

        // Add a bright center core
        lightGraphic.fillStyle(color, intensity * 1.5);
        lightGraphic.fillCircle(centerX, centerY, ringSpacing * 0.5);
    }

    public activate(): void {
        this.isActive = true;
        this.lightGraphics.forEach(lightGraphic => {
            lightGraphic.setVisible(true);
        });
    }

    public deactivate(): void {
        this.isActive = false;
        this.lightGraphics.forEach(lightGraphic => {
            lightGraphic.setVisible(false);
        });
    }

    public toggle(): void {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    public isLightActive(): boolean {
        return this.isActive;
    }

    public getLightIntensityAtPoint(x: number, y: number): number {
        let maxIntensity = 0;

        this.lightGraphics.forEach((lightGraphic, tree) => {
            const distance = Phaser.Math.Distance.Between(x, y, tree.x, tree.y);
            if (distance <= this.config.maxRadius) {
                // Calculate intensity based on distance
                const normalizedDistance = distance / this.config.maxRadius;
                const intensity = this.config.baseIntensity * Math.pow(this.config.falloffRate, normalizedDistance * 8);
                maxIntensity = Math.max(maxIntensity, intensity);
            }
        });

        return maxIntensity;
    }

    public isPointInTreeLight(x: number, y: number): boolean {
        let inLight = false;
        this.lightGraphics.forEach((lightGraphic, tree) => {
            const distance = Phaser.Math.Distance.Between(x, y, tree.x, tree.y);
            if (distance <= this.config.maxRadius) {
                inLight = true;
            }
        });
        return inLight;
    }

    public destroy(): void {
        this.lightGraphics.forEach(lightGraphic => {
            lightGraphic.destroy();
        });
        this.lightGraphics.clear();
    }
}
