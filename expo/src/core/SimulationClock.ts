// SimulationClock.ts
// Fixed timestep simulation clock for deterministic gameplay

/**
 * Simulation clock that tracks game ticks
 * Fixed at 60 ticks per second for deterministic behavior
 */
export class SimulationClock {
    static readonly TICKS_PER_SECOND = 60;
    static readonly TICK_DURATION_MS = 1000 / SimulationClock.TICKS_PER_SECOND;

    private currentTickValue = 0;

    /**
     * Get current tick (read-only)
     */
    get currentTick(): number {
        return this.currentTickValue;
    }

    /**
     * Advance clock by one tick
     */
    step(): void {
        this.currentTickValue++;
    }

    /**
     * Reset clock to tick 0
     */
    reset(): void {
        this.currentTickValue = 0;
    }

    /**
     * Convert ticks to seconds
     */
    static ticksToSeconds(ticks: number): number {
        return ticks / SimulationClock.TICKS_PER_SECOND;
    }

    /**
     * Convert seconds to ticks
     */
    static secondsToTicks(seconds: number): number {
        return Math.floor(seconds * SimulationClock.TICKS_PER_SECOND);
    }
}
