// GameState.ts
// Main game state - pure TypeScript, deterministic, testable

import { EventLog } from './GameEvent';
import { CommandLog, GameCommand } from './GameCommand';
import { SeededRNG } from './SeededRNG';
import { SimulationClock } from './SimulationClock';
import { Enemy } from './entities/Enemy';
import { Tower } from './entities/Tower';
import { GridPosition } from './entities/GridPosition';
import { WaveSystem } from './systems/WaveSystem';
import { CombatSystem } from './systems/CombatSystem';
import { EconomySystem } from './systems/EconomySystem';
import type { GameDefinitions } from './definitions/GameDefinitions';

/**
 * Run state machine states
 */
export type RunState =
    | { type: 'building'; waveIndex: number }
    | { type: 'inWave'; waveIndex: number }
    | { type: 'relicChoice'; waveIndex: number }
    | { type: 'victory'; wavesCompleted: number }
    | { type: 'defeat'; wavesCompleted: number };

/**
 * Main game state - processes commands, runs simulation, emits events
 * NO UI dependencies allowed in this file
 */
export class GameState {
    // Core config
    readonly runSeed: number;
    readonly definitions: GameDefinitions;

    // Systems
    private readonly rng: SeededRNG;
    private readonly clock: SimulationClock;
    private readonly waveSystem: WaveSystem;
    private readonly combatSystem: CombatSystem;
    private readonly economySystem: EconomySystem;

    // State machine
    private state: RunState;

    // Game entities
    private enemies: Enemy[] = [];
    private towers: Tower[] = [];
    private towerGrid: Map<string, Tower> = new Map();

    // Resources
    private lives: number;
    private nextEnemyId = 0;
    private nextTowerId = 0;

    // Logs
    readonly eventLog: EventLog;
    readonly commandLog: CommandLog;

    // Config
    private readonly startingLives = 20;

    constructor(runSeed: number, definitions: GameDefinitions, mapID: string = 'default') {
        this.runSeed = runSeed;
        this.definitions = definitions;

        // Initialize systems
        this.rng = new SeededRNG(runSeed);
        this.clock = new SimulationClock();
        this.waveSystem = new WaveSystem(definitions.waves, definitions.enemies, this.rng);

        const mapDef = definitions.maps.map(mapID);
        if (!mapDef) throw new Error(`Map ${mapID} not found`);
        this.combatSystem = new CombatSystem(mapDef);
        this.economySystem = new EconomySystem(200);

        // Initialize state
        this.state = { type: 'building', waveIndex: 0 };
        this.lives = this.startingLives;

        // Initialize logs
        this.eventLog = new EventLog();
        this.commandLog = new CommandLog();

        // Emit initial state
        this.eventLog.emit({
            type: 'coinChanged',
            newTotal: this.economySystem.coins,
            delta: 200,
            reason: 'game_start',
            tick: 0,
        });
    }

    get currentTick(): number {
        return this.clock.currentTick;
    }

    get currentState(): RunState {
        return this.state;
    }

    get currentCoins(): number {
        return this.economySystem.coins;
    }

    get currentLives(): number {
        return this.lives;
    }

    /**
     * Main simulation tick - advances game by one fixed timestep
     */
    tick(): void {
        const tick = this.clock.currentTick;

        // Check wave spawns
        if (this.state.type === 'inWave') {
            const spawns = this.waveSystem.checkSpawns(tick);
            for (const [typeID, enemyDef] of spawns) {
                const enemyId = this.nextEnemyId++;
                const enemy = new Enemy(enemyId, typeID, enemyDef);
                this.enemies.push(enemy);
                this.eventLog.emit({
                    type: 'enemySpawned',
                    id: enemyId,
                    enemyType: typeID,
                    pathProgress: 0.0,
                    tick,
                });
            }
        }

        // Tower firing
        for (const tower of this.towers) {
            tower.incrementTick();

            if (tower.canFire()) {
                const target = this.combatSystem.findTarget(tower, this.enemies);
                if (target) {
                    const result = this.combatSystem.executeAttack(tower, target);

                    this.eventLog.emit({
                        type: 'towerFired',
                        damage: result.damage,
                        tick,
                    });

                    this.eventLog.emit({
                        type: 'enemyDamaged',
                        damage: result.damage,
                        remainingHP: result.targetRemainingHP,
                        tick,
                    });

                    if (result.slowApplied) {
                        this.eventLog.emit({
                            type: 'enemySlowed',
                            slowAmount: tower.slowOnHit,
                            durationTicks: 60,
                            tick,
                        });
                    }

                    if (result.targetDied) {
                        const coinReward = target.baseDef.coinReward;
                        this.economySystem.addCoins(coinReward, 'enemy_kill');
                        this.eventLog.emit({
                            type: 'enemyDied',
                            id: target.instanceId,
                            coinReward,
                            tick,
                        });
                        this.eventLog.emit({
                            type: 'coinChanged',
                            newTotal: this.economySystem.coins,
                            delta: coinReward,
                            reason: 'enemy_kill',
                            tick,
                        });
                    }
                }
            }
        }

        // Move enemies
        const progressPerTick = 1.0 / SimulationClock.TICKS_PER_SECOND;
        for (const enemy of this.enemies) {
            if (enemy.isAlive) {
                const moveAmount = enemy.effectiveSpeed * progressPerTick;
                enemy.move(moveAmount);
                enemy.tickSlow();

                if (enemy.hasReachedEnd) {
                    const livesCost = enemy.baseDef.livesCost;
                    this.lives -= livesCost;
                    this.eventLog.emit({
                        type: 'enemyLeaked',
                        id: enemy.instanceId,
                        livesCost,
                        tick,
                    });
                    this.eventLog.emit({
                        type: 'livesChanged',
                        newTotal: this.lives,
                        delta: -livesCost,
                        tick,
                    });

                    if (this.lives <= 0) {
                        this.state = { type: 'defeat', wavesCompleted: this.waveSystem.currentWave };
                        this.eventLog.emit({
                            type: 'gameOver',
                            wavesCompleted: this.waveSystem.currentWave,
                            tick,
                        });
                    }
                }
            }
        }

        // Clean up dead/leaked enemies
        this.enemies = this.enemies.filter(e => e.isAlive && !e.hasReachedEnd);

        // Check wave completion
        if (this.state.type === 'inWave') {
            if (this.waveSystem.isWaveSpawningComplete() && this.enemies.length === 0) {
                const waveIndex = this.state.waveIndex;
                const waveDef = this.definitions.waves.wave(waveIndex);

                if (waveDef) {
                    this.economySystem.addCoins(waveDef.coinReward, 'wave_complete');
                    this.eventLog.emit({
                        type: 'waveCompleted',
                        index: waveIndex,
                        reward: waveDef.coinReward,
                        tick,
                    });
                    this.eventLog.emit({
                        type: 'coinChanged',
                        newTotal: this.economySystem.coins,
                        delta: waveDef.coinReward,
                        reason: 'wave_complete',
                        tick,
                    });
                }

                const nextWaveIndex = waveIndex + 1;

                // Check victory
                if (nextWaveIndex >= this.waveSystem.totalWaves) {
                    this.state = { type: 'victory', wavesCompleted: nextWaveIndex };
                    this.eventLog.emit({
                        type: 'runCompleted',
                        wavesCompleted: nextWaveIndex,
                        totalCoins: this.economySystem.totalCoinsEarned,
                        tick,
                    });
                } else {
                    // Continue to next wave
                    this.state = { type: 'building', waveIndex: nextWaveIndex };
                }
            }
        }

        this.clock.step();
    }

