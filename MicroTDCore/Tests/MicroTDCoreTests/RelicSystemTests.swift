// RelicSystemTests.swift
// Verifies determinism and logic of RelicSystem

import XCTest
@testable import MicroTDCore

final class RelicSystemTests: XCTestCase {
    
    // Mock Database
    var db: RelicDatabase!
    
    override func setUp() {
        let relic1 = RelicDef(id: "r1", name: "R1", description: "D1", rarity: .common, effects: [.init(type: .towerDamageMultiplier, value: 0.1)])
        let relic2 = RelicDef(id: "r2", name: "R2", description: "D2", rarity: .rare, effects: [.init(type: .coinMultiplier, value: 0.2)])
        let relic3 = RelicDef(id: "r3", name: "R3", description: "D3", rarity: .legendary, effects: [.init(type: .enemySlowOnHit, value: 0.5)])
        let relic4 = RelicDef(id: "r4", name: "R4", description: "D4", rarity: .common, effects: [])
        
        db = RelicDatabase(relicDefs: [relic1, relic2, relic3, relic4])
    }
    
    func testDeterministicOffers() {
        let rng1 = SeededRNG(seed: 12345)
        let system1 = RelicSystem(db: db, rng: rng1)
        let offer1 = system1.makeOfferIDs(count: 2)
        
        let rng2 = SeededRNG(seed: 12345)
        let system2 = RelicSystem(db: db, rng: rng2)
        let offer2 = system2.makeOfferIDs(count: 2)
        
        XCTAssertEqual(offer1, offer2, "Offers must be identical for same seed")
    }
    
    func testRNGIsolationFailureChecks() {
        // Robust test comparing two parallel systems with identical seeds.
        // System A: Apply Relic -> Make Offer
        // System B: Make Offer (Control)
        // If applyRelic consumes RNG, the offers will diverge.
        
        let seed: UInt64 = 999
        let count = 2
        
        // System A
        let rngA = SeededRNG(seed: seed)
        let systemA = RelicSystem(db: db, rng: rngA)
        // Advance RNG slightly to simulate real game state
        _ = systemA.makeOfferIDs(count: count)
        // ACTION: Apply relic (Should be RNG-free)
        systemA.applyRelic(id: "r1")
        // Checkpoint: Next offer
        let offerA = systemA.makeOfferIDs(count: count, excludeOwned: false)

        // System B (Control)
        let rngB = SeededRNG(seed: seed)
        let systemB = RelicSystem(db: db, rng: rngB)
        // Advance RNG exactly same amount
        _ = systemB.makeOfferIDs(count: count)
        // NO ACTION
        // Checkpoint: Next offer
        let offerB = systemB.makeOfferIDs(count: count, excludeOwned: false) // Use false to ensure pool is identical despite inventory diff
        
        XCTAssertEqual(offerA, offerB, "Applying relic must NOT consume RNG state - offers diverged")
    }
    
    func testModifierStacking() {
        let rng = SeededRNG(seed: 1)
        let system = RelicSystem(db: db, rng: rng)
        
        // r1: damage +0.1
        system.applyRelic(id: "r1")
        XCTAssertEqual(system.towerDamageMultiplier, 1.1, accuracy: 0.001)
        
        // r1 again: damage +0.1 (Total 1.2)
        system.applyRelic(id: "r1")
        XCTAssertEqual(system.towerDamageMultiplier, 1.2, accuracy: 0.001)
        
        // r2: coin +0.2
        system.applyRelic(id: "r2")
        // Compatibility: Check combinedMultiplier too
        XCTAssertEqual(system.combinedMultiplier(for: .coinMultiplier), 1.2, accuracy: 0.001)
    }
    
    func testExcludeOwned() {
        let rng = SeededRNG(seed: 2)
        let system = RelicSystem(db: db, rng: rng)
        
        system.applyRelic(id: "r1")
        
        let offer = system.makeOfferIDs(count: 3, excludeOwned: true)
        XCTAssertFalse(offer.contains("r1"), "Offer should not contain owned relic")
    }
}
