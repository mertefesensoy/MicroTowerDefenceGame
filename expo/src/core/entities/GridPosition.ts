// GridPosition.ts
// 2D grid position and utilities

/**
 * 2D grid position
 */
export class GridPosition {
    constructor(
        public readonly x: number,
        public readonly y: number
    ) { }

    /**
     * Calculate Euclidean distance to another position
     */
    distance(to: GridPosition): number {
        const dx = this.x - to.x;
        const dy = this.y - to.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check equality with another position
     */
    equals(other: GridPosition): boolean {
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Get hash code for use in Maps/Sets
     */
    hashCode(): string {
        return `${this.x},${this.y}`;
    }

    /**
     * Create from hash code
     */
    static fromHashCode(hash: string): GridPosition {
        const [x, y] = hash.split(',').map(Number);
        return new GridPosition(x, y);
    }
}
