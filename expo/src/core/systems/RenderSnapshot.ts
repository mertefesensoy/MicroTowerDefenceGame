// RenderSnapshot.ts
// Read-only DTOs for rendering — ported from MicroTDCore/Systems/RenderSnapshot.swift

import type { GridPosition } from '../entities/GridPosition';

/**
 * Rendering data for a single enemy (no gameplay logic exposed)
 */
export interface RenderEnemy {
    id: number;
    typeID: string;
    pathProgress: number;
    hpFraction: number;  // 0.0 to 1.0
    isBoss: boolean;
    isSlowed: boolean;
}

/**
 * Rendering data for a single tower (no gameplay logic exposed)
 */
export interface RenderTower {
    id: number;
    typeID: string;
    gridPosition: GridPosition;
    kills: number;
    totalDamage: number;
}

/**
 * Complete snapshot of the game state for the rendering layer.
 * Contains only the data needed for visualization — no mutable game logic.
 */
export interface RenderSnapshot {
    tick: number;
    enemies: RenderEnemy[];
    towers: RenderTower[];
    coins: number;
    lives: number;
    currentWave: number;
    totalWaves: number;
    stateType: string;  // RunStateType
}
