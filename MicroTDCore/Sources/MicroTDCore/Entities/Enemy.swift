// Enemy.swift
// Runtime enemy entity

import Foundation

/// Slow effect active on enemy
public struct SlowEffect {
    public let amount: Double  // 0.0 to 1.0 (1.0 = full slow, 0% speed)
    public var remainingTicks: Int
    
    public init(amount: Double, remainingTicks: Int) {
        self.amount = amount
        self.remainingTicks = remainingTicks
    }
}

/// Runtime enemy instance moving along path
public final class Enemy {
    public let id: UUID
    public let typeID: String
    public let baseDef: EnemyDef
    
    // Runtime state
    public private(set) var currentHP: Double
    public private(set) var pathProgress: Double = 0.0
    public private(set) var slowEffect: SlowEffect?
    
    public init(id: UUID = UUID(), typeID: String, baseDef: EnemyDef) {
        self.id = id
        self.typeID = typeID
        self.baseDef = baseDef
        self.currentHP = baseDef.hp
    }
    
    public var isAlive: Bool {
        return currentHP > 0
    }
    
    public var hasReachedEnd: Bool {
        return pathProgress >= 1.0
    }
    
    public var effectiveSpeed: Double {
        if let slow = slowEffect {
            return baseDef.speed * (1.0 - slow.amount)
        }
        return baseDef.speed
    }
    
    /// Apply damage and return whether enemy died
    @discardableResult
    public func takeDamage(_ damage: Double) -> Bool {
        currentHP -= damage
        return currentHP <= 0
    }
    
    /// Apply slow effect (refresh duration, keep strongest)
    public func applySlow(amount: Double, durationTicks: Int) {
        if let existing = slowEffect {
            // Keep strongest slow, refresh duration
            let strongestAmount = max(existing.amount, amount)
            slowEffect = SlowEffect(amount: strongestAmount, remainingTicks: durationTicks)
        } else {
            slowEffect = SlowEffect(amount: amount, remainingTicks: durationTicks)
        }
    }
    
    /// Move enemy along path
    public func move(deltaProgress: Double) {
        pathProgress += deltaProgress
    }
    
    /// Update slow effect duration
    public func tickSlow() {
        guard var slow = slowEffect else { return }
        slow.remainingTicks -= 1
        if slow.remainingTicks <= 0 {
            slowEffect = nil
        } else {
            slowEffect = slow
        }
    }
}
