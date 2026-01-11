// EconomySystem.swift
// Manages coins and rewards

import Foundation

/// Economy system for coins and rewards
public final class EconomySystem {
    public private(set) var coins: Int
    public private(set) var startingCoins: Int
    
    public init(startingCoins: Int = 200) {
        self.startingCoins = startingCoins
        self.coins = startingCoins
    }
    
    /// Add coins
    @discardableResult
    public func addCoins(_ amount: Int, reason: String = "reward") -> Int {
        coins += amount
        return coins
    }
    
    /// Spend coins if available
    public func spendCoins(_ amount: Int) -> Bool {
        guard coins >= amount else { return false }
        coins -= amount
        return true
    }
    
    /// Check if can afford
    public func canAfford(_ cost: Int) -> Bool {
        return coins >= cost
    }
    
    /// Reset for new run
    public func reset(startingCoins: Int) {
        self.startingCoins = startingCoins
        self.coins = startingCoins
    }
}
