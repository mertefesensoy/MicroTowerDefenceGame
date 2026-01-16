// WaveDef.ts
// Wave composition definitions

/**
 * Enemy spawn entry in wave
 */
export interface EnemySpawn {
    enemyType: string;
    spawnTick: number;  // relative to wave start
}

/**
 * Wave definition
 */
export interface WaveDef {
    waveIndex: number;
    spawns: EnemySpawn[];
    coinReward: number;
    isBossWave: boolean;
}

/**
 * Container for all wave definitions
 */
export class WaveDefinitions {
    constructor(public readonly waves: WaveDef[]) { }

    /**
     * Find wave by index
     */
    wave(index: number): WaveDef | undefined {
        return this.waves.find(w => w.waveIndex === index);
    }

    get totalWaves(): number {
        return this.waves.length;
    }
}
