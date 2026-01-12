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
        
        // Run for 1000 ticks (gives wave enough time to complete)
        for _ in 0..<1000 {
            game.tick()
        }
        
        // SNAPSHOT: coins/lives at tick 1000
        // Starting values: coins=200, lives=20
        // Wave 0: 3 enemies spawn and leak → lives -3 = 17
        // Wave completes → coins +50 = 250
        XCTAssertEqual(game.currentCoins, 250, "Seed 12345: Expected coins at tick 1000")
        XCTAssertEqual(game.currentLives, 17, "Seed 12345: Expected lives at tick 1000")
        
        // SNAPSHOT: spawn IDs (deterministic, sorted)
        let spawnIDs = game.eventLog.events.compactMap { e -> Int? in
            if case .enemySpawned(let id, _, _, _) = e { return id }
            return nil
        }.sorted()
        XCTAssertEqual(spawnIDs, [1, 2, 3], "Should spawn enemies with IDs 1, 2, 3")
        
        // SNAPSHOT: render state (all leaked by now)
        let snapshot = game.getRenderSnapshot()
        XCTAssertEqual(snapshot.enemies.count, 0, "All enemies should have leaked by tick 1000")
        XCTAssertEqual(snapshot.towers.count, 0, "No towers placed")
        
        // Verify determinism with replay
        let game2 = GameState(runSeed: 12345, definitions: definitions)
        game2.processCommand(.startWave(tick: game2.currentTick))
        for _ in 0..<1000 {
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
        
        for _ in 0..<1000 {
            game.tick()
        }
        
        // SNAPSHOT: coins/lives at tick 1000
        // Without RNG divergence, different seeds produce same outcome
        XCTAssertEqual(game.currentCoins, 250, "Seed 98765: Expected coins")
        XCTAssertEqual(game.currentLives, 17, "Seed 98765: Expected lives")
        
        // Verify replay determinism with snapshots
        let game2 = GameState(runSeed: 98765, definitions: definitions)
        game2.processCommand(.startWave(tick: game2.currentTick))
        for _ in 0..<1000 {
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
