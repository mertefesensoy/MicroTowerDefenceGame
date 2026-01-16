// __tests__/core/GameState.test.ts
import { GameState } from '../../src/core';

describe('GameState', () => {
    it('should initialize with correct starting values', () => {
        const game = new GameState(12345);

        expect(game.currentTick).toBe(0);
        expect(game.currentCoins).toBe(100);
        expect(game.currentLives).toBe(20);
        expect(game.currentState.type).toBe('building');
    });

    it('should emit initial coin event', () => {
        const game = new GameState(12345);
        const events = game.eventLog.getAll();

        expect(events.length).toBe(1);
        expect(events[0].type).toBe('coinChanged');
        if (events[0].type === 'coinChanged') {
            expect(events[0].newTotal).toBe(100);
            expect(events[0].reason).toBe('game_start');
        }
    });

    it('should advance tick when tick() is called', () => {
        const game = new GameState(12345);

        expect(game.currentTick).toBe(0);
        game.tick();
        expect(game.currentTick).toBe(1);
        game.tick();
        expect(game.currentTick).toBe(2);
    });

    it('should produce deterministic results with same seed', () => {
        const game1 = new GameState(12345);
        const game2 = new GameState(12345);

        for (let i = 0; i < 10; i++) {
            game1.tick();
            game2.tick();
        }

        expect(game1.currentTick).toBe(game2.currentTick);
        expect(game1.currentCoins).toBe(game2.currentCoins);
        expect(game1.currentLives).toBe(game2.currentLives);
    });

    it('should start wave when startWave command is processed', () => {
        const game = new GameState(12345);

        game.processCommand({ type: 'startWave', tick: 0 });

        expect(game.currentState.type).toBe('inWave');
        const events = game.eventLog.getAll();
        const waveStarted = events.find(e => e.type === 'waveStarted');
        expect(waveStarted).toBeDefined();
    });
});
