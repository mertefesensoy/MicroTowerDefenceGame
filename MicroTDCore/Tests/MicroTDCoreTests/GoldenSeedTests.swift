// GoldenSeedTests.swift
// Lock specific seeds with expected outcomes

import XCTest
@testable import MicroTDCore

final class GoldenSeedTests: XCTestCase {
    
    /// Golden seed 12345 - locked expected behavior
    /// This test documents the exact sequence for this seed
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
        
        // Verify spawn events occurred
        let spawnEvents = game.eventLog.events.filter {
            if case .enemySpawned = $0 { return true }
            return false
        }
        
        XCTAssertEqual(spawnEvents.count, 3, "Wave 0 should spawn exactly 3 enemies")
        
        // Verify spawn timings
        if case .enemySpawned(_, _, _, let tick1) = spawnEvents[0] { XCTAssertEqual(tick1, 0) }
        if case .enemySpawned(_, _, _, let tick2) = spawnEvents[1] { XCTAssertEqual(tick2, 30) }
        if case .enemySpawned(_, _, _, let tick3) = spawnEvents[2] { XCTAssertEqual(tick3, 60) }
        
        // If we re-run with same seed, should get identical results
        let game2 = GameState(runSeed: 12345, definitions: definitions)
        game2.processCommand(.startWave(tick: game2.currentTick))
        for _ in 0..<120 {
            game2.tick()
        }
        
        XCTAssertEqual(game.eventLog.events.count, game2.eventLog.events.count)
    }
    
    /// Golden seed 98765 - second locked seed for variety
    func testGoldenSeed98765() throws {
        let definitions = try TestFixtures.loadDefinitions()
        let game = GameState(runSeed: 98765, definitions: definitions)
        
        game.processCommand(.startWave(tick: game.currentTick))
        
        for _ in 0..<100 {
            game.tick()
        }
        
        // Document current state
        let spawnCount = game.eventLog.events.filter {
            if case .enemySpawned = $0 { return true }
            return false
        }.count
        
        XCTAssertEqual(spawnCount, 3, "Same wave definition, should spawn 3")
        
        // Verify replay
        let game2 = GameState(runSeed: 98765, definitions: definitions)
        game2.processCommand(.startWave(tick: game2.currentTick))
        for _ in 0..<100 {
            game2.tick()
        }
        
        XCTAssertEqual(game.eventLog.events, game2.eventLog.events, "Seed 98765 should be deterministic")
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
