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
    
    @MainActor
    func testInitWithMissingFileCreatesDefaultProfile() async throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try await RunManager.make(store: store)
        
        XCTAssertEqual(manager.profile.xp, 0)
        XCTAssertEqual(manager.profile.level, 1)
        XCTAssertTrue(manager.profile.unlocks.isEmpty)
    }
    
    @MainActor
    func testInitLoadsExistingProfile() async throws {
        // Create and save a profile
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let existingProfile = ProgressionProfile(xp: 250, level: 2, unlocks: ["relic_uncommon_pack"])
        try store.save(existingProfile, lastRun: nil)
        
        // Init manager, should load existing
        let manager = try await RunManager.make(store: store)
        
        XCTAssertEqual(manager.profile.xp, 250)
        XCTAssertEqual(manager.profile.level, 2)
        XCTAssertTrue(manager.profile.unlocks.contains("relic_uncommon_pack"))
    }
    
    // MARK: - Run Application
    
    @MainActor
    func testApplyRunUpdatesProfileAndPersists() async throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try await RunManager.make(store: store)
        
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
        
        let events = try await manager.applyRun(summary)
        
        // Verify events
        XCTAssertTrue(events.contains { 
            if case .xpGained(let amount) = $0 { return amount == 150 }
            return false
        })
        XCTAssertTrue(events.contains { 
            if case .leveledUp(let from, let to) = $0 { return from == 1 && to == 2 }
            return false
        })
        
        // Verify profile updated
        XCTAssertEqual(manager.profile.xp, 150)
        XCTAssertEqual(manager.profile.level, 2)
        
        // Verify persisted (reload from disk)
        let rules = ProgressionRules()
        let (reloadedProfile, _) = try store.load(rules: rules)
        XCTAssertEqual(reloadedProfile.xp, 150)
        XCTAssertEqual(reloadedProfile.level, 2)
    }
    
    @MainActor
    func testApplyRunPersistsLastRunMetadata() async throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try await RunManager.make(store: store)
        
        let summary = RunSummary(
            runSeed: 99999,
            wavesCleared: 8,
            ticksSurvived: 480,
            coinsEarned: 100,
            enemiesDefeated: 20,
            didWin: true,
            relicIDsChosen: ["r1"]
        )
        
        _ = try await manager.applyRun(summary)
        
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
    
    @MainActor
    func testApplyRunTriggersUnlocks() async throws {
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
        
        let manager = try await RunManager.make(store: store)
        
        let summary = RunSummary(
            runSeed: 1,
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 2, // 10 XP
            didWin: false,
            relicIDsChosen: []
        )
        
        let events = try await manager.applyRun(summary)
        
        // Should level up and unlock level 3 items
        XCTAssertTrue(events.contains { 
            if case .leveledUp(let from, let to) = $0 { return from == 2 && to == 3 }
            return false
        })
        XCTAssertTrue(events.contains { 
            if case .unlocked(let id) = $0 { return id == "relic_rare_pack" || id == "tower_missile" }
            return false
        })
        
        // Verify unlocks in profile
        XCTAssertTrue(manager.profile.unlocks.contains("relic_rare_pack"))
        XCTAssertTrue(manager.profile.unlocks.contains("tower_missile"))
    }
    
    // MARK: - Reset
    
    @MainActor
    func testResetProfileClearsDataAndPersists() async throws {
        let store = JSONFileProfileStore(fileURL: testFileURL, corruptPolicy: .resetToDefaultAndBackup)
        let manager = try await RunManager.make(store: store)
        
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
        _ = try await manager.applyRun(summary)
        
        XCTAssertNotEqual(manager.profile.xp, 0)
        
        // Reset
        try await manager.resetProfile()
        
        XCTAssertEqual(manager.profile.xp, 0)
        XCTAssertEqual(manager.profile.level, 1)
        XCTAssertTrue(manager.profile.unlocks.isEmpty)
        
        // Verify persisted
        let rules = ProgressionRules()
        let (reloadedProfile, _) = try store.load(rules: rules)
        XCTAssertEqual(reloadedProfile.xp, 0)
    }
}
