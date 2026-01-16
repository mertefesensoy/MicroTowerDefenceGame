// GameEvent.ts
// Events emitted by Core simulation for rendering layer

/**
 * Events emitted by simulation for rendering/UI consumption
 * These drive all visual updates - rendering layer must NOT have game logic
 */
export type GameEvent =
    // LIFECYCLE events (include Int IDs for rendering)
    | { type: 'enemySpawned'; id: number; enemyType: string; pathProgress: number; tick: number }
    | { type: 'enemyDied'; id: number; coinReward: number; tick: number }
    | { type: 'enemyLeaked'; id: number; livesCost: number; tick: number }
    | { type: 'towerPlaced'; id: number; towerType: string; gridX: number; gridY: number; tick: number }
    | { type: 'towerSold'; id: number; refund: number; tick: number }

    // COSMETIC events (NO IDs - keeps golden tests stable)
    | { type: 'enemyMoved'; pathProgress: number; tick: number }
    | { type: 'enemyDamaged'; damage: number; remainingHP: number; tick: number }
    | { type: 'enemySlowed'; slowAmount: number; durationTicks: number; tick: number }
    | { type: 'towerFired'; damage: number; tick: number }

    // Economy events (NO IDs)
    | { type: 'coinChanged'; newTotal: number; delta: number; reason: string; tick: number }
    | { type: 'livesChanged'; newTotal: number; delta: number; tick: number }

    // Wave events
    | { type: 'waveStarted'; index: number; enemyCount: number; tick: number }
    | { type: 'waveCompleted'; index: number; reward: number; tick: number }

    // Relic events
    | { type: 'relicOffered'; choices: string[]; tick: number }
    | { type: 'relicChosen'; relicID: string; tick: number }

    // Game state events
    | { type: 'gameOver'; wavesCompleted: number; tick: number }
    | { type: 'runCompleted'; wavesCompleted: number; totalCoins: number; tick: number };

/**
 * Event log for rendering consumption and debugging
 */
export class EventLog {
    private events: GameEvent[] = [];

    emit(event: GameEvent): void {
        this.events.push(event);
    }

    /**
     * Get events from a specific index onward (for rendering consumption)
     * Use with lastEventIndex tracking: read slice(from: lastIndex), then update lastIndex = events.length
     */
    slice(from: number): GameEvent[] {
        if (from < 0 || from > this.events.length) {
            return [];
        }
        return this.events.slice(from);
    }

    /**
     * Get all events
     */
    getAll(): readonly GameEvent[] {
        return this.events;
    }

    /**
     * Clear all events (for resetting)
     */
    clear(): void {
        this.events = [];
    }
}
