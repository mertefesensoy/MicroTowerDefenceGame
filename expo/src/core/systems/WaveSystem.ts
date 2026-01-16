// WaveSystem.ts
// Manages enemy wave spawning deterministically

import { WaveDefinitions, WaveDef } from '../definitions/WaveDef';
import { EnemyDefinitions, EnemyDef } from '../definitions/EnemyDef';


/**
 * Wave spawning and management system
 */
export class WaveSystem {
    private currentWaveIndex = -1;
    private currentWaveDef: WaveDef | null = null;
    private waveStartTick = 0;
    private spawnedIndices = new Set<number>();

    constructor(
        private readonly waveDefs: WaveDefinitions,
        private readonly enemyDefs: EnemyDefinitions,
        _rng: any
    ) { }

    /**
     * Start the next wave
     */
    startWave(currentTick: number): WaveDef | null {
        this.currentWaveIndex++;
        const waveDef = this.waveDefs.wave(this.currentWaveIndex);

        if (!waveDef) {
            return null;
        }

        this.currentWaveDef = waveDef;
        this.waveStartTick = currentTick;
        this.spawnedIndices.clear();

        return waveDef;
    }

    /**
     * Check for and return enemies to spawn this tick
     */
    checkSpawns(currentTick: number): Array<[string, EnemyDef]> {
        if (!this.currentWaveDef) return [];

        const ticksIntoWave = currentTick - this.waveStartTick;
        const toSpawn: Array<[string, EnemyDef]> = [];

        this.currentWaveDef.spawns.forEach((spawn, index) => {
            if (spawn.spawnTick === ticksIntoWave && !this.spawnedIndices.has(index)) {
                const enemyDef = this.enemyDefs.enemy(spawn.enemyType);
                if (enemyDef) {
                    toSpawn.push([spawn.enemyType, enemyDef]);
                    this.spawnedIndices.add(index);
                }
            }
        });

        return toSpawn;
    }

    /**
     * Check if current wave is complete (all enemies spawned)
     */
    isWaveSpawningComplete(): boolean {
        if (!this.currentWaveDef) return false;
        return this.spawnedIndices.size === this.currentWaveDef.spawns.length;
    }

    get totalWaves(): number {
        return this.waveDefs.totalWaves;
    }

    get currentWave(): number {
        return this.currentWaveIndex;
    }
}
