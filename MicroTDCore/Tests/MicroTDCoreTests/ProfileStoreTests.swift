// ProfileStoreTests.swift
// Verifies ProfileStore persistence, corruption handling, and normalization

import XCTest
@testable import MicroTDCore

final class ProfileStoreTests: XCTestCase {
    
    var tempDirectory: URL!
    var testFileURL: URL!
    
    override func setUp() {
        super.setUp()
        tempDirectory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        try? FileManager.default.createDirectory(
            at: tempDirectory,
            withIntermediateDirectories: true,
            attributes: nil
        )
        testFileURL = tempDirectory.appendingPathComponent("profile.json")
    }
    
    override func tearDown() {
        try? FileManager.default.removeItem(at: tempDirectory)
        super.tearDown()
    }
    
    // MARK: - Core Functionality
    
    func testLoadMissingFileReturnsDefaultProfile() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let rules = ProgressionRules()
        
        let profile = try store.load(rules: rules)
        
        XCTAssertEqual(profile.xp, 0)
        XCTAssertEqual(profile.level, 1)
        XCTAssertTrue(profile.unlocks.isEmpty)
    }
    
    func testSaveThenLoadRoundTrip() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let rules = ProgressionRules()
        
        var originalProfile = ProgressionProfile(
            xp: 500,
            level: 3,
            unlocks: ["relic_uncommon_pack", "tower_sniper", "relic_rare_pack", "tower_missile"]
        )
        
        let lastRun = LastRunMetadata(
            runSeed: 12345,
            didWin: true,
            wavesCleared: 10,
            ticksSurvived: 600
        )
        
        // Save
        try store.save(originalProfile, lastRun: lastRun)
        
        // Load
        let loadedProfile = try store.load(rules: rules)
        
        XCTAssertEqual(loadedProfile.xp, originalProfile.xp)
        XCTAssertEqual(loadedProfile.level, originalProfile.level)
        XCTAssertEqual(loadedProfile.unlocks, originalProfile.unlocks)
        
        // Verify file exists
        XCTAssertTrue(FileManager.default.fileExists(atPath: testFileURL.path))
    }
    
    func testAtomicWriteCreatesValidJSON() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let profile = ProgressionProfile(xp: 100, level: 2, unlocks: ["relic_uncommon_pack"])
        
        try store.save(profile, lastRun: nil)
        
        // Verify JSON is valid and parseable
        let data = try Data(contentsOf: testFileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let saveFile = try decoder.decode(ProgressionSaveFile.self, from: data)
        
        XCTAssertEqual(saveFile.schemaVersion, ProgressionSaveFile.currentSchemaVersion)
        XCTAssertEqual(saveFile.profile.xp, 100)
        XCTAssertNil(saveFile.lastRun)
    }
    
    // MARK: - Corruption Handling
    
    func testCorruptFileWithBackupPolicyReturnsDefaultAndCreatesBackup() throws {
        // Write corrupt data
        let corruptData = "{ invalid json }".data(using: .utf8)!
        try corruptData.write(to: testFileURL)
        
        let store = JSONFileProfileStore(
            fileURL: testFileURL,
            corruptPolicy: .resetToDefaultAndBackup
        )
        let rules = ProgressionRules()
        
        let profile = try store.load(rules: rules)
        
        // Should return default
        XCTAssertEqual(profile.xp, 0)
        XCTAssertEqual(profile.level, 1)
        
        // Backup file should exist (name pattern: profile.corrupt.*.json)
        let backupFiles = try FileManager.default.contentsOfDirectory(at: tempDirectory, includingPropertiesForKeys: nil)
            .filter { $0.lastPathComponent.hasPrefix("profile.corrupt.") }
        
        XCTAssertFalse(backupFiles.isEmpty, "Backup file should have been created")
        
        // Original corrupt file should be moved (not exist anymore)
        XCTAssertFalse(FileManager.default.fileExists(atPath: testFileURL.path), "Original corrupt file should be moved, not copied")
    }
    
    func testCorruptFileWithSilentPolicyReturnsDefaultNoBackup() throws {
        // Write corrupt data
        let corruptData = "{ invalid json }".data(using: .utf8)!
        try corruptData.write(to: testFileURL)
        
        let store = JSONFileProfileStore(
            fileURL: testFileURL,
            corruptPolicy: .resetToDefaultSilently
        )
        let rules = ProgressionRules()
        
        let profile = try store.load(rules: rules)
        
        // Should return default
        XCTAssertEqual(profile.xp, 0)
        XCTAssertEqual(profile.level, 1)
        
        // No backup should exist
        let backupFiles = try FileManager.default.contentsOfDirectory(at: tempDirectory, includingPropertiesForKeys: nil)
            .filter { $0.lastPathComponent.hasPrefix("profile.corrupt.") }
        
        XCTAssertTrue(backupFiles.isEmpty, "No backup should be created with silent policy")
    }
    
    func testCorruptFileWithThrowPolicyThrows() throws {
        // Write corrupt data
        let corruptData = "{ invalid json }".data(using: .utf8)!
        try corruptData.write(to: testFileURL)
        
        let store = JSONFileProfileStore(
            fileURL: testFileURL,
            corruptPolicy: .throwError
        )
        let rules = ProgressionRules()
        
        XCTAssertThrowsError(try store.load(rules: rules))
    }
    
    // MARK: - Unlock Reconciliation
    
    func testReconcileUnlocksOnLoad() throws {
        // Create a profile at level 3 but with missing unlocks
        let incompleteProfile = ProgressionProfile(
            xp: 500,
            level: 3,
            unlocks: ["relic_uncommon_pack"] // Missing tower_sniper, relic_rare_pack, tower_missile
        )
        
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        try store.save(incompleteProfile, lastRun: nil)
        
        // Load with reconciliation
        let rules = ProgressionRules()
        let loadedProfile = try store.load(rules: rules)
        
        // Should have all level 2 and 3 unlocks
        let expectedUnlocks: Set<String> = [
            "relic_uncommon_pack",
            "tower_sniper",
            "relic_rare_pack",
            "tower_missile"
        ]
        
        XCTAssertEqual(loadedProfile.unlocks, expectedUnlocks)
    }
    
    // MARK: - Schema Versioning Scaffold
    
    func testLoadHandlesCurrentSchemaVersion() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let rules = ProgressionRules()
        let profile = ProgressionProfile(xp: 100, level: 2, unlocks: [])
        
        try store.save(profile, lastRun: nil)
        
        // Verify schema version is correct
        let data = try Data(contentsOf: testFileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let saveFile = try decoder.decode(ProgressionSaveFile.self, from: data)
        
        XCTAssertEqual(saveFile.schemaVersion, ProgressionSaveFile.currentSchemaVersion)
    }
}