    /**
     * Process player command
     */
    processCommand(command: GameCommand): void {
        this.commandLog.append(command);

        switch (command.type) {
            case 'placeTower':
                this.placeTower(command.towerType, command.gridX, command.gridY);
                break;
            case 'sellTower':
                this.sellTower(command.gridX, command.gridY);
                break;
            case 'startWave':
                this.startWave();
                break;
            case 'chooseRelic':
                this.chooseRelic(command.index);
                break;
            case 'upgradeTower':
                // TODO: implement upgrades
                break;
        }
    }

    // MARK: - Private Implementation

    private placeTower(type: string, gridX: number, gridY: number): void {
        if (this.state.type !== 'building') return;

        const position = new GridPosition(gridX, gridY);
        const posKey = position.hashCode();

        // Check if spot is occupied
        if (this.towerGrid.has(posKey)) return;

        const towerDef = this.definitions.towers.tower(type);
        if (!towerDef) return;

        // Check affordability
        if (!this.economySystem.canAfford(towerDef.cost)) return;

        // Place tower
        this.economySystem.spendCoins(towerDef.cost);
        const towerId = this.nextTowerId++;
        const tower = new Tower(towerId, type, position, towerDef);

        this.towers.push(tower);
        this.towerGrid.set(posKey, tower);

        this.eventLog.emit({
            type: 'towerPlaced',
            id: towerId,
            towerType: type,
            gridX,
            gridY,
            tick: this.currentTick,
        });

        this.eventLog.emit({
            type: 'coinChanged',
            newTotal: this.economySystem.coins,
            delta: -towerDef.cost,
            reason: 'tower_purchase',
            tick: this.currentTick,
        });
    }

    private sellTower(gridX: number, gridY: number): void {
        if (this.state.type !== 'building') return;

        const position = new GridPosition(gridX, gridY);
        const posKey = position.hashCode();
        const tower = this.towerGrid.get(posKey);

        if (!tower) return;

        const refund = Math.floor(tower.baseDef.cost * 0.7);
        this.economySystem.addCoins(refund, 'tower_sell');

        this.towers = this.towers.filter(t => t.instanceId !== tower.instanceId);
        this.towerGrid.delete(posKey);

        this.eventLog.emit({
            type: 'towerSold',
            id: tower.instanceId,
            refund,
            tick: this.currentTick,
        });

        this.eventLog.emit({
            type: 'coinChanged',
            newTotal: this.economySystem.coins,
            delta: refund,
            reason: 'tower_sell',
            tick: this.currentTick,
        });
    }

    private startWave(): void {
        if (this.state.type !== 'building') return;

        const waveIndex = this.state.waveIndex;
        const waveDef = this.waveSystem.startWave(this.currentTick);

        if (waveDef) {
            this.state = { type: 'inWave', waveIndex };
            this.eventLog.emit({
                type: 'waveStarted',
                index: waveIndex,
                enemyCount: waveDef.spawns.length,
                tick: this.currentTick,
            });
        }
    }

    private chooseRelic(index: number): void {
        // TODO: Implement relic selection
        console.log(`Choose relic ${index}`);
    }
}
