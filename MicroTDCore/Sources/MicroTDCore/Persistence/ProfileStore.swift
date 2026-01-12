// ProfileStore.swift
// Persistence abstraction for ProgressionProfile

import Foundation

/// Policy for handling corrupt/unparseable save files
public enum CorruptProfilePolicy: Sendable {
    /// Throw error and let caller handle
    case throwError
    
    /// Return default profile and backup corrupt file
    case resetToDefaultAndBackup
    
    /// Return default profile silently (no backup)
    case resetToDefaultSilently
}

/// Abstraction for loading/saving progression profiles
public protocol ProfileStore {
    /// Load profile from storage, applying normalization and migrations
    func load(rules: ProgressionRules) throws -> ProgressionProfile
    
    /// Save profile to storage with optional last run metadata
    func save(_ profile: ProgressionProfile, lastRun: LastRunMetadata?) throws
}

/// JSON file-based profile store with atomic writes and corruption handling
public final class JSONFileProfileStore: ProfileStore {
    private let fileURL: URL
    private let corruptPolicy: CorruptProfilePolicy
    private let logger: (any ProfileStoreLogger)?
    
    /// Create a JSON file-based profile store
    /// - Parameters:
    ///   - fileURL: Absolute path to profile.json file
    ///   - corruptPolicy: How to handle corrupt/unparseable files (REQUIRED - no default)
    ///   - logger: Optional logger for visibility into operations
    /// - Warning: Corruption policy must be chosen explicitly based on your product's data recovery UX
    public init(
        fileURL: URL,
        corruptPolicy: CorruptProfilePolicy,
        logger: (any ProfileStoreLogger)? = nil
    ) {
        self.fileURL = fileURL
        self.corruptPolicy = corruptPolicy
        self.logger = logger
    }
    
    // MARK: - ProfileStore
    
    public func load(rules: ProgressionRules) throws -> ProgressionProfile {
        // If file doesn't exist, return default
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return ProgressionProfile()
        }
        
        // Attempt to decode
        do {
            let data = try Data(contentsOf: fileURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            var saveFile = try decoder.decode(ProgressionSaveFile.self, from: data)
            
            // Migration hook (currently no migrations needed for v1)
            if saveFile.schemaVersion < ProgressionSaveFile.currentSchemaVersion {
                saveFile = try migrate(saveFile, to: ProgressionSaveFile.currentSchemaVersion)
            }
            
            // Normalize unlocks (fills missing unlocks based on current level and rules)
            var profile = saveFile.profile
            profile.reconcileUnlocks(rules: rules)
            
            logger?.didLoad(
                schemaVersion: saveFile.schemaVersion,
                fileURL: fileURL,
                profileLevel: profile.level,
                profileXP: profile.xp
            )
            
            return profile
            
        } catch {
            // Handle corruption based on policy
            switch corruptPolicy {
            case .throwError:
                throw error
                
            case .resetToDefaultAndBackup:
                let backupURL = try? backupCorruptFile()
                logger?.didHandleCorruption(
                    policy: corruptPolicy,
                    fileURL: fileURL,
                    backupURL: backupURL
                )
                return ProgressionProfile()
                
            case .resetToDefaultSilently:
                logger?.didHandleCorruption(
                    policy: corruptPolicy,
                    fileURL: fileURL,
                    backupURL: nil
                )
                return ProgressionProfile()
            }
        }
    }
    
    public func save(_ profile: ProgressionProfile, lastRun: LastRunMetadata? = nil) throws {
        let saveFile = ProgressionSaveFile(
            profile: profile,
            lastRun: lastRun
        )
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted]
        encoder.dateEncodingStrategy = .iso8601
        
        let data = try encoder.encode(saveFile)
        
        // Atomic write: write to temp file, then replace
        let tempURL = fileURL.deletingLastPathComponent()
            .appendingPathComponent(".\(fileURL.lastPathComponent).\(UUID().uuidString).tmp")
        
        try data.write(to: tempURL)
        
        // Replace original file (remove old, move temp)
        if FileManager.default.fileExists(atPath: fileURL.path) {
            try FileManager.default.removeItem(at: fileURL)
        }
        try FileManager.default.moveItem(at: tempURL, to: fileURL)
        
        logger?.didSave(
            schemaVersion: ProgressionSaveFile.currentSchemaVersion,
            fileURL: fileURL,
            profileLevel: profile.level,
            profileXP: profile.xp
        )
    }
    
    // MARK: - Private Helpers
    
    private func backupCorruptFile() throws -> URL {
        // Use filename-safe timestamp (no colons for Windows compatibility)
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyyMMdd-HHmmssSSS"
        
        let stamp = formatter.string(from: Date())
        let backupURL = fileURL.deletingLastPathComponent()
            .appendingPathComponent("profile.corrupt.\(stamp).json")
        
        // Move (not copy) to remove corrupt file and prevent repeated backup attempts
        if FileManager.default.fileExists(atPath: backupURL.path) {
            // Collision unlikely, but handle it
            let alt = fileURL.deletingLastPathComponent()
                .appendingPathComponent("profile.corrupt.\(stamp).\(UUID().uuidString).json")
            try FileManager.default.moveItem(at: fileURL, to: alt)
            return alt
        } else {
            try FileManager.default.moveItem(at: fileURL, to: backupURL)
            return backupURL
        }
    }
    
    private func migrate(_ saveFile: ProgressionSaveFile, to version: Int) throws -> ProgressionSaveFile {
        // Migration scaffold for future schema changes
        var migrated = saveFile
        
        // Example future migration:
        // if saveFile.schemaVersion == 1 && version >= 2 {
        //     migrated = migrateV1toV2(migrated)
        // }
        
        migrated.schemaVersion = version
        return migrated
    }
}
