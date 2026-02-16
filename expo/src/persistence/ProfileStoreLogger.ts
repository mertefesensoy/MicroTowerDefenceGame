// ProfileStoreLogger.ts
// Logging interface for ProfileStore operations
// Ported from MicroTDCore/Persistence/ProfileStoreLogger.swift

/**
 * Logging hook for ProfileStore operations.
 * Enables visibility into schema version, storage keys, and corruption events.
 */
export interface ProfileStoreLogger {
    didLoad(schemaVersion: number, storageKey: string, profileLevel: number, profileXP: number): void;
    didSave(schemaVersion: number, storageKey: string, profileLevel: number, profileXP: number): void;
    didHandleCorruption(policy: string, storageKey: string, backupKey: string | undefined): void;
}

/**
 * Default logger using console (adapted from Swift's OSLogProfileStoreLogger)
 */
export class ConsoleProfileStoreLogger implements ProfileStoreLogger {
    didLoad(schemaVersion: number, storageKey: string, profileLevel: number, profileXP: number): void {
        console.log(
            `[ProfileStore] Loaded profile: schema=${schemaVersion}, level=${profileLevel}, xp=${profileXP}, key=${storageKey}`
        );
    }

    didSave(schemaVersion: number, storageKey: string, profileLevel: number, profileXP: number): void {
        console.log(
            `[ProfileStore] Saved profile: schema=${schemaVersion}, level=${profileLevel}, xp=${profileXP}, key=${storageKey}`
        );
    }

    didHandleCorruption(policy: string, storageKey: string, backupKey: string | undefined): void {
        if (backupKey) {
            console.warn(
                `[ProfileStore] Corruption detected (policy=${policy}): backed up to ${backupKey}`
            );
        } else {
            console.warn(
                `[ProfileStore] Corruption detected (policy=${policy}): no backup created`
            );
        }
    }
}
