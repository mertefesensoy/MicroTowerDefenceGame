import { AsyncStorageProfileStore } from '../../src/persistence/ProfileStore';
import { ProgressionRules, ProgressionProfile, createDefaultProfile } from '../../src/core/definitions/ProgressionTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
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

describe('ProfileStore Serialization Determinism', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should produce identical JSON for identical unlocks regardless of Set insertion order', async () => {
        const store = new AsyncStorageProfileStore('resetToDefaultSilently');

        // Create two profiles with identical data but different unlock insertion orders
        const profileA: ProgressionProfile = {
            xp: 500,
            level: 3,
            unlocks: new Set(['tower_sniper', 'relic_uncommon_pack', 'map_fortress']),
        };

        const profileB: ProgressionProfile = {
            xp: 500,
            level: 3,
            unlocks: new Set(['map_fortress', 'relic_uncommon_pack', 'tower_sniper']),
        };

        // Save profileA and capture JSON
        await store.save(profileA, null);
        const jsonA = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];

        // Clear mocks and save profileB
        jest.clearAllMocks();
        await store.save(profileB, null);
        const jsonB = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];

        // CRITICAL: JSON strings must be identical despite different Set insertion orders
        expect(jsonA).toBe(jsonB);

        // Verify the unlocks array in JSON is sorted
        const parsedA = JSON.parse(jsonA);
        const unlocksArray = parsedA.profile.unlocks;
        expect(unlocksArray).toEqual(['map_fortress', 'relic_uncommon_pack', 'tower_sniper']);

        // Verify sorted order matches deterministic comparator
        const sorted = [...unlocksArray].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        expect(unlocksArray).toEqual(sorted);
    });

    it('should preserve unlock membership after round-trip save/load', async () => {
        const store = new AsyncStorageProfileStore('resetToDefaultSilently');
        const rules = new ProgressionRules();

        // Use level 1 to avoid unlock reconciliation adding expected unlocks
        const original: ProgressionProfile = {
            xp: 50,
            level: 1,
            unlocks: new Set(['item_c', 'item_a', 'item_b']),
        };

        // Save profile
        await store.save(original, null);
        const savedJson = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];

        // Verify the saved JSON has sorted unlocks
        const parsed = JSON.parse(savedJson);
        expect(parsed.profile.unlocks).toEqual(['item_a', 'item_b', 'item_c']);

        // Mock load to return the saved data
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(savedJson);
        const { profile: loaded } = await store.load(rules);

        // Verify all unlocks preserved (order doesn't matter for Set membership)
        expect(loaded.unlocks.has('item_a')).toBe(true);
        expect(loaded.unlocks.has('item_b')).toBe(true);
        expect(loaded.unlocks.has('item_c')).toBe(true);
        expect(loaded.unlocks.size).toBe(3);
    });
});
