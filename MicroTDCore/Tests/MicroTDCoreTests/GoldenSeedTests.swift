// GoldenSeedTests.swift
// Lock specific seeds with expected outcomes

import XCTest
@testable import MicroTDCore

final class GoldenSeedTests: XCTestCase {
    
    /// Golden seed 12345 - snapshot-based determinism test
    /// Verifies stable gameplay snapshots instead of raw events
    /// If definitions change, this test will fail - that's intentional
    func testGoldenSeed12345() throws {
        let definitions = try TestFixtures.loadDefinitions()
        let game = GameState(runSeed: 12345, definitions: definitions)
        
        // Start wave 0
        game.processCommand(.startWave(tick: game.currentTick))
        
        // Run for 120 ticks (wave should spawn 3 runners at ticks 0, 30, 60)
        for _ in 0..<120 {
            game.tick()
        }
        
        // SNAPSHOT: coins/lives at tick 120
        XCTAssertEqual(game.currentCoins, 100, "Seed 12345: Expected coins at tick 120")
        XCTAssertEqual(game.currentLives, 10, "Seed 12345: Expected lives at tick 120")
        
        // SNAPSHOT: spawn count from lifecycle events
        let spawnEvents = game.eventLog.events.filter {
            if case .enemySpawned = $0 { return true }
            return false
        }
        XCTAssertEqual(spawnEvents.count, 3, "Wave 0 should spawn exactly 3 enemies")
        
        // SNAPSHOT: spawn IDs (deterministic instance IDs)
        if case .enemySpawned(let id1, _, _, let tick1) = spawnEvents[0] {
            XCTAssertEqual(id1, 1, "First enemy should have ID 1")
            XCTAssertEqual(tick1, 0, "First spawn at tick 0")
        }
        if case .enemySpawned(let id2, _, _, let tick2) = spawnEvents[1] {
            XCTAssertEqual(id2, 2, "Second enemy should have ID 2")
            XCTAssertEqual(tick2, 30, "Second spawn at tick 30")
        }
        if case .enemySpawned(let id3, _, _, let tick3) = spawnEvents[2] {
            XCTAssertEqual(id3, 3, "Third enemy should have ID 3")
            XCTAssertEqual(tick3, 60, "Third spawn at tick 60")
        }
        
        // SNAPSHOT: render state (sorted by ID for stability)
        let snapshot = game.getRenderSnapshot()
        XCTAssertEqual(snapshot.enemies.count, 3, "Should have 3 live enemies")
        XCTAssertEqual(snapshot.towers.count, 0, "No towers placed")
        
        // Verify determinism with replay
        let game2 = GameState(runSeed: 12345, definitions: definitions)
        game2.processCommand(.startWave(tick: game2.currentTick))
        for _ in 0..<120 {
            game2.tick()
        }
        
        XCTAssertEqual(game.currentCoins, game2.currentCoins, "Coins should match")
        XCTAssertEqual(game.currentLives, game2.currentLives, "Lives should match")
        XCTAssertEqual(game.getRenderSnapshot().enemies.count, game2.getRenderSnapshot().enemies.count)
    }
    
    /// Golden seed 98765 - snapshot-based determinism test
    func testGoldenSeed98765() throws {
        let definitions = try TestFixtures.loadDefinitions()
        let game = GameState(runSeed: 98765, definitions: definitions)
        
        game.processCommand(.startWave(tick: game.currentTick))
        
        for _ in 0..<100 {
            game.tick()
        }
        
        // SNAPSHOT: spawn count from lifecycle events
        let spawnCount = game.eventLog.events.filter {
            if case .enemySpawned = $0 { return true }
            return false
        }.count
        XCTAssertEqual(spawnCount, 3, "Same wave definition, should spawn 3")
        
        // SNAPSHOT: coins/lives at tick 100
        XCTAssertEqual(game.currentCoins, 100, "Seed 98765: Expected coins")
        XCTAssertEqual(game.currentLives, 10, "Seed 98765: Expected lives")
        
        // Verify replay determinism with snapshots
        let game2 = GameState(runSeed: 98765, definitions: definitions)
        game2.processCommand(.startWave(tick: game2.currentTick))
        for _ in 0..<100 {
            game2.tick()
        }
        
        // Compare reduced state instead of raw event arrays
        XCTAssertEqual(game.currentCoins, game2.currentCoins, "Coins must match")
        XCTAssertEqual(game.currentLives, game2.currentLives, "Lives must match")
        XCTAssertEqual(game.currentTick, game2.currentTick, "Ticks must match")
        
        let snapshot1 = game.getRenderSnapshot()
        let snapshot2 = game2.getRenderSnapshot()
        XCTAssertEqual(snapshot1.enemies.count, snapshot2.enemies.count, "Enemy count must match")
        XCTAssertEqual(snapshot1.towers.count, snapshot2.towers.count, "Tower count must match")
    }
    
    /// Test that relic choices are deterministic for a given seed
    func testGoldenSeedRelicChoices() throws {
        let definitions = try TestFixtures.loadDefinitions()
        
        let rng1 = SeededRNG(seed: 55555)
        let relicSystem1 = RelicSystem(relicDefs: definitions.relics, rng: rng1)
        let choices1 = relicSystem1.generateChoices(count: 3)
        
        let rng2 = SeededRNG(seed: 55555)
        let relicSystem2 = RelicSystem(relicDefs: definitions.relics, rng: rng2)
        let choices2 = relicSystem2.generateChoices(count: 3)
        
        XCTAssertEqual(choices1.map { $0.id }, choices2.map { $0.id }, "Same seed should generate same relic choices")
    }
}
