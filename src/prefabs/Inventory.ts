export class Inventory {
    private items: Map<string, number> = new Map();
    private readonly maxStackSize: number = 12;

    constructor() {
        // Initialize empty inventory
    }

    public add(itemType: string, amount: number): boolean {
        const currentAmount = this.items.get(itemType) || 0;
        const newAmount = Math.min(currentAmount + amount, this.maxStackSize);
        this.items.set(itemType, newAmount);
        return true;
    }

    public canAdd(itemType: string, amount: number): boolean {
        const currentAmount = this.items.get(itemType) || 0;
        return currentAmount + amount <= this.maxStackSize;
    }

    public getMaxStackSize(): number {
        return this.maxStackSize;
    }

    public remove(itemType: string, amount: number): boolean {
        const currentAmount = this.items.get(itemType) || 0;
        if (currentAmount >= amount) {
            const newAmount = currentAmount - amount;
            if (newAmount <= 0) {
                this.items.delete(itemType);
            } else {
                this.items.set(itemType, newAmount);
            }
            return true;
        }
        return false;
    }

    public get(itemType: string): number {
        return this.items.get(itemType) || 0;
    }

    public has(itemType: string, amount: number = 1): boolean {
        return (this.items.get(itemType) || 0) >= amount;
    }

    public getAll(): Map<string, number> {
        return new Map(this.items);
    }

    public getData(): [string, number][] {
        return Array.from(this.items.entries());
    }

    public getInventoryData(): [string, number][] {
        return Array.from(this.items.entries());
    }

    public loadFromData(data: [string, number][]): void {
        this.items.clear();
        data.forEach(([itemType, amount]) => {
            this.items.set(itemType, amount);
        });
    }

    public clear(): void {
        this.items.clear();
    }

    public isEmpty(): boolean {
        return this.items.size === 0;
    }

    public getSize(): number {
        return this.items.size;
    }
}
