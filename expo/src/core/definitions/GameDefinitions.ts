// GameDefinitions.ts
// Sample game definitions for testing

import { EnemyDefinitions, EnemyDef } from './EnemyDef';
import { TowerDefinitions, TowerDef } from './TowerDef';
import { WaveDefinitions, WaveDef } from './WaveDef';
import { MapDefinitions, MapDef } from './MapDef';
import { GridPosition } from '../entities/GridPosition';

/**
 * Master container for all game definitions
 */
export interface GameDefinitions {
    enemies: EnemyDefinitions;
    towers: TowerDefinitions;
    waves: WaveDefinitions;
    maps: MapDefinitions;
}

/**
 * Create sample game definitions for testing
 */
export function createSampleDefinitions(): GameDefinitions {
    // Enemy definitions
    const enemies: EnemyDef[] = [
        {
            id: 'basic',
            name: 'Basic Enemy',
            hp: 100,
            speed: 1.0,
            coinReward: 10,
            livesCost: 1,
            description: 'A basic enemy',
            isBoss: false,
        },
        {
            id: 'fast',
            name: 'Fast Enemy',
            hp: 50,
            speed: 2.0,
            coinReward: 15,
            livesCost: 1,
            description: 'A fast enemy',
            isBoss: false,
        },
        {
            id: 'tank',
            name: 'Tank Enemy',
            hp: 300,
            speed: 0.5,
            coinReward: 30,
            livesCost: 2,
            description: 'A tanky enemy',
            isBoss: false,
        },
    ];

    // Tower definitions
    const towers: TowerDef[] = [
        {
            id: 'archer',
            name: 'Archer Tower',
            cost: 100,
            range: 3.0,
            fireRate: 1.0,
            damage: 25,
            description: 'Basic ranged tower',
            upgradePaths: [],
        },
        {
            id: 'cannon',
            name: 'Cannon Tower',
            cost: 200,
            range: 4.0,
            fireRate: 0.5,
            damage: 75,
            description: 'Slow but powerful',
            upgradePaths: [],
        },
    ];

    // Wave definitions
    const waves: WaveDef[] = [
        {
            waveIndex: 0,
            spawns: [
                { enemyType: 'basic', spawnTick: 0 },
                { enemyType: 'basic', spawnTick: 30 },
                { enemyType: 'basic', spawnTick: 60 },
            ],
            coinReward: 50,
            isBossWave: false,
        },
        {
            waveIndex: 1,
            spawns: [
                { enemyType: 'basic', spawnTick: 0 },
                { enemyType: 'fast', spawnTick: 20 },
                { enemyType: 'basic', spawnTick: 40 },
                { enemyType: 'fast', spawnTick: 60 },
                { enemyType: 'basic', spawnTick: 80 },
            ],
            coinReward: 75,
            isBossWave: false,
        },
        {
            waveIndex: 2,
            spawns: [
                { enemyType: 'tank', spawnTick: 0 },
                { enemyType: 'basic', spawnTick: 20 },
                { enemyType: 'basic', spawnTick: 40 },
                { enemyType: 'fast', spawnTick: 60 },
                { enemyType: 'tank', spawnTick: 100 },
            ],
            coinReward: 100,
            isBossWave: false,
        },
    ];

    // Simple linear map
    const maps: MapDef[] = [
        {
            id: 'default',
            name: 'Default Map',
            gridWidth: 10,
            gridHeight: 10,
            waypoints: [
                { position: new GridPosition(0, 5), pathProgress: 0.0 },
                { position: new GridPosition(3, 5), pathProgress: 0.25 },
                { position: new GridPosition(3, 2), pathProgress: 0.5 },
                { position: new GridPosition(7, 2), pathProgress: 0.75 },
                { position: new GridPosition(9, 5), pathProgress: 1.0 },
            ],
            blockedTiles: [],
        },
    ];

    return {
        enemies: new EnemyDefinitions(enemies),
        towers: new TowerDefinitions(towers),
        waves: new WaveDefinitions(waves),
        maps: new MapDefinitions(maps),
    };
}
