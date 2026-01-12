// RelicSystem.swift
// Manages relic inventory and offers (Deterministic RNG)

import Foundation

public final class RelicSystem {
    private let db: RelicDatabase
    private var rng: SeededRNG
    
    // Inventory: RelicID -> Stack Count
    public private(set) var owned: [String: Int] = [:]
    
    // Core Modifiers (Cached for performance, recomputed on inventory change)
    public private(set) var towerDamageMultiplier: Double = 1.0
    public private(set) var towerRangeMultiplier: Double = 1.0
    public private(set) var towerFireRateMultiplier: Double = 1.0
    public private(set) var coinMultiplier: Double = 1.0
    public private(set) var enemySlowOnHit: Double = 0.0
    
    public init(db: RelicDatabase, rng: SeededRNG) {
        self.db = db
        self.rng = rng
    }
    
    /// Generate a list of relic IDs to offer
    public func makeOfferIDs(count: Int, excludeOwned: Bool = true) -> [String] {
        // Pool construction
        let pool = excludeOwned
            ? db.all.filter { owned[$0.id] == nil }
            : db.all
        
        // If pool is smaller than count, return everything (shuffled)
        if pool.count <= count {
            var allIds = pool.map(\.id)
            rng.shuffle(&allIds)
            return allIds
        }
        
        // Deterministic selection
        var temp = pool.map(\.id)
        rng.shuffle(&temp)
        
        return Array(temp.prefix(count))
    }
    
    /// Apply a chosen relic (RNG-Free)
    public func applyRelic(id: String) {
        owned[id, default: 0] += 1
        recomputeModifiers()
    }
    
    private func recomputeModifiers() {
        // Reset defaults
        towerDamageMultiplier = 1.0
        towerRangeMultiplier = 1.0
        towerFireRateMultiplier = 1.0
        coinMultiplier = 1.0
        enemySlowOnHit = 0.0
        
        // Iterate owned relics and stack effects
        for (id, count) in owned {
            guard let relic = db.relic(id: id) else { continue }
            
            for effect in relic.effects {
                let totalValue = effect.value * Double(count)
                
                switch effect.type {
                case .towerDamageMultiplier:
                    towerDamageMultiplier += totalValue 
                case .towerRangeMultiplier:
                    towerRangeMultiplier += totalValue
                case .towerFireRateMultiplier:
                    towerFireRateMultiplier += totalValue
                case .coinMultiplier:
                    coinMultiplier += totalValue
                case .enemySlowOnHit:
                    enemySlowOnHit += totalValue
                case .startingCoins:
                    break 
                }
            }
        }
    }
    
    // For manual restoration / testing
    public func setOwned(_ newOwned: [String: Int]) {
        self.owned = newOwned
        recomputeModifiers()
    }
}
