import Phaser from 'phaser';
import { Item } from './Item';

/**
 * Weapon Interface
 * Defines the properties and methods for weapon items
 */
export interface WeaponStats {
    damage: number;
    attackSpeed: number; // Attacks per second
    durability: number;
    maxDurability: number;
    weaponType: 'sword' | 'axe' | 'mace' | 'spear' | 'bow';
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    enchantments?: string[];
}

/**
 * Medieval Sword Weapon Class
 * 
 * Extends the base Item class to create a weapon with combat stats,
 * durability, and medieval styling. Includes both the world item
 * and inventory representation.
 */
export class MedievalSword extends Item {
    private weaponStats: WeaponStats;
    private isEquipped: boolean = false;
    private iconTexture: string;

    /**
     * Static method to pre-generate sword textures for the scene
     * Call this before creating any swords to ensure textures are ready
     */
    public static generateSwordTextures(scene: Phaser.Scene): void {
        if (scene.textures.exists('medieval-sword') && scene.textures.exists('medieval-sword-icon')) {
            return; // Textures already exist
        }

        const graphics = scene.add.graphics();
        // Position graphics completely off-screen and make invisible
        graphics.setPosition(-2000, -2000);
        graphics.setVisible(false);
        graphics.setDepth(-2000);
        graphics.setAlpha(0);
        
        // Create high-resolution full-size sword (64x128)
        this.drawDetailedSword(graphics, 64, 128);
        graphics.generateTexture('medieval-sword', 64, 128);
        
        // Clear and create detailed icon version (32x32)
        graphics.clear();
        this.drawDetailedSwordIcon(graphics, 32, 32);
        graphics.generateTexture('medieval-sword-icon', 32, 32);
        
        // Create different sword variants for different rarities
        graphics.clear();
        this.drawCommonSword(graphics, 64, 128);
        graphics.generateTexture('medieval-sword-common', 64, 128);
        
        graphics.clear();
        this.drawUncommonSword(graphics, 64, 128);
        graphics.generateTexture('medieval-sword-uncommon', 64, 128);
        
        graphics.clear();
        this.drawRareSword(graphics, 64, 128);
        graphics.generateTexture('medieval-sword-rare', 64, 128);
        
        graphics.clear();
        this.drawEpicSword(graphics, 64, 128);
        graphics.generateTexture('medieval-sword-epic', 64, 128);
        
        graphics.clear();
        this.drawLegendarySword(graphics, 64, 128);
        graphics.generateTexture('medieval-sword-legendary', 64, 128);
        
        graphics.destroy();
    }

    /**
     * Draws a detailed high-resolution sword
     */
    private static drawDetailedSword(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 10;
        const bladeLength = height * 0.65; // 65% of total height
        const guardWidth = 28;
        const guardHeight = 14;
        const handleLength = height * 0.25; // 25% of total height
        const pommelSize = 14;
        
        // === BLADE ===
        // Main blade body with realistic steel color
        graphics.fillStyle(0xC0C0C0); // Steel gray
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - subtle highlight
        graphics.fillStyle(0xD0D0D0); // Light steel
        graphics.fillRect(centerX - bladeWidth/2, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 1, 0, 1, bladeLength);
        
        graphics.fillStyle(0xE0E0E0); // Secondary edge
        graphics.fillRect(centerX - bladeWidth/2 + 1, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 2, 0, 1, bladeLength);
        
        // Fuller (blood groove) - detailed with multiple depths
        graphics.fillStyle(0x999999); // Darker silver
        graphics.fillRect(centerX - 3, 10, 6, bladeLength - 20);
        
        // Fuller edges for depth
        graphics.fillStyle(0xAAAAAA); // Medium silver
        graphics.fillRect(centerX - 4, 10, 1, bladeLength - 20);
        graphics.fillRect(centerX + 3, 10, 1, bladeLength - 20);
        
        // Fuller center line
        graphics.fillStyle(0x888888); // Darker center
        graphics.fillRect(centerX - 1, 10, 2, bladeLength - 20);
        
        // Blade tip - highly detailed with multiple bevels
        graphics.fillStyle(0xE8E8E8);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 12,
            centerX + bladeWidth/2, bladeLength - 12,
            centerX, bladeLength
        );
        
