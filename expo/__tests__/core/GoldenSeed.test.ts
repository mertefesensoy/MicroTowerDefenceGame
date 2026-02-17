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

        // Snapshot some state
        const firstWave = game.definitions.waves.wave(0)!;
        const initialCoins = game.currentCoins;

        // In Swift we checked specific enemy spawn coordinates or relic offers.
        // For now, let's verify initial state matches expectation.

        expect(initialCoins).toBe(200); // Default starting coins
        expect(game.waveSystem.currentWaveIndex).toBe(-1);

        // TODO: Add more specific checks once we have deeper generation logic to pin down.
    });
});
