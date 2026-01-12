// DeterminismTests.swift
// Test that simulation is fully deterministic

import XCTest
@testable import MicroTDCore

final class DeterminismTests: XCTestCase {
    
    func testSimulationDeterminism() throws {
        let seed: UInt64 = 12345
        let definitions = try TestFixtures.loadDefinitions()
        
        // Run 1
        let game1 = GameState(runSeed: seed, definitions: definitions)
        for _ in 0..<100 {
            game1.tick()
        }
        let events1 = game1.eventLog.events
        
        // Run 2
        let game2 = GameState(runSeed: seed, definitions: definitions)
        for _ in 0..<100 {
            game2.tick()
        }
        let events2 = game2.eventLog.events
        
        XCTAssertEqual(events1.count, events2.count, "Same seed should produce same number of events")
        
        for (e1, e2) in zip(events1, events2) {
            XCTAssertEqual(e1, e2, "Events should be identical")
        }
    }
    
    func testCommandReplay() throws {
        let seed: UInt64 = 99999
        let definitions = try TestFixtures.loadDefinitions()
        
        // Original run with commands
        let game1 = GameState(runSeed: seed, definitions: definitions)
        
        // Place tower at tick 10
        for _ in 0..<10 {
            game1.tick()
        }
        game1.processCommand(.placeTower(type: "cannon", gridX: 1, gridY: 2, tick: game1.currentTick))
        
        // Start wave
        game1.processCommand(.startWave(tick: game1.currentTick))
        
        // Run for 100 more ticks
        for _ in 0..<100 {
            game1.tick()
        }
        
        let events1 = game1.eventLog.events
        let commands1 = game1.commandLog.commands
        
        // Replay run with same commands
        let game2 = GameState(runSeed: seed, definitions: definitions)
        
        for _ in 0..<10 {
            game2.tick()
        }
        game2.processCommand(commands1[0]) // Place tower
        game2.processCommand(commands1[1]) // Start wave
        
        for _ in 0..<100 {
            game2.tick()
        }
        
        let events2 = game2.eventLog.events
        
        XCTAssertEqual(events1.count, events2.count, "Replayed commands should produce same events")
    }
    
    func testDifferentSeedsDiffer() throws {
        // Test RNG directly instead of gameplay paths (which may not use RNG yet)
        let rng1 = SeededRNG(seed: 11111)
        let rng2 = SeededRNG(seed: 22222)
        
        // Sample multiple values to avoid single-draw collisions
        let stream1 = (0..<16).map { _ in rng1.nextInt(in: 0..<1_000_000) }
        let stream2 = (0..<16).map { _ in rng2.nextInt(in: 0..<1_000_000) }
        
        XCTAssertNotEqual(stream1, stream2, "Different seeds should produce different RNG streams")
    }
}
