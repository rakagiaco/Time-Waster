import Phaser from 'phaser';
import { Tree } from '../prefabs/Tree';

export interface PathfindingConfig {
    maxSearchDistance: number;
    stepSize: number;
    maxSteps: number;
    obstaclePadding: number;
}

export class Pathfinding {

    private config: PathfindingConfig;
    private obstacles: Tree[] = [];

    constructor(_scene: Phaser.Scene, config?: Partial<PathfindingConfig>) {

        this.config = {
            maxSearchDistance: 300,
            stepSize: 20,
            maxSteps: 15,
            obstaclePadding: 25,
            ...config
        };
    }

    public setObstacles(trees: Tree[]): void {
        this.obstacles = trees;
    }

    public findPath(startX: number, startY: number, targetX: number, targetY: number): { x: number; y: number }[] {
        const path: { x: number; y: number }[] = [];
        
        // Calculate direct distance
        const directDistance = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
        
        // If direct path is clear, use it
        if (this.isPathClear(startX, startY, targetX, targetY)) {
            return [{ x: targetX, y: targetY }];
        }

        // If target is too far, don't pathfind
        if (directDistance > this.config.maxSearchDistance) {
            return [{ x: targetX, y: targetY }];
        }

        // Try to find a path around obstacles
        const waypoints = this.findWaypoints(startX, startY, targetX, targetY);
        
        if (waypoints.length > 0) {
            path.push(...waypoints);
        } else {
            // Fallback to direct path if no waypoints found
            path.push({ x: targetX, y: targetY });
        }

        return path;
    }

    private isPathClear(startX: number, startY: number, endX: number, endY: number): boolean {
        const steps = Math.ceil(Phaser.Math.Distance.Between(startX, startY, endX, endY) / this.config.stepSize);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Phaser.Math.Linear(startX, endX, t);
            const y = Phaser.Math.Linear(startY, endY, t);
            
            if (this.isPointInObstacle(x, y)) {
                return false;
            }
        }
        
        return true;
    }

    private isPointInObstacle(x: number, y: number): boolean {
        for (const obstacle of this.obstacles) {
            const radius = obstacle.getCollisionRadius();
            
            const distance = Phaser.Math.Distance.Between(x, y, obstacle.x, obstacle.y);
            if (distance <= radius) {
                return true;
            }
        }
        return false;
    }

    private findWaypoints(startX: number, startY: number, targetX: number, targetY: number): { x: number; y: number }[] {
        const waypoints: { x: number; y: number }[] = [];
        
        // Find the closest obstacle blocking the path
        const blockingObstacle = this.findBlockingObstacle(startX, startY, targetX, targetY);
        
        if (!blockingObstacle) {
            return waypoints;
        }

        // Try to go around the obstacle
        const obstacleX = blockingObstacle.x;
        const obstacleY = blockingObstacle.y;
        const radius = blockingObstacle.getCollisionRadius();
        
        // Calculate direction from start to target
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Calculate perpendicular direction for going around
        const perpX = -dirY;
        const perpY = dirX;
        
        // Try both sides of the obstacle
        const side1X = obstacleX + perpX * (radius + this.config.obstaclePadding);
        const side1Y = obstacleY + perpY * (radius + this.config.obstaclePadding);
        const side2X = obstacleX - perpX * (radius + this.config.obstaclePadding);
        const side2Y = obstacleY - perpY * (radius + this.config.obstaclePadding);
        
        // Check which side is clearer
        const side1Clear = this.isPathClear(startX, startY, side1X, side1Y) && 
                          this.isPathClear(side1X, side1Y, targetX, targetY);
        const side2Clear = this.isPathClear(startX, startY, side2X, side2Y) && 
                          this.isPathClear(side2X, side2Y, targetX, targetY);
        
        if (side1Clear && side2Clear) {
            // Both sides are clear, choose the closer one
            const dist1 = Phaser.Math.Distance.Between(startX, startY, side1X, side1Y);
            const dist2 = Phaser.Math.Distance.Between(startX, startY, side2X, side2Y);
            
            if (dist1 < dist2) {
                waypoints.push({ x: side1X, y: side1Y });
            } else {
                waypoints.push({ x: side2X, y: side2Y });
            }
        } else if (side1Clear) {
            waypoints.push({ x: side1X, y: side1Y });
        } else if (side2Clear) {
            waypoints.push({ x: side2X, y: side2Y });
        }
        
        return waypoints;
    }

    private findBlockingObstacle(startX: number, startY: number, targetX: number, targetY: number): Tree | null {
        let closestObstacle: Tree | null = null;
        let closestDistance = Infinity;
        
        for (const obstacle of this.obstacles) {
            const distance = this.getDistanceToLineSegment(
                obstacle.x, obstacle.y,
                startX, startY, targetX, targetY
            );
            
            const radius = obstacle.getCollisionRadius();
            
            if (distance <= radius && distance < closestDistance) {
                closestObstacle = obstacle;
                closestDistance = distance;
            }
        }
        
        return closestObstacle;
    }

    private getDistanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return Phaser.Math.Distance.Between(px, py, x1, y1);
        }
        
        const param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return Phaser.Math.Distance.Between(px, py, xx, yy);
    }

    public getNextWaypoint(currentX: number, currentY: number, path: { x: number; y: number }[]): { x: number; y: number } | null {
        if (path.length === 0) return null;
        
        // Find the closest waypoint that hasn't been reached
        for (const waypoint of path) {
            const distance = Phaser.Math.Distance.Between(currentX, currentY, waypoint.x, waypoint.y);
            if (distance > 15) { // 15 pixel threshold for "reached"
                return waypoint;
            }
        }
        
        return null;
    }

    public isNearObstacle(x: number, y: number, threshold: number = 30): boolean {
        for (const obstacle of this.obstacles) {
            const distance = Phaser.Math.Distance.Between(x, y, obstacle.x, obstacle.y);
            if (distance <= threshold) {
                return true;
            }
        }
        return false;
    }
}
