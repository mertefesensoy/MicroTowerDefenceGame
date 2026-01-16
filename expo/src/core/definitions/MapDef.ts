// MapDef.ts
// Map layout and path definitions

import { GridPosition } from '../entities/GridPosition';

/**
 * Waypoint along enemy path
 */
export interface Waypoint {
    position: GridPosition;
    pathProgress: number;  // 0.0 to 1.0
}

/**
 * Map definition
 */
export interface MapDef {
    id: string;
    name: string;
    gridWidth: number;
    gridHeight: number;
    waypoints: Waypoint[];
    blockedTiles: GridPosition[];
}

/**
 * Check if position is valid for tower placement
 */
export function isValidPlacement(map: MapDef, position: GridPosition): boolean {
    // Check bounds
    if (position.x < 0 || position.x >= map.gridWidth ||
        position.y < 0 || position.y >= map.gridHeight) {
        return false;
    }

    // Check not on path
    const onPath = map.waypoints.some(wp => wp.position.equals(position));
    if (onPath) return false;

    // Check not blocked
    const blocked = map.blockedTiles.some(tile => tile.equals(position));
    if (blocked) return false;

    return true;
}

/**
 * Container for map definitions
 */
export class MapDefinitions {
    constructor(public readonly maps: MapDef[]) { }

    /**
     * Find map by ID
     */
    map(id: string): MapDef | undefined {
        return this.maps.find(m => m.id === id);
    }
}
