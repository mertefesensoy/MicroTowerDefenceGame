// RunManagerTests.swift
// Verifies RunManager lifecycle, run application, and persistence integration

import XCTest
@testable import MicroTDCore

final class RunManagerTests: XCTestCase {
    
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
    
    // MARK: - Initialization
    
    func testInitWithMissingFileCreatesDefaultProfile() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try RunManager(store: store)
        
        XCTAssertEqual(manager.profile.xp, 0)
        XCTAssertEqual(manager.profile.level, 1)
        XCTAssertTrue(manager.profile.unlocks.isEmpty)
    }
    
    func testInitLoadsExistingProfile() throws {
        // Create and save a profile
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let existingProfile = ProgressionProfile(xp: 250, level: 2, unlocks: ["relic_uncommon_pack"])
        try store.save(existingProfile, lastRun: nil)
        
        // Init manager, should load existing
        let manager = try RunManager(store: store)
        
        XCTAssertEqual(manager.profile.xp, 250)
        XCTAssertEqual(manager.profile.level, 2)
        XCTAssertTrue(manager.profile.unlocks.contains("relic_uncommon_pack"))
    }
    
    // MARK: - Run Application
    
    func testApplyRunUpdatesProfileAndPersists() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try RunManager(store: store)
        
        // Run worth 150 XP (should level up from 1 to 2)
        let summary = RunSummary(
            runSeed: 12345,
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 30, // 30 * 5 = 150 XP
            didWin: false,
            relicIDsChosen: []
        )
        
        let events = try manager.applyRun(summary)
        
        // Verify events
        XCTAssertTrue(events.contains { $0 == .xpGained(amount: 150) })
        XCTAssertTrue(events.contains { $0 == .leveledUp(from: 1, to: 2) })
        
        // Verify profile updated
        XCTAssertEqual(manager.profile.xp, 150)
        XCTAssertEqual(manager.profile.level, 2)
        
        // Verify persisted (reload from disk)
        let rules = ProgressionRules()
        let reloadedProfile = try store.load(rules: rules)
        XCTAssertEqual(reloadedProfile.xp, 150)
        XCTAssertEqual(reloadedProfile.level, 2)
    }
    
    func testApplyRunPersistsLastRunMetadata() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try RunManager(store: store)
        
        let summary = RunSummary(
            runSeed: 99999,
            wavesCleared: 8,
            ticksSurvived: 480,
            coinsEarned: 100,
            enemiesDefeated: 20,
            didWin: true,
            relicIDsChosen: ["r1"]
        )
        
        _ = try manager.applyRun(summary)
        
        // Load save file directly to verify lastRun
        let data = try Data(contentsOf: testFileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let saveFile = try decoder.decode(ProgressionSaveFile.self, from: data)
        
        XCTAssertNotNil(saveFile.lastRun)
        XCTAssertEqual(saveFile.lastRun?.runSeed, 99999)
        XCTAssertEqual(saveFile.lastRun?.didWin, true)
        XCTAssertEqual(saveFile.lastRun?.wavesCleared, 8)
        XCTAssertEqual(saveFile.lastRun?.ticksSurvived, 480)
    }
    
    func testApplyRunTriggersUnlocks() throws {
        // Seed profile through store (Profile at 390 XP, level 2, 10 XP away from level 3)
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        try store.save(
            ProgressionProfile(
                xp: 390,
                level: 2,
                unlocks: ["relic_uncommon_pack", "tower_sniper"]
            ),
            lastRun: nil
        )
        
        let manager = try RunManager(store: store)
        
        let summary = RunSummary(
            runSeed: 1,
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 2, // 10 XP
            didWin: false,
            relicIDsChosen: []
        )
        
        let events = try manager.applyRun(summary)
        
        // Should level up and unlock level 3 items
        XCTAssertTrue(events.contains { $0 == .leveledUp(from: 2, to: 3) })
        XCTAssertTrue(events.contains { 
            if case .unlocked(let id) = $0 { return id == "relic_rare_pack" || id == "tower_missile" }
            return false
        })
        
        // Verify unlocks in profile
        XCTAssertTrue(manager.profile.unlocks.contains("relic_rare_pack"))
        XCTAssertTrue(manager.profile.unlocks.contains("tower_missile"))
    }
    
    // MARK: - Reset
    
    func testResetProfileClearsDataAndPersists() throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try RunManager(store: store)
        
        // Apply a run to modify profile
        let summary = RunSummary(
            runSeed: 1,
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 30,
            didWin: false,
            relicIDsChosen: []
        )
        _ = try manager.applyRun(summary)
        
        XCTAssertNotEqual(manager.profile.xp, 0)
        
        // Reset
        try manager.resetProfile()
        
        XCTAssertEqual(manager.profile.xp, 0)
        XCTAssertEqual(manager.profile.level, 1)
        XCTAssertTrue(manager.profile.unlocks.isEmpty)
        
        // Verify persisted
        let rules = ProgressionRules()
        let reloadedProfile = try store.load(rules: rules)
        XCTAssertEqual(reloadedProfile.xp, 0)
    }
}
