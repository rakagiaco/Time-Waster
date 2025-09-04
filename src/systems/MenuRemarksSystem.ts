/**
 * System for managing random menu remarks/taglines
 */
export class MenuRemarksSystem {
    private static remarks: string[] = [];
    private static isLoaded: boolean = false;

    /**
     * Loads remarks from the JSON file
     */
    public static async loadRemarks(): Promise<void> {
        try {
            const response = await fetch('/data/menu-remarks.json');
            if (!response.ok) {
                throw new Error(`Failed to load remarks: ${response.status}`);
            }
            
            const data = await response.json();
            this.remarks = data.remarks || [];
            this.isLoaded = true;
            
            console.log(`Loaded ${this.remarks.length} menu remarks`);
        } catch (error) {
            console.error('Error loading menu remarks:', error);
            // Fallback to default remark
            this.remarks = ['A vibecoded clanker fantasy'];
            this.isLoaded = true;
        }
    }

    /**
     * Gets a random remark from the loaded remarks
     */
    public static getRandomRemark(): string {
        if (!this.isLoaded || this.remarks.length === 0) {
            return 'A vibecoded clanker fantasy'; // Fallback
        }
        
        const randomIndex = Math.floor(Math.random() * this.remarks.length);
        return this.remarks[randomIndex];
    }

    /**
     * Checks if remarks are loaded
     */
    public static isRemarksLoaded(): boolean {
        return this.isLoaded;
    }

    /**
     * Gets the total number of loaded remarks
     */
    public static getRemarksCount(): number {
        return this.remarks.length;
    }
}
