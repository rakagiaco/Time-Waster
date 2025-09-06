export interface WeaponData {
    type: 'weapon';
    weaponType: string;
    rarity: string;
    stats: any;
    icon: string;
}

export class Inventory {
    private slots: [string, number][] = []; // Slot-based inventory
    private weapons: WeaponData[] = [];
    private readonly maxStackSize: number = 12;
    private readonly maxWeapons: number = 10;
    private readonly maxSlots: number = 36; // 9x4 grid

    constructor() {
        // Initialize empty inventory with 36 empty slots
        for (let i = 0; i < this.maxSlots; i++) {
            this.slots.push(['empty', 0]);
        }
    }

    public add(itemType: string, amount: number): boolean {
        // First pass: Fill existing stacks of the same item type
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            
            if (slotItemType === itemType && slotCount < this.maxStackSize) {
                // Found existing stack with room
                const canAdd = Math.min(amount, this.maxStackSize - slotCount);
                this.slots[i] = [itemType, slotCount + canAdd];
                amount -= canAdd;
                if (amount <= 0) return true;
            }
        }
        
        // Second pass: Use empty slots for remaining items
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            
            if (slotItemType === 'empty') {
                // Found empty slot
                const amountToAdd = Math.min(amount, this.maxStackSize);
                this.slots[i] = [itemType, amountToAdd];
                amount -= amountToAdd;
                if (amount <= 0) return true;
            }
        }
        
        return false; // No space available
    }

    public canAdd(itemType: string, amount: number): boolean {
        let remaining = amount;
        
        // First pass: Check existing stacks of the same item type
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            if (slotItemType === itemType) {
                remaining -= Math.min(remaining, this.maxStackSize - slotCount);
                if (remaining <= 0) return true;
            }
        }
        
        // Second pass: Check empty slots for remaining items
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            if (slotItemType === 'empty') {
                remaining -= Math.min(remaining, this.maxStackSize);
                if (remaining <= 0) return true;
            }
        }
        
        return false;
    }

    public getMaxStackSize(): number {
        return this.maxStackSize;
    }

    public hasItem(itemType: string, amount: number): boolean {
        let total = 0;
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            if (slotItemType === itemType) {
                total += slotCount;
            }
        }
        return total >= amount;
    }

    public getItemCount(itemType: string): number {
        let total = 0;
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            if (slotItemType === itemType) {
                total += slotCount;
            }
        }
        return total;
    }

    public remove(itemType: string, amount: number): boolean {
        let remaining = amount;
        for (let i = 0; i < this.maxSlots; i++) {
            const [slotItemType, slotCount] = this.slots[i];
            if (slotItemType === itemType) {
                const canRemove = Math.min(remaining, slotCount);
                const newCount = slotCount - canRemove;
                if (newCount <= 0) {
                    this.slots[i] = ['empty', 0];
                } else {
                    this.slots[i] = [itemType, newCount];
                }
                remaining -= canRemove;
                if (remaining <= 0) return true;
            }
        }
        return false;
    }

    public get(itemType: string): number {
        return this.getItemCount(itemType);
    }

    public has(itemType: string, amount: number = 1): boolean {
        return this.hasItem(itemType, amount);
    }

    public getAll(): Map<string, number> {
        const result = new Map<string, number>();
        for (let i = 0; i < this.maxSlots; i++) {
            const [itemType, count] = this.slots[i];
            if (itemType !== 'empty' && count > 0) {
                const current = result.get(itemType) || 0;
                result.set(itemType, current + count);
            }
        }
        return result;
    }

    public getData(): [string, number][] {
        return Array.from(this.getAll().entries());
    }

    public getInventoryData(): [string, number][] {
        // Return the slot-based data directly
        return [...this.slots];
    }

    public getInventoryDataWithWeapons(): [string, number][] {
        // Combine regular items and weapons for display
        const combinedData: [string, number][] = [...this.slots];
        
        // Add weapons to the inventory display
        this.weapons.forEach(weapon => {
            // Find first empty slot
            for (let i = 0; i < combinedData.length; i++) {
                if (combinedData[i][0] === 'empty') {
                    combinedData[i] = [`weapon_${weapon.weaponType}_${weapon.rarity}`, 1];
                    break;
                }
            }
        });
        
        return combinedData;
    }

    public loadFromData(data: [string, number][]): void {
        // Clear all slots
        for (let i = 0; i < this.maxSlots; i++) {
            this.slots[i] = ['empty', 0];
        }
        
        // Load data into slots
        for (let i = 0; i < Math.min(data.length, this.maxSlots); i++) {
            const [itemType, amount] = data[i];
            this.slots[i] = [itemType, amount];
        }
    }

    public clear(): void {
        for (let i = 0; i < this.maxSlots; i++) {
            this.slots[i] = ['empty', 0];
        }
    }

    /**
     * Add item to specific slot (for UI operations)
     */
    public addToSlot(slotIndex: number, itemType: string, count: number): void {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return;
        this.slots[slotIndex] = [itemType, count];
    }

    /**
     * Remove item from specific slot (for UI operations)
     */
    public removeFromSlot(slotIndex: number): void {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return;
        this.slots[slotIndex] = ['empty', 0];
    }

    public isEmpty(): boolean {
        for (let i = 0; i < this.maxSlots; i++) {
            const [itemType, count] = this.slots[i];
            if (itemType !== 'empty' && count > 0) {
                return false;
            }
        }
        return true;
    }

    public getSize(): number {
        let count = 0;
        for (let i = 0; i < this.maxSlots; i++) {
            const [itemType, amount] = this.slots[i];
            if (itemType !== 'empty' && amount > 0) {
                count++;
            }
        }
        return count;
    }

    // Weapon-specific methods
    public addWeapon(weaponData: WeaponData): boolean {
        if (this.weapons.length >= this.maxWeapons) {
            return false; // Inventory full
        }
        this.weapons.push(weaponData);
        return true;
    }

    public getWeapons(): WeaponData[] {
        return [...this.weapons];
    }

    public removeWeapon(index: number): WeaponData | null {
        if (index >= 0 && index < this.weapons.length) {
            return this.weapons.splice(index, 1)[0];
        }
        return null;
    }

    public getWeaponCount(): number {
        return this.weapons.length;
    }

    public canAddWeapon(): boolean {
        return this.weapons.length < this.maxWeapons;
    }

    // Legacy method for compatibility
    public addItem(itemType: string, amount: number): boolean {
        return this.add(itemType, amount);
    }
}
