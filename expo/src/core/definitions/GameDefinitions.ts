// GameDefinitions.ts
// Master container and canonical game data — ported from MicroTDCore Resources

import { EnemyDefinitions, type EnemyDef } from './EnemyDef';
import { TowerDefinitions, type TowerDef } from './TowerDef';
import { WaveDefinitions, type WaveDef } from './WaveDef';
import { MapDefinitions, type MapDef } from './MapDef';
import { RelicDefinitions, type RelicDef } from './RelicDef';
import { GridPosition } from '../entities/GridPosition';

/**
 * Master container for all game definitions
 */
export class GameDefinitions {
    constructor(
        public readonly enemies: EnemyDefinitions,
        public readonly towers: TowerDefinitions,
        public readonly waves: WaveDefinitions,
        public readonly maps: MapDefinitions,
        public readonly relics: RelicDefinitions
    ) { }
}

// ─── Canonical JSON data (from MicroTDCore/Resources/*.json) ───

const ENEMY_DATA: EnemyDef[] = [
    { id: "runner", name: "Runner", hp: 50.0, speed: 2.0, coinReward: 10, livesCost: 1, description: "Fast, low health", isBoss: false },
    { id: "tank", name: "Tank", hp: 200.0, speed: 0.5, coinReward: 25, livesCost: 1, description: "Slow, high health", isBoss: false },
    { id: "swarm", name: "Swarm", hp: 20.0, speed: 1.5, coinReward: 5, livesCost: 1, description: "Weak enemies in large groups", isBoss: false },
    { id: "shielded", name: "Shielded", hp: 100.0, speed: 1.0, coinReward: 20, livesCost: 1, description: "Balanced stats", isBoss: false },
    { id: "boss_behemoth", name: "Behemoth", hp: 1000.0, speed: 0.3, coinReward: 100, livesCost: 5, description: "Massive boss enemy", isBoss: true }
];

const TOWER_DATA: TowerDef[] = [
    { id: "cannon", name: "Cannon Tower", cost: 100, range: 2.5, fireRate: 1.0, damage: 20.0, description: "Basic single-target damage tower", upgradePaths: ["heavy", "rapid"] },
    { id: "frost", name: "Frost Tower", cost: 120, range: 2.0, fireRate: 2.0, damage: 5.0, description: "Slows enemies on hit", upgradePaths: ["deep_freeze", "wide_chill"] },
    { id: "bomb", name: "Bomb Tower", cost: 150, range: 3.0, fireRate: 0.5, damage: 50.0, description: "High damage splash tower", upgradePaths: ["napalm", "cluster"] }
];

const WAVE_DATA: WaveDef[] = [
    { waveIndex: 0, coinReward: 50, isBossWave: false, spawns: [{ enemyType: "runner", spawnTick: 0 }, { enemyType: "runner", spawnTick: 30 }, { enemyType: "runner", spawnTick: 60 }] },
    { waveIndex: 1, coinReward: 60, isBossWave: false, spawns: [{ enemyType: "runner", spawnTick: 0 }, { enemyType: "swarm", spawnTick: 20 }, { enemyType: "swarm", spawnTick: 40 }, { enemyType: "runner", spawnTick: 60 }] },
    { waveIndex: 2, coinReward: 70, isBossWave: false, spawns: [{ enemyType: "tank", spawnTick: 0 }, { enemyType: "runner", spawnTick: 30 }, { enemyType: "runner", spawnTick: 45 }] },
    { waveIndex: 3, coinReward: 80, isBossWave: false, spawns: [{ enemyType: "shielded", spawnTick: 0 }, { enemyType: "shielded", spawnTick: 40 }, { enemyType: "swarm", spawnTick: 20 }, { enemyType: "swarm", spawnTick: 30 }] },
    { waveIndex: 4, coinReward: 90, isBossWave: false, spawns: [{ enemyType: "runner", spawnTick: 0 }, { enemyType: "tank", spawnTick: 20 }, { enemyType: "runner", spawnTick: 40 }, { enemyType: "swarm", spawnTick: 50 }, { enemyType: "swarm", spawnTick: 60 }] },
    { waveIndex: 5, coinReward: 200, isBossWave: true, spawns: [{ enemyType: "boss_behemoth", spawnTick: 0 }, { enemyType: "shielded", spawnTick: 60 }, { enemyType: "shielded", spawnTick: 120 }] },
    { waveIndex: 6, coinReward: 100, isBossWave: false, spawns: [{ enemyType: "tank", spawnTick: 0 }, { enemyType: "tank", spawnTick: 30 }, { enemyType: "runner", spawnTick: 60 }, { enemyType: "runner", spawnTick: 70 }, { enemyType: "runner", spawnTick: 80 }] },
    { waveIndex: 7, coinReward: 110, isBossWave: false, spawns: [{ enemyType: "shielded", spawnTick: 0 }, { enemyType: "shielded", spawnTick: 30 }, { enemyType: "swarm", spawnTick: 45 }, { enemyType: "swarm", spawnTick: 55 }, { enemyType: "tank", spawnTick: 90 }] },
    { waveIndex: 8, coinReward: 120, isBossWave: false, spawns: [{ enemyType: "runner", spawnTick: 0 }, { enemyType: "runner", spawnTick: 15 }, { enemyType: "shielded", spawnTick: 30 }, { enemyType: "tank", spawnTick: 60 }, { enemyType: "swarm", spawnTick: 75 }, { enemyType: "swarm", spawnTick: 85 }] },
    { waveIndex: 9, coinReward: 130, isBossWave: false, spawns: [{ enemyType: "tank", spawnTick: 0 }, { enemyType: "shielded", spawnTick: 30 }, { enemyType: "shielded", spawnTick: 60 }, { enemyType: "runner", spawnTick: 90 }, { enemyType: "runner", spawnTick: 100 }] },
    { waveIndex: 10, coinReward: 140, isBossWave: false, spawns: [{ enemyType: "tank", spawnTick: 0 }, { enemyType: "tank", spawnTick: 40 }, { enemyType: "shielded", spawnTick: 60 }, { enemyType: "runner", spawnTick: 80 }, { enemyType: "runner", spawnTick: 90 }, { enemyType: "swarm", spawnTick: 100 }, { enemyType: "swarm", spawnTick: 110 }] },
    { waveIndex: 11, coinReward: 300, isBossWave: true, spawns: [{ enemyType: "boss_behemoth", spawnTick: 0 }, { enemyType: "tank", spawnTick: 60 }, { enemyType: "boss_behemoth", spawnTick: 120 }, { enemyType: "shielded", spawnTick: 180 }, { enemyType: "shielded", spawnTick: 200 }] }
];

