// RunStateMachine.ts
// Game state lifecycle — ported from MicroTDCore/Systems/RunStateMachine.swift

/**
 * All possible run states
 */
export type RunStateType = 'preRun' | 'building' | 'inWave' | 'relicChoice' | 'gameOver' | 'postRunSummary';

/**
 * Run state with associated data
 */
export type RunState =
    | { type: 'preRun' }
    | { type: 'building'; waveIndex: number }
    | { type: 'inWave'; waveIndex: number }
    | { type: 'relicChoice'; waveIndex: number }
    | { type: 'gameOver'; wavesCompleted: number; didWin: boolean }
    | { type: 'postRunSummary'; wavesCompleted: number; didWin: boolean };

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<RunStateType, RunStateType[]> = {
    preRun: ['building'],
    building: ['inWave'],
    inWave: ['building', 'relicChoice', 'gameOver'],
    relicChoice: ['building'],
    gameOver: ['postRunSummary'],
    postRunSummary: ['preRun'],
};

/**
 * Manages the lifecycle state of a game run.
 * Enforces valid transitions and prevents invalid state changes.
 */
export class RunStateMachine {
    private _state: RunState;

    constructor() {
        this._state = { type: 'preRun' };
    }

    get state(): RunState {
        return this._state;
    }

    /**
     * Transition to a new state.
     * Throws if the transition is not valid from the current state.
     */
    transition(to: RunState): void {
        const validTargets = VALID_TRANSITIONS[this._state.type];
        if (!validTargets.includes(to.type)) {
            throw new Error(
                `Invalid state transition: ${this._state.type} → ${to.type}. ` +
                `Valid transitions from ${this._state.type}: ${validTargets.join(', ')}`
            );
        }
        this._state = to;
    }

    /**
     * Check if a transition is valid without performing it
     */
    canTransition(to: RunStateType): boolean {
        return VALID_TRANSITIONS[this._state.type].includes(to);
    }

    /**
     * Convenience: start the run (preRun → building)
     */
    startRun(): void {
        this.transition({ type: 'building', waveIndex: 0 });
    }
}