        // Blade tip beveled edges
        graphics.fillStyle(0xF5F5F5);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 12,
            centerX - bladeWidth/2 + 2, bladeLength - 8,
            centerX, bladeLength
        );
        graphics.fillTriangle(
            centerX + bladeWidth/2, bladeLength - 12,
            centerX + bladeWidth/2 - 2, bladeLength - 8,
            centerX, bladeLength
        );
        
        // Blade tip center line
        graphics.fillStyle(0xCCCCCC);
        graphics.fillTriangle(
            centerX - 1, bladeLength - 12,
            centerX + 1, bladeLength - 12,
            centerX, bladeLength
        );
        
        // === CROSSGUARD ===
        // Main crossguard body - bronze with ornate design
        graphics.fillStyle(0xCD7F32); // Bronze
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - multiple layers
        graphics.fillStyle(0x8B4513); // Darker bronze
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 3);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 3, guardWidth, 3);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 3, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 3, bladeLength, 3, guardHeight);
        
        // Center opening for blade - detailed
        graphics.fillStyle(0x000000); // Black background
        graphics.fillRect(centerX - 5, bladeLength, 10, guardHeight);
        
        // Center opening edges
        graphics.fillStyle(0x654321); // Dark brown
        graphics.fillRect(centerX - 4, bladeLength + 2, 8, guardHeight - 4);
        
        // Decorative notches on crossguard ends - more ornate
        graphics.fillStyle(0x654321); // Dark brown
        graphics.fillRect(centerX - guardWidth/2 + 6, bladeLength + 3, 6, guardHeight - 6);
        graphics.fillRect(centerX + guardWidth/2 - 12, bladeLength + 3, 6, guardHeight - 6);
        
        // Crossguard decorative studs - multiple rows
        graphics.fillStyle(0xFFD700); // Gold
        graphics.fillCircle(centerX - guardWidth/2 + 8, bladeLength + 4, 2);
        graphics.fillCircle(centerX - guardWidth/2 + 8, bladeLength + guardHeight - 4, 2);
        graphics.fillCircle(centerX + guardWidth/2 - 8, bladeLength + 4, 2);
        graphics.fillCircle(centerX + guardWidth/2 - 8, bladeLength + guardHeight - 4, 2);
        
        // Crossguard decorative lines
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(centerX - guardWidth/2 + 2, bladeLength + 6, 4, 2);
        graphics.fillRect(centerX + guardWidth/2 - 6, bladeLength + 6, 4, 2);
        
        // === HANDLE ===
        // Main handle - dark brown with texture
        graphics.fillStyle(0x8B4513); // Saddle brown
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Handle base layer
        graphics.fillStyle(0x654321); // Darker brown
        graphics.fillRect(centerX - bladeWidth/2 + 1, bladeLength + guardHeight + 1, bladeWidth - 2, handleLength - 2);
        
        // Leather wrap pattern - detailed diagonal strips
        graphics.fillStyle(0x5D4037); // Medium brown
        for (let i = 0; i < handleLength; i += 4) {
            graphics.fillRect(centerX - bladeWidth/2 + 1, bladeLength + guardHeight + i, bladeWidth - 2, 2);
        }
        
        // Wire wrapping on handle
        graphics.fillStyle(0xC0C0C0); // Silver wire
        for (let i = 2; i < handleLength - 2; i += 6) {
            graphics.fillRect(centerX - bladeWidth/2 + 2, bladeLength + guardHeight + i, bladeWidth - 4, 1);
        }
        
        // Handle edges - detailed
        graphics.fillStyle(0x4B2F0F); // Very dark brown
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, 2);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + handleLength - 2, bladeWidth, 2);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, 2, handleLength);
        graphics.fillRect(centerX + bladeWidth/2 - 2, bladeLength + guardHeight, 2, handleLength);
        
        // Handle grip texture - crosshatch pattern
        graphics.fillStyle(0x5D4037);
        for (let i = 4; i < handleLength - 4; i += 2) {
            graphics.fillRect(centerX - 1, bladeLength + guardHeight + i, 2, 1);
        }
        
        // === POMMEL ===
        // Main pommel body - bronze with ornate design
        graphics.fillStyle(0xCD7F32); // Bronze
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - detailed with multiple rings
        graphics.fillStyle(0x8B4513); // Darker bronze
        graphics.lineStyle(4, 0x8B4513);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel decorative rings
        graphics.lineStyle(2, 0x654321);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2 - 2);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2 - 4);
        
        // Decorative center gem
        graphics.fillStyle(0xFFD700); // Gold
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 4);
        
        // Gem center
        graphics.fillStyle(0xFFA500); // Orange
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 2);
        
        // === ENGRAVING DETAILS ===
        // Detailed engravings on blade
        graphics.fillStyle(0xAAAAAA); // Medium gray
        graphics.fillRect(centerX - 2, 15, 4, 2);
        graphics.fillRect(centerX - 2, 25, 4, 2);
        graphics.fillRect(centerX - 2, 35, 4, 2);
        graphics.fillRect(centerX - 2, 45, 4, 2);
        graphics.fillRect(centerX - 2, 55, 4, 2);
        
        // Engraving details
        graphics.fillStyle(0x999999);
        graphics.fillRect(centerX - 1, 16, 2, 1);
        graphics.fillRect(centerX - 1, 26, 2, 1);
        graphics.fillRect(centerX - 1, 36, 2, 1);
        graphics.fillRect(centerX - 1, 46, 2, 1);
        graphics.fillRect(centerX - 1, 56, 2, 1);
        
        // Crossguard decorative elements
        graphics.fillStyle(0x654321);
        graphics.fillRect(centerX - 8, bladeLength + 5, 3, 4);
        graphics.fillRect(centerX + 5, bladeLength + 5, 3, 4);
        
        // Crossguard decorative dots
        graphics.fillStyle(0x8B4513);
        graphics.fillCircle(centerX - 6, bladeLength + 7, 1);
        graphics.fillCircle(centerX + 6, bladeLength + 7, 1);
    }

    /**
     * Draws a detailed sword icon
     */
    private static drawDetailedSwordIcon(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 6;
        const bladeLength = height * 0.7; // Increased from 0.6 to 0.7 for better proportions
        const guardWidth = 16;
        const guardHeight = 8;
        const handleLength = height * 0.2; // Reduced from 0.3 to 0.2 to give more space to blade
        const pommelSize = 6;
        
        // Blade with detailed gradient
        graphics.fillStyle(0xE8E8E8);
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - multiple layers
        graphics.fillStyle(0xF8F8F8);
        graphics.fillRect(centerX - bladeWidth/2, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 1, 0, 1, bladeLength);
        
        graphics.fillStyle(0xF0F0F0);
        graphics.fillRect(centerX - bladeWidth/2 + 1, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 2, 0, 1, bladeLength);
        
        // Fuller with depth
        graphics.fillStyle(0x999999);
        graphics.fillRect(centerX - 2, 3, 4, bladeLength - 6);
        
        // Fuller edges
        graphics.fillStyle(0xAAAAAA);
        graphics.fillRect(centerX - 2, 3, 1, bladeLength - 6);
        graphics.fillRect(centerX + 1, 3, 1, bladeLength - 6);
        
        // Blade tip - detailed
        graphics.fillStyle(0xE8E8E8);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 5,
            centerX + bladeWidth/2, bladeLength - 5,
            centerX, bladeLength
        );
        
        // Blade tip edges
        graphics.fillStyle(0xF5F5F5);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 5,
            centerX - bladeWidth/2 + 1, bladeLength - 3,
            centerX, bladeLength
        );
        graphics.fillTriangle(
            centerX + bladeWidth/2, bladeLength - 5,
            centerX + bladeWidth/2 - 1, bladeLength - 3,
            centerX, bladeLength
        );
        
        // Crossguard - ornate
        graphics.fillStyle(0xCD7F32);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - detailed
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 2, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 2, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 2, bladeLength, 2, guardHeight);
        
        // Center opening
        graphics.fillStyle(0x000000);
        graphics.fillRect(centerX - 3, bladeLength, 6, guardHeight);
        
        // Center opening edges
        graphics.fillStyle(0x654321);
        graphics.fillRect(centerX - 2, bladeLength + 1, 4, guardHeight - 2);
        
        // Decorative studs
        graphics.fillStyle(0xFFD700);
        graphics.fillCircle(centerX - guardWidth/2 + 3, bladeLength + 2, 1);
        graphics.fillCircle(centerX + guardWidth/2 - 3, bladeLength + 2, 1);
        graphics.fillCircle(centerX - guardWidth/2 + 3, bladeLength + guardHeight - 2, 1);
        graphics.fillCircle(centerX + guardWidth/2 - 3, bladeLength + guardHeight - 2, 1);
        
        // Handle - detailed
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Handle base
        graphics.fillStyle(0x654321);
        graphics.fillRect(centerX - bladeWidth/2 + 1, bladeLength + guardHeight + 1, bladeWidth - 2, handleLength - 2);
        
        // Leather wrap pattern
        graphics.fillStyle(0x5D4037);
        for (let i = 0; i < handleLength; i += 3) {
            graphics.fillRect(centerX - bladeWidth/2 + 1, bladeLength + guardHeight + i, bladeWidth - 2, 1);
        }
        
        // Wire wrapping
        graphics.fillStyle(0xC0C0C0);
        for (let i = 2; i < handleLength - 2; i += 4) {
            graphics.fillRect(centerX - bladeWidth/2 + 2, bladeLength + guardHeight + i, bladeWidth - 4, 1);
        }
        
        // Handle edges
        graphics.fillStyle(0x4B2F0F);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, 1);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + handleLength - 1, bladeWidth, 1);
        
        // Pommel - ornate
        graphics.fillStyle(0xCD7F32);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - detailed
        graphics.fillStyle(0x8B4513);
        graphics.lineStyle(3, 0x8B4513);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel decorative ring
        graphics.lineStyle(1, 0x654321);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2 - 1);
        
        // Center gem
        graphics.fillStyle(0xFFD700);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 2);
        
        // Gem center
        graphics.fillStyle(0xFFA500);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 1);
    }

    /**
     * Draws a rare sword with silver accents and more ornate details
     */
    private static drawRareSword(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 8;
        const bladeLength = height * 0.65;
        const guardWidth = 28;
        const guardHeight = 14;
        const handleLength = height * 0.25;
        const pommelSize = 14;
        
        // === BLADE ===
        // Main blade body with realistic steel color
        graphics.fillStyle(0xC0C0C0); // Steel gray
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - subtle highlight
        graphics.fillStyle(0xD0D0D0); // Light steel
        graphics.fillRect(centerX - bladeWidth/2, 0, 2, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 2, 0, 2, bladeLength);
        
        // Fuller with darker inlay
        graphics.fillStyle(0xA0A0A0); // Darker gray
        graphics.fillRect(centerX - 2, 8, 4, bladeLength - 16);
        
        // Silver engravings
        graphics.fillStyle(0xE0E0E0);
        graphics.fillRect(centerX - 1, 12, 2, 2);
        graphics.fillRect(centerX - 1, 20, 2, 2);
        graphics.fillRect(centerX - 1, 28, 2, 2);
        graphics.fillRect(centerX - 1, 36, 2, 2);
        graphics.fillRect(centerX - 1, 44, 2, 2);
        
        // Blade tip
        graphics.fillStyle(0xF0F0F0);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 8,
            centerX + bladeWidth/2, bladeLength - 8,
            centerX, bladeLength
        );
        
        // === CROSSGUARD ===
        // Main crossguard body - silver
        graphics.fillStyle(0xC0C0C0); // Silver
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - darker silver
        graphics.fillStyle(0x808080); // Dark silver
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 2, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 2, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 2, bladeLength, 2, guardHeight);
        
        // Center opening
        graphics.fillStyle(0x000000);
        graphics.fillRect(centerX - 4, bladeLength, 8, guardHeight);
        
        // Ornate decorative elements
        graphics.fillStyle(0xE0E0E0); // Light silver
        graphics.fillRect(centerX - guardWidth/2 + 6, bladeLength + 3, 6, guardHeight - 6);
        graphics.fillRect(centerX + guardWidth/2 - 12, bladeLength + 3, 6, guardHeight - 6);
        
        // Silver rivets
        graphics.fillStyle(0xFFFFFF);
        graphics.fillCircle(centerX - guardWidth/2 + 9, bladeLength + guardHeight/2, 2);
        graphics.fillCircle(centerX + guardWidth/2 - 9, bladeLength + guardHeight/2, 2);
        
        // === HANDLE ===
        // Main handle - dark brown with silver wire
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Silver wire wrapping
        graphics.fillStyle(0xC0C0C0);
        for (let i = 0; i < handleLength; i += 4) {
            graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + i, bladeWidth, 1);
        }
        
        // === POMMEL ===
        // Main pommel body - silver
        graphics.fillStyle(0xC0C0C0);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - darker silver
        graphics.fillStyle(0x808080);
        graphics.lineStyle(3, 0x808080);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Silver center gem
        graphics.fillStyle(0xFFFFFF);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 4);
    }

    /**
     * Draws an epic sword with gold accents and magical elements
     */
    private static drawEpicSword(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 10;
        const bladeLength = height * 0.65;
        const guardWidth = 32;
        const guardHeight = 16;
        const handleLength = height * 0.25;
        const pommelSize = 16;
        
        // === BLADE ===
        // Main blade body with subtle blue tint
        graphics.fillStyle(0xD0D8E0); // Steel with blue tint
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - subtle blue highlight
        graphics.fillStyle(0xB0C0D0); // Muted blue
        graphics.fillRect(centerX - bladeWidth/2, 0, 2, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 2, 0, 2, bladeLength);
        
        // Magical fuller with blue glow
        graphics.fillStyle(0xB0E0E6); // Powder blue
        graphics.fillRect(centerX - 2, 8, 4, bladeLength - 16);
        
        // Magical runes
        graphics.fillStyle(0x4169E1); // Royal blue
        graphics.fillRect(centerX - 1, 12, 2, 3);
        graphics.fillRect(centerX - 1, 20, 2, 3);
        graphics.fillRect(centerX - 1, 28, 2, 3);
        graphics.fillRect(centerX - 1, 36, 2, 3);
        
        // Blade tip
        graphics.fillStyle(0xE8F4FD);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 8,
            centerX + bladeWidth/2, bladeLength - 8,
            centerX, bladeLength
        );
        
        // === CROSSGUARD ===
        // Main crossguard body - gold
        graphics.fillStyle(0xFFD700); // Gold
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - darker gold
        graphics.fillStyle(0xB8860B); // Dark goldenrod
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 2, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 2, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 2, bladeLength, 2, guardHeight);
        
        // Center opening
        graphics.fillStyle(0x000000);
        graphics.fillRect(centerX - 4, bladeLength, 8, guardHeight);
        
        // Ornate gold decorations
        graphics.fillStyle(0xFFA500); // Orange gold
        graphics.fillRect(centerX - guardWidth/2 + 8, bladeLength + 4, 8, guardHeight - 8);
        graphics.fillRect(centerX + guardWidth/2 - 16, bladeLength + 4, 8, guardHeight - 8);
        
        // Gold gems
        graphics.fillStyle(0xFF6347); // Tomato
        graphics.fillCircle(centerX - guardWidth/2 + 12, bladeLength + guardHeight/2, 3);
        graphics.fillCircle(centerX + guardWidth/2 - 12, bladeLength + guardHeight/2, 3);
        
        // === HANDLE ===
        // Main handle - dark with gold wire
        graphics.fillStyle(0x654321);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Gold wire wrapping
        graphics.fillStyle(0xFFD700);
        for (let i = 0; i < handleLength; i += 3) {
            graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + i, bladeWidth, 1);
        }
        
        // === POMMEL ===
        // Main pommel body - gold
        graphics.fillStyle(0xFFD700);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - darker gold
        graphics.fillStyle(0xB8860B);
        graphics.lineStyle(3, 0xB8860B);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Magical center gem
        graphics.fillStyle(0x4169E1);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 5);
        
        // Gem highlight
        graphics.fillStyle(0x87CEEB);
        graphics.fillCircle(centerX - 1, bladeLength + guardHeight + handleLength + pommelSize/2 - 1, 2);
    }

    /**
     * Draws a legendary sword with ornate details and magical effects
     */
    private static drawLegendarySword(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 12;
        const bladeLength = height * 0.65;
        const guardWidth = 36;
        const guardHeight = 18;
        const handleLength = height * 0.25;
        const pommelSize = 18;
        
        // === BLADE ===
        // Main blade body with subtle ethereal tint
        graphics.fillStyle(0xE0E8F0); // Subtle ethereal steel
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - subtle highlight
        graphics.fillStyle(0xF0F0F0); // Light steel
        graphics.fillRect(centerX - bladeWidth/2, 0, 3, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 3, 0, 3, bladeLength);
        
        // Magical fuller with rainbow effect
        graphics.fillStyle(0xE6E6FA); // Lavender
        graphics.fillRect(centerX - 3, 8, 6, bladeLength - 16);
        
        // Legendary runes
        graphics.fillStyle(0x9370DB); // Medium purple
        graphics.fillRect(centerX - 2, 12, 4, 2);
        graphics.fillRect(centerX - 2, 20, 4, 2);
        graphics.fillRect(centerX - 2, 28, 4, 2);
        graphics.fillRect(centerX - 2, 36, 4, 2);
        graphics.fillRect(centerX - 2, 44, 4, 2);
        
        // Blade tip
        graphics.fillStyle(0xF0F8FF);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 8,
            centerX + bladeWidth/2, bladeLength - 8,
            centerX, bladeLength
        );
        
        // === CROSSGUARD ===
        // Main crossguard body - platinum
        graphics.fillStyle(0xE5E4E2); // Platinum
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - darker platinum
        graphics.fillStyle(0x708090); // Slate gray
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 2, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 2, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 2, bladeLength, 2, guardHeight);
        
        // Center opening
        graphics.fillStyle(0x000000);
        graphics.fillRect(centerX - 4, bladeLength, 8, guardHeight);
        
        // Ornate platinum decorations
        graphics.fillStyle(0xD3D3D3); // Light gray
        graphics.fillRect(centerX - guardWidth/2 + 10, bladeLength + 5, 10, guardHeight - 10);
        graphics.fillRect(centerX + guardWidth/2 - 20, bladeLength + 5, 10, guardHeight - 10);
        
        // Legendary gems
        graphics.fillStyle(0xFF1493); // Deep pink
        graphics.fillCircle(centerX - guardWidth/2 + 15, bladeLength + guardHeight/2, 4);
        graphics.fillCircle(centerX + guardWidth/2 - 15, bladeLength + guardHeight/2, 4);
        
        // Gem highlights
        graphics.fillStyle(0xFFB6C1); // Light pink
        graphics.fillCircle(centerX - guardWidth/2 + 14, bladeLength + guardHeight/2 - 1, 2);
        graphics.fillCircle(centerX + guardWidth/2 - 14, bladeLength + guardHeight/2 - 1, 2);
        
        // === HANDLE ===
        // Main handle - dark with platinum wire
        graphics.fillStyle(0x2F4F4F); // Dark slate gray
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Platinum wire wrapping
        graphics.fillStyle(0xE5E4E2);
        for (let i = 0; i < handleLength; i += 2) {
            graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + i, bladeWidth, 1);
        }
        
        // === POMMEL ===
        // Main pommel body - platinum
        graphics.fillStyle(0xE5E4E2);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - darker platinum
        graphics.fillStyle(0x708090);
        graphics.lineStyle(3, 0x708090);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Legendary center gem
        graphics.fillStyle(0x9370DB);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 6);
        
        // Gem highlight
        graphics.fillStyle(0xE6E6FA);
        graphics.fillCircle(centerX - 2, bladeLength + guardHeight + handleLength + pommelSize/2 - 2, 3);
        
        // Magical aura ring
        graphics.fillStyle(0x9370DB);
        graphics.lineStyle(2, 0x9370DB);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2 + 2);
    }

    /**
     * Draws a common sword with basic steel design
     */
    private static drawCommonSword(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 6;
        const bladeLength = height * 0.65;
        const guardWidth = 24;
        const guardHeight = 12;
        const handleLength = height * 0.25;
        const pommelSize = 12;
        
        // === BLADE ===
        // Main blade body with basic steel color
        graphics.fillStyle(0xB0B0B0); // Basic steel gray
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - simple highlight
        graphics.fillStyle(0xC0C0C0); // Light steel
        graphics.fillRect(centerX - bladeWidth/2, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 1, 0, 1, bladeLength);
        
        // Simple fuller
        graphics.fillStyle(0x909090); // Darker gray
        graphics.fillRect(centerX - 1, 10, 2, bladeLength - 20);
        
        // Blade tip
        graphics.fillStyle(0xD0D0D0);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 6,
            centerX + bladeWidth/2, bladeLength - 6,
            centerX, bladeLength
        );
        
        // === CROSSGUARD ===
        // Main crossguard body - basic steel
        graphics.fillStyle(0xB0B0B0); // Basic steel
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - darker steel
        graphics.fillStyle(0x808080); // Dark steel
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 1);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 1, guardWidth, 1);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 1, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 1, bladeLength, 1, guardHeight);
        
        // Center opening
        graphics.fillStyle(0x000000);
        graphics.fillRect(centerX - 3, bladeLength, 6, guardHeight);
        
        // === HANDLE ===
        // Main handle - dark brown
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Simple leather wrapping
        graphics.fillStyle(0x654321);
        for (let i = 0; i < handleLength; i += 6) {
            graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + i, bladeWidth, 2);
        }
        
        // === POMMEL ===
        // Main pommel body - basic steel
        graphics.fillStyle(0xB0B0B0);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - darker steel
        graphics.fillStyle(0x808080);
        graphics.lineStyle(2, 0x808080);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
    }

    /**
     * Draws an uncommon sword with improved steel and simple decorations
     */
    private static drawUncommonSword(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const centerX = width / 2;
        const bladeWidth = 7;
        const bladeLength = height * 0.65;
        const guardWidth = 26;
        const guardHeight = 13;
        const handleLength = height * 0.25;
        const pommelSize = 13;
        
        // === BLADE ===
        // Main blade body with improved steel color
        graphics.fillStyle(0xB8B8B8); // Improved steel gray
        graphics.fillRect(centerX - bladeWidth/2, 0, bladeWidth, bladeLength);
        
        // Blade edges - better highlight
        graphics.fillStyle(0xC8C8C8); // Light steel
        graphics.fillRect(centerX - bladeWidth/2, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 1, 0, 1, bladeLength);
        
        graphics.fillStyle(0xD8D8D8); // Secondary edge
        graphics.fillRect(centerX - bladeWidth/2 + 1, 0, 1, bladeLength);
        graphics.fillRect(centerX + bladeWidth/2 - 2, 0, 1, bladeLength);
        
        // Fuller with better detail
        graphics.fillStyle(0x989898); // Darker gray
        graphics.fillRect(centerX - 2, 8, 4, bladeLength - 16);
        
        // Simple engravings
        graphics.fillStyle(0xD0D0D0);
        graphics.fillRect(centerX - 1, 15, 2, 1);
        graphics.fillRect(centerX - 1, 25, 2, 1);
        graphics.fillRect(centerX - 1, 35, 2, 1);
        
        // Blade tip
        graphics.fillStyle(0xE0E0E0);
        graphics.fillTriangle(
            centerX - bladeWidth/2, bladeLength - 7,
            centerX + bladeWidth/2, bladeLength - 7,
            centerX, bladeLength
        );
        
        // === CROSSGUARD ===
        // Main crossguard body - improved steel
        graphics.fillStyle(0xB8B8B8); // Improved steel
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, guardHeight);
        
        // Crossguard edges - darker steel
        graphics.fillStyle(0x808080); // Dark steel
        graphics.fillRect(centerX - guardWidth/2, bladeLength, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength + guardHeight - 2, guardWidth, 2);
        graphics.fillRect(centerX - guardWidth/2, bladeLength, 2, guardHeight);
        graphics.fillRect(centerX + guardWidth/2 - 2, bladeLength, 2, guardHeight);
        
        // Center opening
        graphics.fillStyle(0x000000);
        graphics.fillRect(centerX - 3, bladeLength, 6, guardHeight);
        
        // Simple decorative elements
        graphics.fillStyle(0xC8C8C8); // Light steel
        graphics.fillRect(centerX - guardWidth/2 + 4, bladeLength + 2, 4, guardHeight - 4);
        graphics.fillRect(centerX + guardWidth/2 - 8, bladeLength + 2, 4, guardHeight - 4);
        
        // === HANDLE ===
        // Main handle - dark brown with better wrapping
        graphics.fillStyle(0x8B4513);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight, bladeWidth, handleLength);
        
        // Better leather wrapping
        graphics.fillStyle(0x654321);
        for (let i = 0; i < handleLength; i += 4) {
            graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + i, bladeWidth, 1);
        }
        
        // Silver wire accents
        graphics.fillStyle(0xC0C0C0);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + 2, bladeWidth, 1);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + 6, bladeWidth, 1);
        graphics.fillRect(centerX - bladeWidth/2, bladeLength + guardHeight + 10, bladeWidth, 1);
        
        // === POMMEL ===
        // Main pommel body - improved steel
        graphics.fillStyle(0xB8B8B8);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Pommel rim - darker steel
        graphics.fillStyle(0x808080);
        graphics.lineStyle(2, 0x808080);
        graphics.strokeCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, pommelSize/2);
        
        // Simple center decoration
        graphics.fillStyle(0xE0E0E0);
        graphics.fillCircle(centerX, bladeLength + guardHeight + handleLength + pommelSize/2, 3);
    }

    constructor(scene: Phaser.Scene, x: number, y: number, rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common') {
        // Generate sword sprites first, before creating the item (only if not already generated)
        if (!scene.textures.exists('medieval-sword') || !scene.textures.exists('medieval-sword-icon')) {
            MedievalSword.generateSwordTextures(scene);
        }
        
        // Choose texture based on rarity (static method, no 'this' needed)
        const textureKey = MedievalSword.getTextureKeyForRarity(rarity);
        
        // Initialize with the appropriate sword texture
        super(scene, x, y, textureKey, { sound: 'collect-herb', volume: 0.3 });
        
        // Set up weapon stats based on rarity
        this.weaponStats = this.generateWeaponStats(rarity);
        this.iconTexture = 'medieval-sword-icon';
        
        // Set up weapon-specific properties
        this.setupWeaponProperties();
    }

    /**
     * Gets the appropriate texture key based on rarity
     */
    private static getTextureKeyForRarity(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): string {
        switch (rarity) {
            case 'common':
                return 'medieval-sword-common';
            case 'uncommon':
                return 'medieval-sword-uncommon';
            case 'rare':
                return 'medieval-sword-rare';
            case 'epic':
                return 'medieval-sword-epic';
            case 'legendary':
                return 'medieval-sword-legendary';
            default:
                return 'medieval-sword-common';
        }
    }


    /**
     * Generates weapon stats based on rarity
     */
    private generateWeaponStats(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): WeaponStats {
        const baseStats = {
            common: { damage: 15, attackSpeed: 1.2, durability: 100, maxDurability: 100 },
            uncommon: { damage: 20, attackSpeed: 1.3, durability: 120, maxDurability: 120 },
            rare: { damage: 28, attackSpeed: 1.4, durability: 150, maxDurability: 150 },
            epic: { damage: 40, attackSpeed: 1.5, durability: 200, maxDurability: 200 },
            legendary: { damage: 60, attackSpeed: 1.6, durability: 300, maxDurability: 300 }
        };

        const stats = baseStats[rarity];
        
        return {
            damage: stats.damage,
            attackSpeed: stats.attackSpeed,
            durability: stats.durability,
            maxDurability: stats.maxDurability,
            weaponType: 'sword',
            rarity: rarity,
            enchantments: this.generateEnchantments(rarity)
        };
    }

    /**
     * Generates enchantments based on rarity
     */
    private generateEnchantments(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): string[] {
        const enchantmentPool = {
            common: [],
            uncommon: ['Sharp I', 'Durable I'],
            rare: ['Sharp II', 'Durable II', 'Swift I'],
            epic: ['Sharp III', 'Durable III', 'Swift II', 'Vampiric I'],
            legendary: ['Sharp IV', 'Durable IV', 'Swift III', 'Vampiric II', 'Lightning I']
        };

        const availableEnchantments = enchantmentPool[rarity];
        const numEnchantments = Math.min(rarity === 'common' ? 0 : Math.floor(Math.random() * 2) + 1, availableEnchantments.length);
        
        const selectedEnchantments: string[] = [];
        for (let i = 0; i < numEnchantments; i++) {
            const randomIndex = Math.floor(Math.random() * availableEnchantments.length);
            const enchantment = availableEnchantments[randomIndex];
            if (!selectedEnchantments.includes(enchantment)) {
                selectedEnchantments.push(enchantment);
            }
        }

        return selectedEnchantments;
    }

    /**
     * Sets up weapon-specific properties
     */
    private setupWeaponProperties(): void {
        // Set weapon-specific data
        this.setData('weaponStats', this.weaponStats);
        this.setData('isWeapon', true);
        this.setData('weaponType', 'sword');
        this.setData('rarity', this.weaponStats.rarity);
        
        // Glow effects removed - swords now use natural colors
        
        // Set up tooltip data
        this.setupTooltipData();
    }


    /**
     * Sets up tooltip data for the weapon
     */
    private setupTooltipData(): void {
        const tooltipData = {
            name: this.getWeaponName(),
            type: 'Weapon',
            rarity: this.weaponStats.rarity,
            stats: {
                damage: this.weaponStats.damage,
                attackSpeed: this.weaponStats.attackSpeed,
                durability: `${this.weaponStats.durability}/${this.weaponStats.maxDurability}`
            },
            enchantments: this.weaponStats.enchantments,
            description: this.getWeaponDescription()
        };

        this.setData('tooltip', tooltipData);
    }

    /**
     * Gets the weapon name based on rarity
     */
    private getWeaponName(): string {
        const names = {
            common: 'Iron Sword',
            uncommon: 'Steel Sword',
            rare: 'Silver Sword',
            epic: 'Mithril Sword',
            legendary: 'Excalibur'
        };

        return names[this.weaponStats.rarity];
    }

    /**
     * Gets the weapon description
     */
    private getWeaponDescription(): string {
        const descriptions = {
            common: 'A sturdy iron sword, reliable in battle.',
            uncommon: 'A well-crafted steel blade with improved balance.',
            rare: 'A silver sword blessed with magical properties.',
            epic: 'A legendary mithril blade forged by master smiths.',
            legendary: 'The legendary sword of kings, pulsing with ancient power.'
        };

        return descriptions[this.weaponStats.rarity];
    }

    /**
     * Gets the weapon stats
     */
    public getWeaponStats(): WeaponStats {
        return this.weaponStats;
    }

    /**
     * Gets the icon texture for inventory display
     */
    public getIconTexture(): string {
        return this.iconTexture;
    }

    /**
     * Checks if the weapon is equipped
     */
    public isWeaponEquipped(): boolean {
        return this.isEquipped;
    }

    /**
     * Sets the equipped state
     */
    public setEquipped(equipped: boolean): void {
        this.isEquipped = equipped;
    }

    /**
     * Reduces weapon durability
     */
    public reduceDurability(amount: number = 1): void {
        this.weaponStats.durability = Math.max(0, this.weaponStats.durability - amount);
        
        // Update tooltip data
        this.setupTooltipData();
        
        // Check if weapon is broken
        if (this.weaponStats.durability <= 0) {
            this.onWeaponBroken();
        }
    }

    /**
     * Handles weapon breaking
     */
    private onWeaponBroken(): void {
        // Remove glow effects
        this.clearTint();
        this.setAlpha(0.5);
        
        // Update tooltip to show broken state
        const tooltipData = this.getData('tooltip');
        tooltipData.name = `Broken ${tooltipData.name}`;
        tooltipData.description = 'This weapon is broken and needs repair.';
        this.setData('tooltip', tooltipData);
    }

    /**
     * Repairs the weapon
     */
    public repairWeapon(amount?: number): void {
        if (amount) {
            this.weaponStats.durability = Math.min(this.weaponStats.maxDurability, this.weaponStats.durability + amount);
        } else {
            this.weaponStats.durability = this.weaponStats.maxDurability;
        }
        
        // Restore appearance - glow effects removed
        this.setupTooltipData();
    }

    /**
     * Gets the effective damage (including enchantments)
     */
    public getEffectiveDamage(): number {
        let damage = this.weaponStats.damage;
        
        // Apply enchantment bonuses
        this.weaponStats.enchantments?.forEach(enchantment => {
            if (enchantment.includes('Sharp')) {
                const level = parseInt(enchantment.split(' ')[1]);
                damage += level * 5; // +5 damage per sharp level
            }
        });
        
        return damage;
    }

    /**
     * Gets the effective attack speed (including enchantments)
     */
    public getEffectiveAttackSpeed(): number {
        let attackSpeed = this.weaponStats.attackSpeed;
        
        // Apply enchantment bonuses
        this.weaponStats.enchantments?.forEach(enchantment => {
            if (enchantment.includes('Swift')) {
                const level = parseInt(enchantment.split(' ')[1]);
                attackSpeed += level * 0.1; // +0.1 attack speed per swift level
            }
        });
        
        return attackSpeed;
    }

    /**
     * Override getItemType to return proper sword item type for inventory
     */
    public getItemType(): string {
        // Return a consistent sword item type based on rarity
        const rarity = this.weaponStats.rarity;
        return `sword_${rarity}`;
    }
}
