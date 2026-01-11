// SimulationRunner.swift
// Proof artifact - runs simulation and outputs determinism proof

import XCTest
@testable import MicroTDCore

final class SimulationRunner: XCTestCase {
    
    /// Proof of determinism - run same seed twice, output event hashes
    func testDeterminismProof() throws {
        let seed: UInt64 = 12345
        let definitions = try TestFixtures.loadDefinitions()
        
        print("\n=== DETERMINISM PROOF ===")
        print("Running simulation with seed: \(seed)")
        print("Ticks to simulate: 1000")
        print("")
        
        // Run 1
        print("--- RUN 1 ---")
        let game1 = GameState(runSeed: seed, definitions: definitions)
        game1.processCommand(.startWave(tick: 0))
        
        for _ in 0..<1000 {
            game1.tick()
        }
        
        let hash1 = hashEvents(game1.eventLog.events)
        print("Event count: \(game1.eventLog.events.count)")
        print("Event hash: \(hash1)")
        print("Final tick: \(game1.currentTick)")
        print("Final coins: \(game1.currentCoins)")
        print("Final lives: \(game1.currentLives)")
        print("")
        
        // Run 2
        print("--- RUN 2 ---")
        let game2 = GameState(runSeed: seed, definitions: definitions)
        game2.processCommand(.startWave(tick: 0))
        
        for _ in 0..<1000 {
            game2.tick()
        }
        
        let hash2 = hashEvents(game2.eventLog.events)
        print("Event count: \(game2.eventLog.events.count)")
        print("Event hash: \(hash2)")
        print("Final tick: \(game2.currentTick)")
        print("Final coins: \(game2.currentCoins)")
        print("Final lives: \(game2.currentLives)")
        print("")
        
        print("=== RESULT ===")
        if hash1 == hash2 && game1.eventLog.events.count == game2.eventLog.events.count {
            print("✅ DETERMINISM VERIFIED")
            print("Same seed produced identical simulation")
        } else {
            print("❌ DETERMINISM FAILED")
            print("Runs produced different results")
        }
        print("==================\n")
        
        XCTAssertEqual(hash1, hash2, "Event hashes should match")
        XCTAssertEqual(game1.eventLog.events.count, game2.eventLog.events.count)
        XCTAssertEqual(game1.currentCoins, game2.currentCoins)
        XCTAssertEqual(game1.currentLives, game2.currentLives)
    }
    
    private func hashEvents(_ events: [GameEvent]) -> Int {
        var hasher = Hasher()
        for event in events {
            hasher.combine(String(describing: event))
        }
        return hasher.finalize()
    }
}
