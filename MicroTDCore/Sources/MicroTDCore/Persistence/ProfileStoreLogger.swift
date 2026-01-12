// ProfileStoreLogger.swift
// Logging extension for ProfileStore operations

import Foundation

/// Logging hook for ProfileStore operations
/// Enable visibility into schema version, file paths, and corruption events
public protocol ProfileStoreLogger {
    func didLoad(schemaVersion: Int, fileURL: URL, profileLevel: Int, profileXP: Int)
    func didSave(schemaVersion: Int, fileURL: URL, profileLevel: Int, profileXP: Int)
    func didHandleCorruption(policy: CorruptProfilePolicy, fileURL: URL, backupURL: URL?)
}

#if canImport(os)
import os

/// Default logger using os.log (Apple platforms only)
public struct OSLogProfileStoreLogger: ProfileStoreLogger {
    private let logger = Logger(subsystem: "com.microtd.core", category: "ProfileStore")
    
    public init() {}
    
    public func didLoad(schemaVersion: Int, fileURL: URL, profileLevel: Int, profileXP: Int) {
        logger.info("Loaded profile: schema=\(schemaVersion), level=\(profileLevel), xp=\(profileXP), path=\(fileURL.lastPathComponent, privacy: .private)")
    }
    
    public func didSave(schemaVersion: Int, fileURL: URL, profileLevel: Int, profileXP: Int) {
        logger.info("Saved profile: schema=\(schemaVersion), level=\(profileLevel), xp=\(profileXP), path=\(fileURL.lastPathComponent, privacy: .private)")
    }
    
    public func didHandleCorruption(policy: CorruptProfilePolicy, fileURL: URL, backupURL: URL?) {
        if let backup = backupURL {
            logger.warning("Corruption detected (policy=\(String(describing: policy))): backed up to \(backup.lastPathComponent, privacy: .private)")
        } else {
            logger.warning("Corruption detected (policy=\(String(describing: policy))): no backup created")
        }
    }
}
#endif
