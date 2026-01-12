// Tower.swift
// Runtime tower entity

import Foundation

/// Runtime tower instance placed on grid
public final class Tower {
    public let instanceId: Int  // Deterministic ID for rendering
    public let typeID: String
    public let position: GridPosition
    public let baseDef: TowerDef
    
    // Runtime state
    public private(set) var ticksSinceLastFire: Int = 0
    public private(set) var kills: Int = 0
    public private(set) var totalDamage: Double = 0
    
    // Modified stats (from relics/upgrades)
    public var damageMultiplier: Double = 1.0
    public var rangeMultiplier: Double = 1.0
    public var fireRateMultiplier: Double = 1.0
    public var slowOnHit: Double = 0.0
    
    public init(instanceId: Int, typeID: String, position: GridPosition, baseDef: TowerDef) {
        self.instanceId = instanceId
        self.typeID = typeID
        self.position = position
        self.baseDef = baseDef
    }
    
    public var effectiveDamage: Double {
        return baseDef.damage * damageMultiplier
    }
    
    public var effectiveRange: Double {
        return baseDef.range * rangeMultiplier
    }
    
    public var effectiveFireRate: Double {
        return baseDef.fireRate * fireRateMultiplier
    }
    
    public var ticksPerShot: Int {
        return Int(Double(SimulationClock.ticksPerSecond) / effectiveFireRate)
    }
    
    public func canFire() -> Bool {
        return ticksSinceLastFire >= ticksPerShot
    }
    
    public func incrementTick() {
        ticksSinceLastFire += 1
    }
    
    public func resetFireCooldown() {
        ticksSinceLastFire = 0
    }
    
    public func recordDamage(_ damage: Double) {
        totalDamage += damage
    }
    
    public func recordKill() {
        kills += 1
    }
}
