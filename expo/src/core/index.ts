// index.ts
// Core exports - UI-agnostic game logic

// Main game state
export { GameState, type RunState } from './GameState';

// Foundations
export { EventLog, type GameEvent } from './GameEvent';
export { CommandLog, type GameCommand } from './GameCommand';
export { SeededRNG } from './SeededRNG';
export { SimulationClock } from './SimulationClock';

// Definitions
export type { EnemyDef } from './definitions/EnemyDef';
export { EnemyDefinitions } from './definitions/EnemyDef';
export type { TowerDef } from './definitions/TowerDef';
export { TowerDefinitions } from './definitions/TowerDef';
export type { WaveDef, EnemySpawn } from './definitions/WaveDef';
export { WaveDefinitions } from './definitions/WaveDef';
export type { MapDef, Waypoint } from './definitions/MapDef';
export { MapDefinitions, isValidPlacement } from './definitions/MapDef';
export type { RelicDef, RelicEffect, EffectType, RelicRarity } from './definitions/RelicDef';
export { RelicDefinitions } from './definitions/RelicDef';
export { RelicDatabase } from './definitions/RelicDatabase';
export type { GameDefinitions } from './definitions/GameDefinitions';
export { createDefaultDefinitions, createSampleDefinitions } from './definitions/GameDefinitions';

// Progression types
export type {
    ProgressionProfile,
    RunSummary,
    ProgressionEvent,
    LastRunMetadata,
    ProgressionSaveFile,
    UnlockDefinition,
} from './definitions/ProgressionTypes';
export { ProgressionRules, CURRENT_SCHEMA_VERSION, createDefaultProfile } from './definitions/ProgressionTypes';

// Entities
export { Enemy, type SlowEffect } from './entities/Enemy';
export { Tower } from './entities/Tower';
export { GridPosition } from './entities/GridPosition';
export { Relic } from './entities/Relic';

// Systems
export { WaveSystem } from './systems/WaveSystem';
export { CombatSystem, type CombatResult } from './systems/CombatSystem';
export { EconomySystem } from './systems/EconomySystem';
export { RelicSystem } from './systems/RelicSystem';
export { RunStateMachine } from './systems/RunStateMachine';
export type { RunStateType } from './systems/RunStateMachine';
export { ProgressionSystem } from './systems/ProgressionSystem';
export type { RenderSnapshot, RenderEnemy, RenderTower } from './systems/RenderSnapshot';
