// GameState.ts
// Main game state - pure TypeScript, deterministic, testable
// Ported from MicroTDCore/Systems/GameState.swift

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
import { RelicSystem } from './systems/RelicSystem';
import { RelicDatabase } from './definitions/RelicDatabase';
import { RunStateMachine, type RunState } from './systems/RunStateMachine';
import type { RenderSnapshot, RenderEnemy, RenderTower } from './systems/RenderSnapshot';
import type { RunSummary } from './definitions/ProgressionTypes';
import type { GameDefinitions } from './definitions/GameDefinitions';
import type { RelicDef } from './definitions/RelicDef';
import { isValidPlacement } from './definitions/MapDef';

// Re-export RunState for consumers
export type { RunState };

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
    private readonly relicSystem: RelicSystem;
    private readonly stateMachine: RunStateMachine;

    // Game entities
    private enemies: Enemy[] = [];
    private towers: Tower[] = [];
    private towerGrid: Map<string, Tower> = new Map();

    // Resources
    private lives: number;
    private nextEnemyId = 0;
    private nextTowerId = 0;
    private enemiesDefeated = 0;
    private relicsCollected = 0;

    // Logs
    readonly eventLog: EventLog;
    readonly commandLog: CommandLog;

    // Config
    private readonly startingLives = 20;
    private readonly startingCoins = 200;
    private readonly relicOfferInterval = 2;  // offer relics every N waves
    private readonly relicOfferCount = 3;     // how many choices per offer

    // Current relic offer (if any)
    private currentRelicOffer: RelicDef[] | null = null;

    // Map reference
    private readonly mapID: string;

    constructor(runSeed: number, definitions: GameDefinitions, mapID: string = 'default') {
        this.runSeed = runSeed;
        this.definitions = definitions;
        this.mapID = mapID;

        // Initialize systems
        this.rng = new SeededRNG(runSeed);
        this.clock = new SimulationClock();
        this.waveSystem = new WaveSystem(definitions.waves, definitions.enemies, this.rng);

        const mapDef = definitions.maps.map(mapID);
        if (!mapDef) throw new Error(`Map ${mapID} not found`);
        this.combatSystem = new CombatSystem(mapDef);

        const relicDB = new RelicDatabase(definitions.relics);
        this.relicSystem = new RelicSystem(relicDB, this.rng);

        // Apply starting coins bonus from any relics (for future use)
        const totalStartingCoins = this.startingCoins + this.relicSystem.combinedStartingCoins;
        this.economySystem = new EconomySystem(totalStartingCoins);

        // Initialize state machine
        this.stateMachine = new RunStateMachine();
        this.stateMachine.startRun();  // preRun → building(0)

        this.lives = this.startingLives;

        // Initialize logs
        this.eventLog = new EventLog();
        this.commandLog = new CommandLog();

        // Emit initial state
        this.eventLog.emit({
            type: 'coinChanged',
            newTotal: this.economySystem.coins,
            delta: totalStartingCoins,
            reason: 'game_start',
            tick: 0,
        });
    }

    // ─── Public Accessors ───

    get currentTick(): number {
        return this.clock.currentTick;
    }

    get currentState(): RunState {
        return this.stateMachine.state;
    }

    get currentCoins(): number {
        return this.economySystem.coins;
    }

    get currentLives(): number {
        return this.lives;
    }

    get currentWave(): number {
        const s = this.stateMachine.state;
        if (s.type === 'building' || s.type === 'inWave' || s.type === 'relicChoice') {
            return s.waveIndex;
        }
        return 0;
    }

    get currentRelicChoices(): RelicDef[] | null {
        return this.currentRelicOffer;
    }

    /**
     * Get all towers for rendering
     */
    getTowers(): readonly Tower[] {
        return this.towers;
    }

    /**
     * Get all enemies for rendering
     */
    getEnemies(): readonly Enemy[] {
        return this.enemies;
    }

    /**
     * Create a run summary for the progression system
     */
    makeRunSummary(): RunSummary {
        const state = this.stateMachine.state;
        const wavesCleared = (state.type === 'gameOver' || state.type === 'postRunSummary')
            ? state.wavesCompleted : this.currentWave;

        return {
            runSeed: this.runSeed,
            didWin: state.type === 'gameOver' ? state.didWin :
                state.type === 'postRunSummary' ? state.didWin : false,
            wavesCleared,
            enemiesDefeated: this.enemiesDefeated,
            totalCoinsEarned: this.economySystem.totalCoinsEarned,
            relicsCollected: this.relicsCollected,
            ticksSurvived: this.clock.currentTick,
        };
    }

    /**
     * Create a render snapshot (clean DTO for rendering layer)
     */
    makeRenderSnapshot(): RenderSnapshot {
        const renderEnemies: RenderEnemy[] = this.enemies.map(e => ({
            id: e.instanceId,
            typeID: e.typeID,
            pathProgress: e.pathProgress,
            hpFraction: e.currentHP / e.baseDef.hp,
            isBoss: e.baseDef.isBoss,
            isSlowed: e.slowEffect !== null,
        }));

        const renderTowers: RenderTower[] = this.towers.map(t => ({
            id: t.instanceId,
            typeID: t.typeID,
            gridPosition: t.position,
            kills: t.kills,
            totalDamage: t.totalDamage,
        }));

        return {
            tick: this.clock.currentTick,
            enemies: renderEnemies,
            towers: renderTowers,
            coins: this.economySystem.coins,
            lives: this.lives,
            currentWave: this.currentWave,
            totalWaves: this.waveSystem.totalWaves,
            stateType: this.stateMachine.state.type,
        };
    }

    // ─── Main Simulation ───

    /**
     * Main simulation tick - advances game by one fixed timestep
     */
    tick(): void {
        const tick = this.clock.currentTick;
        const state = this.stateMachine.state;

        // Only process simulation during active wave
        if (state.type === 'inWave') {
            this.processWaveTick(tick);
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

    // ─── Private: Simulation ───

    private processWaveTick(tick: number): void {
        // Spawn enemies
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
                        this.enemiesDefeated++;
                        // Apply coin multiplier from relics
                        const baseCoinReward = target.baseDef.coinReward;
                        const coinReward = Math.floor(baseCoinReward * this.relicSystem.combinedCoinMultiplier);
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
                        this.stateMachine.transition({
                            type: 'gameOver',
                            wavesCompleted: this.waveSystem.currentWave,
                            didWin: false,
                        });
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
        if (this.stateMachine.state.type === 'inWave') {
            if (this.waveSystem.isWaveSpawningComplete() && this.enemies.length === 0) {
                this.onWaveCompleted(tick);
            }
        }
    }

    private onWaveCompleted(tick: number): void {
        const state = this.stateMachine.state;
        if (state.type !== 'inWave') return;

        const waveIndex = state.waveIndex;
        const waveDef = this.definitions.waves.wave(waveIndex);

        // Award wave completion reward
        if (waveDef) {
            const coinReward = Math.floor(waveDef.coinReward * this.relicSystem.combinedCoinMultiplier);
            this.economySystem.addCoins(coinReward, 'wave_complete');
            this.eventLog.emit({
                type: 'waveCompleted',
                index: waveIndex,
                reward: coinReward,
                tick,
            });
            this.eventLog.emit({
                type: 'coinChanged',
                newTotal: this.economySystem.coins,
                delta: coinReward,
                reason: 'wave_complete',
                tick,
            });
        }

        const nextWaveIndex = waveIndex + 1;

        // Check victory
        if (nextWaveIndex >= this.waveSystem.totalWaves) {
            this.stateMachine.transition({
                type: 'gameOver',
                wavesCompleted: nextWaveIndex,
                didWin: true,
            });
            this.eventLog.emit({
                type: 'runCompleted',
                wavesCompleted: nextWaveIndex,
                totalCoins: this.economySystem.totalCoinsEarned,
                tick,
            });
            return;
        }

        // Check if we should offer relics (every relicOfferInterval waves, starting from wave 1)
        const completedWaveNumber = waveIndex + 1;  // 1-based
        if (completedWaveNumber % this.relicOfferInterval === 0) {
            // Offer relics
            this.currentRelicOffer = this.relicSystem.generateChoices(this.relicOfferCount);
            if (this.currentRelicOffer.length > 0) {
                this.stateMachine.transition({ type: 'relicChoice', waveIndex: nextWaveIndex });
                this.eventLog.emit({
                    type: 'relicOffered',
                    choices: this.currentRelicOffer.map(r => r.id),
                    tick,
                });
                return;
            }
        }

        // No relic offer — go straight to building phase
        this.stateMachine.transition({ type: 'building', waveIndex: nextWaveIndex });
    }

    // ─── Private: Commands ───

    private placeTower(type: string, gridX: number, gridY: number): void {
        if (this.stateMachine.state.type !== 'building') return;

        const position = new GridPosition(gridX, gridY);
        const posKey = position.hashCode();

        // Check if spot is occupied
        if (this.towerGrid.has(posKey)) return;

        // Check map validity (path tiles, blocked tiles, bounds)
        const mapDef = this.definitions.maps.map(this.mapID)!;
        if (!isValidPlacement(mapDef, position)) return;

        const towerDef = this.definitions.towers.tower(type);
        if (!towerDef) return;

        // Check affordability
        if (!this.economySystem.canAfford(towerDef.cost)) return;

        // Place tower
        this.economySystem.spendCoins(towerDef.cost);
        const towerId = this.nextTowerId++;
        const tower = new Tower(towerId, type, position, towerDef);

        // Apply relic modifiers to new tower
        tower.damageMultiplier = this.relicSystem.combinedDamageMultiplier;
        tower.rangeMultiplier = this.relicSystem.combinedRangeMultiplier;
        tower.fireRateMultiplier = this.relicSystem.combinedFireRateMultiplier;
        tower.slowOnHit = this.relicSystem.combinedSlowOnHit;

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
        if (this.stateMachine.state.type !== 'building') return;

        const position = new GridPosition(gridX, gridY);
        const posKey = position.hashCode();
        const tower = this.towerGrid.get(posKey);

        if (!tower) return;

        // Swift uses cost / 2 (50% refund)
        const refund = Math.floor(tower.baseDef.cost / 2);
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
        if (this.stateMachine.state.type !== 'building') return;

        const waveIndex = this.stateMachine.state.waveIndex;
        const waveDef = this.waveSystem.startWave(this.currentTick);

        if (waveDef) {
            this.stateMachine.transition({ type: 'inWave', waveIndex });
            this.eventLog.emit({
                type: 'waveStarted',
                index: waveIndex,
                enemyCount: waveDef.spawns.length,
                tick: this.currentTick,
            });
        }
    }

    private chooseRelic(index: number): void {
        if (this.stateMachine.state.type !== 'relicChoice') return;
        if (!this.currentRelicOffer) return;
        if (index < 0 || index >= this.currentRelicOffer.length) return;

        const chosenRelic = this.currentRelicOffer[index];
        this.relicSystem.chooseRelic(chosenRelic.id);
        this.relicsCollected++;

        this.eventLog.emit({
            type: 'relicChosen',
            relicID: chosenRelic.id,
            tick: this.currentTick,
        });

        // Update all existing towers with new relic modifiers
        for (const tower of this.towers) {
            tower.damageMultiplier = this.relicSystem.combinedDamageMultiplier;
            tower.rangeMultiplier = this.relicSystem.combinedRangeMultiplier;
            tower.fireRateMultiplier = this.relicSystem.combinedFireRateMultiplier;
            tower.slowOnHit = this.relicSystem.combinedSlowOnHit;
        }

        // Clear offer and transition to building
        const nextWaveIndex = this.stateMachine.state.waveIndex;
        this.currentRelicOffer = null;
        this.stateMachine.transition({ type: 'building', waveIndex: nextWaveIndex });
    }
}
