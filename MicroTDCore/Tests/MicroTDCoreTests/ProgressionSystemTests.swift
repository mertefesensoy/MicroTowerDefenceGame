// ProgressionSystemTests.swift
// Verifies pure logic of progression (XP, Leveling, Unlocks)

import XCTest
@testable import MicroTDCore

final class ProgressionSystemTests: XCTestCase {
    
    let rules = ProgressionRules()
    
    func testXPFormula() {
        // Run: 10 waves, 600 ticks (10s), 100 coins, 20 kills, Win
        let summary = RunSummary(
            runSeed: UInt64(1),
            wavesCleared: 10,
            ticksSurvived: 600,
            coinsEarned: 100,
            enemiesDefeated: 20,
            didWin: true,
            relicIDsChosen: []
        )
        
        let xp = rules.xpForRun(summary)
        
        // Expected:
        // Waves: 10 * 50 = 500
        // Enemies: 20 * 5 = 100
        // Time: 600 / 60 = 10
        // Win: 500
        // Total: 1110
        XCTAssertEqual(xp, 1110)
    }
    
    func testLevelUp() {
        let system = ProgressionSystem(rules: rules)
        var profile = ProgressionProfile(xp: 0, level: 1, unlocks: [])
        
        let xpNeeded = rules.totalXpRequiredToReachNextLevel(from: 1) // 100
        
        // Run worth 150 XP
        let summary = RunSummary(
            runSeed: UInt64(1),
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 30, // 150 XP
            didWin: false,
            relicIDsChosen: []
        )
        
        let events = system.applyRun(summary, to: &profile)
        
        XCTAssertEqual(profile.level, 2)
        XCTAssertEqual(profile.xp, 150)
        XCTAssertTrue(events.contains { $0 == .leveledUp(from: 1, to: 2) })
        XCTAssertTrue(events.contains { $0 == .xpGained(amount: 150) })
    }
    
    func testMultiLevelUp() {
        let system = ProgressionSystem(rules: rules)
        var profile = ProgressionProfile(xp: 0, level: 1, unlocks: [])
        
        // Level 1->2 needs 100.
        // Level 2->3 needs 400 (if definition 100*lv*lv = 100*2*2 = 400? Or is it cumulative?)
        // My implementation: threshold = rules.xpRequiredForLevel(profile.level)
        // rules.xpRequiredForLevel(1) = 100.
        // rules.xpRequiredForLevel(2) = 400.
        // So thresholds are CUMULATIVE totals.
        
        // Run worth 500 XP.
        // 0 -> 500.
        // 500 >= 100 (Level 1 req). Level becomes 2.
        // 500 >= 400 (Level 2 req). Level becomes 3.
        // 500 < 900 (Level 3 req). Stop.
        
        let summary = RunSummary(
            runSeed: UInt64(1),
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 100, // 500 XP
            didWin: false,
            relicIDsChosen: []
        )
        
        let events = system.applyRun(summary, to: &profile)
        
        XCTAssertEqual(profile.level, 3)
        XCTAssertTrue(events.contains { $0 == .leveledUp(from: 1, to: 2) })
        XCTAssertTrue(events.contains { $0 == .leveledUp(from: 2, to: 3) })
    }
    
    func testUnlocks() {
        let system = ProgressionSystem(rules: rules)
        var profile = ProgressionProfile(xp: 390, level: 2, unlocks: [])
        
        // Needs 400 for Level 3.
        // Run worth 10 XP.
        let summary = RunSummary(
            runSeed: UInt64(1),
            wavesCleared: 0,
            ticksSurvived: 0,
            coinsEarned: 0,
            enemiesDefeated: 2, // 10 XP
            didWin: false,
            relicIDsChosen: []
        )
        
        let events = system.applyRun(summary, to: &profile)
        
        XCTAssertEqual(profile.level, 3)
        
        // Level 3 should unlock "relic_rare_pack" and "tower_missile"
        let expectedUnlocks = ["relic_rare_pack", "tower_missile"]
        
        for id in expectedUnlocks {
            XCTAssertTrue(profile.unlocks.contains(id))
            XCTAssertTrue(events.contains { 
                if case .unlocked(let uId) = $0 { return uId == id }
                return false
            })
        }
    }
}
