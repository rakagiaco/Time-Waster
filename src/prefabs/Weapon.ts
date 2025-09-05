import Phaser from 'phaser';
import { Item } from './Item';

/**
 * Base Weapon Interface
 * Defines the properties and methods for weapon items
 */
export interface WeaponStats {
    damage: number;
    attackSpeed: number; // Attacks per second
    durability: number;
    maxDurability: number;
    weaponType: string;
    rarity: string;
}

/**
 * Base Weapon Class
 * 
 * Simple base class for all weapons. Extends Item to work with the existing
 * inventory system while providing weapon-specific functionality.
 */
export abstract class Weapon extends Item {
    protected weaponStats!: WeaponStats;
    protected isEquipped: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, itemType: string, soundEffect?: { sound: string; volume: number }) {
        super(scene, x, y, itemType, soundEffect);
        
        // Note: setupWeaponProperties() should be called by subclasses after weaponStats is initialized
    }

    /**
     * Sets up weapon-specific properties
     */
    protected setupWeaponProperties(): void {
        // Set weapon-specific data
        this.setData('isWeapon', true);
        this.setData('weaponType', this.weaponStats.weaponType);
        this.setData('rarity', this.weaponStats.rarity);
        this.setData('weaponStats', this.weaponStats);
        
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
            description: this.getWeaponDescription()
        };

        this.setData('tooltip', tooltipData);
    }

    /**
     * Gets the weapon name
     */
    protected abstract getWeaponName(): string;

    /**
     * Gets the weapon description
     */
    protected abstract getWeaponDescription(): string;

    /**
     * Gets the weapon stats
     */
    public getWeaponStats(): WeaponStats {
        return this.weaponStats;
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
        
        // Restore appearance
        this.setAlpha(1.0);
        this.setupTooltipData();
    }
}

/**
 * Long Sword Weapon Class
 * 
 * A simple long sword weapon using the w_longsword.png texture.
 * This is the first weapon in the new system.
 */
export class LongSword extends Weapon {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Initialize weapon stats
        const weaponStats: WeaponStats = {
            damage: 25,
            attackSpeed: 1.0,
            durability: 100,
            maxDurability: 100,
            weaponType: 'sword',
            rarity: 'common'
        };

        // Call parent constructor with weapon type
        super(scene, x, y, 'w_longsword', { sound: 'collect-herb', volume: 0.3 });
        
        // Set weapon stats
        this.weaponStats = weaponStats;
        
        // Set up weapon-specific properties
        this.setupWeaponProperties();
        
        // Add debug name for UI display
        this.setName('Long Sword');
    }

    /**
     * Gets the weapon name
     */
    protected getWeaponName(): string {
        return 'Long Sword';
    }

    /**
     * Gets the weapon description
     */
    protected getWeaponDescription(): string {
        return 'A well-balanced long sword, reliable in combat.';
    }

    /**
     * Override getItemType to return proper weapon item type for inventory
     */
    public getItemType(): string {
        return 'w_longsword';
    }
}
