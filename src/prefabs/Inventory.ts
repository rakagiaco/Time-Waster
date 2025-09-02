export class Inventory {
    private items: Map<string, number> = new Map();

    constructor() {
        // Initialize empty inventory
    }

    public add(itemType: string, amount: number): boolean {
        const currentAmount = this.items.get(itemType) || 0;
        this.items.set(itemType, currentAmount + amount);
        return true;
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
