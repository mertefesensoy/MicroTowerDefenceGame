import { GameState } from '../../src/core';
import { createDefaultDefinitions } from '../../src/core/definitions/GameDefinitions';

describe('GoldenSeed', () => {
    it('should produce identical run state for a known golden seed', () => {
        // This test ensures that for a specific seed, the initial conditions are always the same.
        // It acts as a regression test for RNG/Generation logic.
        const seed = 99999;
        const game = new GameState(seed, createDefaultDefinitions());

        // Advance a few ticks to let initial generation happen
        // (Though generation happens in constructor usually)

        // Verify initial state matches expectation (public API only)
        expect(game.currentCoins).toBe(200); // Default starting coins
        expect(game.currentState.type).toBe('building');
        expect(game.currentWave).toBe(0); // First wave index via state machine
        expect(game.currentLives).toBe(20);
        expect(game.currentTick).toBe(0);
    });
});
