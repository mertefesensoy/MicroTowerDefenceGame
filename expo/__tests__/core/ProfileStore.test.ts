import { AsyncStorageProfileStore } from '../../src/persistence/ProfileStore';
import { ProgressionRules, createDefaultProfile, RunSummary } from '../../src/core/definitions/ProgressionTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('ProfileStore', () => {
    let store: AsyncStorageProfileStore;
    let rules: ProgressionRules;

    beforeEach(() => {
        store = new AsyncStorageProfileStore('throwError');
        rules = new ProgressionRules();
        jest.clearAllMocks();
    });

    it('should return default profile if no save exists', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const { profile } = await store.load(rules);
        expect(profile.level).toBe(1);
        expect(profile.xp).toBe(0);
    });

    it('should save and load profile', async () => {
        const profile = createDefaultProfile();
        profile.xp = 500;
        profile.level = 3;
        profile.unlocks.add('relic_uncommon_pack');

        await store.save(profile, null);

        expect(AsyncStorage.setItem).toHaveBeenCalled();
        const storedJson = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedJson);
        const loaded = await store.load(rules);

        expect(loaded.profile.xp).toBe(500);
        expect(loaded.profile.level).toBe(3);
        expect(loaded.profile.unlocks.has('relic_uncommon_pack')).toBe(true);
    });

    it('should handle missing unlocks by reconciling with rules', async () => {
        // Level 5 should have 'map_fortress'
        const rawJson = JSON.stringify({
            schemaVersion: 1,
            profile: { xp: 5000, level: 5, unlocks: [] }, // Missing unlocks
            lastRun: null,
            savedAt: new Date().toISOString()
        });

        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(rawJson);

        const { profile } = await store.load(rules);
        expect(profile.unlocks.has('map_fortress')).toBe(true);
    });
});