const MAP_DATA: MapDef[] = [
    {
        id: "default", name: "Default Map", gridWidth: 6, gridHeight: 6, blockedTiles: [],
        waypoints: [
            { position: new GridPosition(0, 3), pathProgress: 0.0 },
            { position: new GridPosition(2, 3), pathProgress: 0.2 },
            { position: new GridPosition(2, 1), pathProgress: 0.4 },
            { position: new GridPosition(4, 1), pathProgress: 0.6 },
            { position: new GridPosition(4, 4), pathProgress: 0.8 },
            { position: new GridPosition(5, 4), pathProgress: 1.0 }
        ]
    }
];

const RELIC_DATA: RelicDef[] = [
    { id: "power_amp", name: "Power Amplifier", description: "+50% tower damage", rarity: "common", effects: [{ type: "towerDamageMultiplier", value: 1.5 }] },
    { id: "long_barrel", name: "Long Barrel", description: "+30% tower range", rarity: "common", effects: [{ type: "towerRangeMultiplier", value: 1.3 }] },
    { id: "rapid_loader", name: "Rapid Loader", description: "+40% fire rate", rarity: "uncommon", effects: [{ type: "towerFireRateMultiplier", value: 1.4 }] },
    { id: "frost_coating", name: "Frost Coating", description: "All towers slow by 30%", rarity: "uncommon", effects: [{ type: "enemySlowOnHit", value: 0.3 }] },
    { id: "coin_magnet", name: "Coin Magnet", description: "+50% coin rewards", rarity: "rare", effects: [{ type: "coinMultiplier", value: 1.5 }] },
    { id: "starting_capital", name: "Starting Capital", description: "+100 starting coins", rarity: "common", effects: [{ type: "startingCoins", value: 100.0 }] },
    { id: "devastation", name: "Devastation", description: "+100% damage, -30% range", rarity: "legendary", effects: [{ type: "towerDamageMultiplier", value: 2.0 }, { type: "towerRangeMultiplier", value: 0.7 }] },
    { id: "sniper_scope", name: "Sniper Scope", description: "+100% range, -40% fire rate", rarity: "rare", effects: [{ type: "towerRangeMultiplier", value: 2.0 }, { type: "towerFireRateMultiplier", value: 0.6 }] }
];

/**
 * Create canonical game definitions from embedded JSON data
 * (equivalent to Swift's DefinitionsLoader.loadAllDefinitions)
 */
export function createDefaultDefinitions(): GameDefinitions {
    // Sort spawns by tick for deterministic behavior (matching Swift)
    const sortedWaves = WAVE_DATA.map(w => ({
        ...w,
        spawns: [...w.spawns].sort((a, b) => a.spawnTick - b.spawnTick),
    }));

    return new GameDefinitions(
        new EnemyDefinitions(ENEMY_DATA),
        new TowerDefinitions(TOWER_DATA),
        new WaveDefinitions(sortedWaves),
        new MapDefinitions(MAP_DATA),
        new RelicDefinitions(RELIC_DATA),
    );
}

/**
 * @deprecated Use createDefaultDefinitions() instead
 */
export function createSampleDefinitions(): GameDefinitions {
    return createDefaultDefinitions();
}
