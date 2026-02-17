import { GameState } from '../../src/core';
import { createDefaultDefinitions } from '../../src/core/definitions/GameDefinitions';

describe('Victory', () => {
    it('should detect victory when all waves cleared', () => {
        const game = new GameState(111, createDefaultDefinitions());

        // Set state to last wave, active
        const lastWaveIdx = game.definitions.waves.totalWaves - 1;
        (game as any).stateMachine.transition({ type: 'inWave', waveIndex: lastWaveIdx });

        // Manually trigger wave completion which checks victory
        (game as any).onWaveCompleted(game.currentTick);

        expect(game.currentState.type).toBe('gameOver');
        if (game.currentState.type === 'gameOver') {
            expect(game.currentState.didWin).toBe(true);
        }
    });

    it('should detect defeat when lives reach 0', () => {
        const game = new GameState(222, createDefaultDefinitions());

        // Ensure state allows gameplay (inWave)
        game.processCommand({ type: 'startWave', tick: 0 });

        // Decrease lives directly to 1 (not 0, as we need the trigger to kill it)
        (game as any).lives = 1;

        // Runner is fast (speed 2). Path length is 1.0. 
        // Cross time = 0.5s = 30 ticks.
        // We tick 60 times to be sure it leaks.
        for (let i = 0; i < 60; i++) {
            game.tick();
            if (game.currentState.type === 'gameOver') break;
        }

        expect(game.currentState.type).toBe('gameOver');
        if (game.currentState.type === 'gameOver') {
            expect(game.currentState.didWin).toBe(false);
        }
    });
});
