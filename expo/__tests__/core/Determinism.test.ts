import { GameState } from '../../src/core';
import { createDefaultDefinitions } from '../../src/core/definitions/GameDefinitions';

describe('Determinism', () => {
    it('should produce identical outcomes for identical seeds actions', () => {
        const seed = 54321;
        const defs = createDefaultDefinitions();

        const game1 = new GameState(seed, defs);
        const game2 = new GameState(seed, defs);

        // Simulate 100 ticks
        for (let i = 0; i < 100; i++) {
            game1.tick();
            game2.tick();
        }

        expect(game1.currentTick).toBe(game2.currentTick);
        expect(game1.currentCoins).toBe(game2.currentCoins);
        expect((game1 as any).enemiesDefeated).toBe((game2 as any).enemiesDefeated);

        // Check random state
        expect((game1 as any).rng.nextFloat(0, 1)).toBe((game2 as any).rng.nextFloat(0, 1));
    });
});
