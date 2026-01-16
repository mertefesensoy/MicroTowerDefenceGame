// GameState.ts
// Main game state - pure TypeScript, deterministic, testable

import { EventLog, GameEvent } from './GameEvent';
import { CommandLog, GameCommand } from './GameCommand';
import { SeededRNG } from './SeededRNG';
import { SimulationClock } from './SimulationClock';

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

    // Systems
    private readonly rng: SeededRNG;
    private readonly clock: SimulationClock;

    // State machine
    private state: RunState;

    // Resources
    private coins: number;
    private lives: number;

    // Logs
    readonly eventLog: EventLog;
    readonly commandLog: CommandLog;

    // Config
    private readonly startingCoins = 100;
    private readonly startingLives = 20;

    constructor(runSeed: number) {
        this.runSeed = runSeed;

        // Initialize systems
        this.rng = new SeededRNG(runSeed);
        this.clock = new SimulationClock();

        // Initialize state
        this.state = { type: 'building', waveIndex: 0 };
        this.coins = this.startingCoins;
        this.lives = this.startingLives;

        // Initialize logs
        this.eventLog = new EventLog();
        this.commandLog = new CommandLog();

        // Emit initial state
        this.eventLog.emit({
            type: 'coinChanged',
            newTotal: this.coins,
            delta: this.startingCoins,
            reason: 'game_start',
            tick: 0,
        });
    }

    /**
     * Get current tick
     */
    get currentTick(): number {
        return this.clock.currentTick;
    }

    /**
     * Get current state
     */
    get currentState(): RunState {
        return this.state;
    }

    /**
     * Get current coins
     */
    get currentCoins(): number {
        return this.coins;
    }

    /**
     * Get current lives
     */
    get currentLives(): number {
        return this.lives;
    }

    /**
     * Main simulation tick - advances game by one fixed timestep
     */
    tick(): void {
        const tick = this.clock.currentTick;

        // TODO: Implement game logic
        // - Wave spawns
        // - Tower firing
        // - Enemy movement
        // - Combat resolution
        // - Wave completion checks

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
        // TODO: Implement tower placement
        console.log(`Place tower ${type} at (${gridX}, ${gridY})`);
    }

    private sellTower(gridX: number, gridY: number): void {
        // TODO: Implement tower selling
        console.log(`Sell tower at (${gridX}, ${gridY})`);
    }

    private startWave(): void {
        // TODO: Implement wave starting
        if (this.state.type === 'building') {
            const waveIndex = this.state.waveIndex;
            this.state = { type: 'inWave', waveIndex };
            this.eventLog.emit({
                type: 'waveStarted',
                index: waveIndex,
                enemyCount: 10, // TODO: Get from wave definition
                tick: this.currentTick,
            });
        }
    }

    private chooseRelic(index: number): void {
        // TODO: Implement relic selection
        console.log(`Choose relic ${index}`);
    }
}
