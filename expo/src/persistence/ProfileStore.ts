// ProfileStore.ts
// Persistence adapter for player profile — ported from MicroTDCore/Persistence/ProfileStore.swift
// Uses AsyncStorage instead of file system (React Native compatible)

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
    ProgressionProfile,
    LastRunMetadata,
    ProgressionSaveFile,
} from '../core/definitions/ProgressionTypes';
import { CURRENT_SCHEMA_VERSION, ProgressionRules } from '../core/definitions/ProgressionTypes';
import type { ProfileStoreLogger } from './ProfileStoreLogger';

/**
 * Corruption handling policy
 */
export type CorruptProfilePolicy =
    | 'resetToDefaultAndBackup'
    | 'resetToDefaultSilently'
    | 'throwError';

/**
 * Profile store interface
 */
export interface ProfileStoreInterface {
    load(rules: ProgressionRules): Promise<{ profile: ProgressionProfile; lastRun: LastRunMetadata | null }>;
    save(profile: ProgressionProfile, lastRun: LastRunMetadata | null): Promise<void>;
    reset(): Promise<void>;
}

const STORAGE_KEY = '@microtd_profile';
const BACKUP_KEY_PREFIX = '@microtd_profile_corrupt_';

/**
 * AsyncStorage-backed profile store (adapted from Swift's JSONFileProfileStore).
 * Handles serialization, corruption recovery, and unlock reconciliation.
 */
export class AsyncStorageProfileStore implements ProfileStoreInterface {
    private readonly corruptPolicy: CorruptProfilePolicy;
    private readonly logger?: ProfileStoreLogger;

    constructor(
        corruptPolicy: CorruptProfilePolicy = 'resetToDefaultAndBackup',
        logger?: ProfileStoreLogger,
    ) {
        this.corruptPolicy = corruptPolicy;
        this.logger = logger;
    }

    async load(rules: ProgressionRules): Promise<{ profile: ProgressionProfile; lastRun: LastRunMetadata | null }> {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (raw === null) {
            // No saved data — return default profile
            return {
                profile: { xp: 0, level: 1, unlocks: new Set() },
                lastRun: null,
            };
        }

        try {
            const saveFile: ProgressionSaveFile = JSON.parse(raw);

            // Verify schema version
            if (saveFile.schemaVersion !== CURRENT_SCHEMA_VERSION) {
                // Future: migration logic here
                // For now, treat as corruption
                throw new Error(`Unknown schema version: ${saveFile.schemaVersion}`);
            }

            // Reconstruct profile
            const profile: ProgressionProfile = {
                xp: saveFile.profile.xp,
                level: saveFile.profile.level,
                unlocks: new Set(saveFile.profile.unlocks),
            };

            // Reconcile unlocks (ensure player has all unlocks for their level)
            const expectedUnlocks = rules.unlocksForLevel(profile.level);
            for (const itemID of expectedUnlocks) {
                profile.unlocks.add(itemID);
            }

            this.logger?.didLoad(
                saveFile.schemaVersion,
                STORAGE_KEY,
                profile.level,
                profile.xp,
            );

            return { profile, lastRun: saveFile.lastRun };

        } catch (error) {
            return this.handleCorruption(raw, rules, error);
        }
    }

    async save(profile: ProgressionProfile, lastRun: LastRunMetadata | null): Promise<void> {
        const saveFile: ProgressionSaveFile = {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            profile: {
                xp: profile.xp,
                level: profile.level,
                unlocks: Array.from(profile.unlocks),
            },
            lastRun,
            savedAt: new Date().toISOString(),
        };

        const json = JSON.stringify(saveFile);
        await AsyncStorage.setItem(STORAGE_KEY, json);

        this.logger?.didSave(
            CURRENT_SCHEMA_VERSION,
            STORAGE_KEY,
            profile.level,
            profile.xp,
        );
    }

    async reset(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }

    // ─── Corruption Handling ───

    private async handleCorruption(
        rawData: string,
        rules: ProgressionRules,
        error: unknown,
    ): Promise<{ profile: ProgressionProfile; lastRun: LastRunMetadata | null }> {
        switch (this.corruptPolicy) {
            case 'throwError':
                throw error;

            case 'resetToDefaultAndBackup': {
                // Save corrupt data to backup key
                const backupKey = `${BACKUP_KEY_PREFIX}${Date.now()}`;
                try {
                    await AsyncStorage.setItem(backupKey, rawData);
                    this.logger?.didHandleCorruption(this.corruptPolicy, STORAGE_KEY, backupKey);
                } catch {
                    // If backup fails, still continue with reset
                    this.logger?.didHandleCorruption(this.corruptPolicy, STORAGE_KEY, undefined);
                }

                // Remove corrupt data
                await AsyncStorage.removeItem(STORAGE_KEY);

                return {
                    profile: { xp: 0, level: 1, unlocks: new Set() },
                    lastRun: null,
                };
            }

            case 'resetToDefaultSilently': {
                // Just remove the corrupt data quietly
                await AsyncStorage.removeItem(STORAGE_KEY);

                return {
                    profile: { xp: 0, level: 1, unlocks: new Set() },
                    lastRun: null,
                };
            }
        }
    }
}
