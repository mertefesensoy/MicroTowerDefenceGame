import { RunManager } from '../../src/persistence/RunManager';
import { ProfileStoreInterface } from '../../src/persistence/ProfileStore';
import { ProgressionRules, createDefaultProfile, RunSummary, LastRunMetadata, ProgressionProfile } from '../../src/core/definitions/ProgressionTypes';

class MockProfileStore implements ProfileStoreInterface {
    profile = createDefaultProfile();
    lastRun: LastRunMetadata | null = null;

    async load(rules: ProgressionRules) {
        return { profile: { ...this.profile }, lastRun: this.lastRun };
    }

    async save(profile: ProgressionProfile, lastRun: LastRunMetadata | null) {
        this.profile = { ...profile };
        this.lastRun = lastRun;
    }

    async reset() {
        this.profile = createDefaultProfile();
        this.lastRun = null;
    }
}

describe('RunManager', () => {
    let manager: RunManager;
    let store: MockProfileStore;

    beforeEach(async () => {
        store = new MockProfileStore();
        manager = await RunManager.make(store, new ProgressionRules());
    });

    it('should be idempotent (ignore duplicate run seeds)', async () => {
        const summary: RunSummary = {
            runSeed: 999,
            didWin: false,
            wavesCleared: 1,
            enemiesDefeated: 0,
            totalCoinsEarned: 0,
            relicsCollected: 0,
            ticksSurvived: 0
        };

        const events1 = await manager.applyRun(summary);
        expect(events1.length).toBeGreaterThan(0); // Should gain XP

        const events2 = await manager.applyRun(summary);
        expect(events2.length).toBe(0); // Should be ignored
    });

    it('should persist changes to store', async () => {
        const summary: RunSummary = {
            runSeed: 888,
            didWin: true,
            wavesCleared: 5,
            enemiesDefeated: 10,
            totalCoinsEarned: 100,
            relicsCollected: 0,
            ticksSurvived: 100
        };

        await manager.applyRun(summary);

        expect(store.lastRun?.runSeed).toBe(888);
        expect(store.profile.xp).toBeGreaterThan(0);
    });
});
