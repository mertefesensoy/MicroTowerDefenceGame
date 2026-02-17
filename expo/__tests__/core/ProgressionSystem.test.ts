import { ProgressionSystem } from '../../src/core/systems/ProgressionSystem';
import { ProgressionRules, RunSummary, createDefaultProfile } from '../../src/core/definitions/ProgressionTypes';

describe('ProgressionSystem', () => {
    let system: ProgressionSystem;
    let rules: ProgressionRules;

    beforeEach(() => {
        rules = new ProgressionRules();
        system = new ProgressionSystem(rules);
    });

    it('should calculate XP correctly from run summary', () => {
        const summary: RunSummary = {
            runSeed: 123,
            didWin: true,
            wavesCleared: 10,
            enemiesDefeated: 50,
            totalCoinsEarned: 1000,
            relicsCollected: 5,
            ticksSurvived: 1000
        };

        // 10 * 20 (waves) + 50 * 2 (enemies) + 5 * 10 (relics) + 100 (win) = 200 + 100 + 50 + 100 = 450
        const xp = rules.calculateXP(summary);
        expect(xp).toBe(450);
    });

    it('should level up and grant unlocks', () => {
        const profile = createDefaultProfile(); // XP 0, Level 1
        const summary: RunSummary = {
            runSeed: 123,
            didWin: false,
            wavesCleared: 10,
            enemiesDefeated: 0,
            totalCoinsEarned: 0,
            relicsCollected: 0,
            ticksSurvived: 0
        };

        // 200 XP from waves. Level 1->2 needs 100.
        // So should reach Level 2 with 100 XP remainder? No, cumulative.
        // Level 2 starts at 100 XP. Profile XP will be 200.
        // Level 3 starts at 250 XP. So Level 2.

        const events = system.applyRun(summary, profile);

        expect(profile.level).toBe(2);
        expect(profile.xp).toBe(200);

        const levelUpEvent = events.find(e => e.type === 'leveledUp');
        expect(levelUpEvent).toBeDefined();
        if (levelUpEvent?.type === 'leveledUp') {
            expect(levelUpEvent.newLevel).toBe(2);
        }

        const unlockEvent = events.find(e => e.type === 'unlocked');
        expect(unlockEvent).toBeDefined(); // Level 2 has unlocks
    });
});
