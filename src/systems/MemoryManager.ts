/**
 * Memory Manager
 * 
 * Handles memory optimization and prevents ArrayBuffer allocation failures
 * without removing game features. Uses lazy loading and memory monitoring.
 */

export class MemoryManager {
    private static instance: MemoryManager;
    private memoryThreshold: number = 2000 * 1024 * 1024; // 2000MB threshold (2GB) - conservative to prevent array buffer allocation failures
    private isLowMemory: boolean = false;
    
    private constructor() {}
    
    public static getInstance(): MemoryManager {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    
    /**
     * Check current memory usage
     */
    public checkMemoryUsage(): { used: number; total: number; isLow: boolean } {
        if (!performance.memory) {
            return { used: 0, total: 0, isLow: false };
        }
        
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        
        // Debug: Log actual memory values
        console.log(`Memory Debug: used=${used}, total=${total}, threshold=${this.memoryThreshold}`);
        
        const isLow = used > this.memoryThreshold;
        
        this.isLowMemory = isLow;
        
        return { used, total, isLow };
    }
    
    /**
     * Get memory usage in MB
     */
    public getMemoryUsageMB(): { used: number; total: number; isLow: boolean } {
        const memory = this.checkMemoryUsage();
        return {
            used: memory.used / 1024 / 1024,
            total: memory.total / 1024 / 1024,
            isLow: memory.isLow
        };
    }
    
    /**
     * Check if we should load additional assets
     */
    public shouldLoadAsset(): boolean {
        const memory = this.checkMemoryUsage();
        return !memory.isLow;
    }
    
    /**
     * Force garbage collection if available
     */
    public forceGarbageCollection(): void {
        if (window.gc) {
            window.gc();
            console.log('✓ Forced garbage collection');
        }
    }
    
    /**
     * Monitor memory usage and log warnings
     */
    public startMemoryMonitoring(): void {
        setInterval(() => {
            const memory = this.getMemoryUsageMB();
            if (memory.isLow) {
                console.warn(`⚠️ Low memory detected: ${memory.used.toFixed(1)}MB used of ${memory.total.toFixed(1)}MB`);
                this.forceGarbageCollection();
            }
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Get memory status for debugging
     */
    public getMemoryStatus(): string {
        const memory = this.getMemoryUsageMB();
        return `Memory: ${memory.used.toFixed(1)}MB / ${memory.total.toFixed(1)}MB ${memory.isLow ? '(LOW)' : '(OK)'}`;
    }
}

// Extend Window interface for garbage collection
declare global {
    interface Window {
        gc?: () => void;
    }
}
