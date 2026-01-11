// CombatSystem.swift
// Handles tower targeting, damage, and status effects

import Foundation

/// Combat system assumptions:
/// - Towers target enemy with **highest path progress** in range (strategic, stable)
/// - Instant damage application (no projectile simulation for MVP)
/// - Slow effect: **refresh duration, keep strongest, no stacking**
/// - Death detection immediate after damage
public final class CombatSystem {
    private let mapDef: MapDef
    
    public init(mapDef: MapDef) {
        self.mapDef = mapDef
    }
    
    /// Find best target for tower
    public func findTarget(for tower: Tower, enemies: [Enemy]) -> Enemy? {
        let inRange = enemies.filter { enemy in
            let enemyPos = calculatePosition(pathProgress: enemy.pathProgress)
            return tower.position.distance(to: enemyPos) <= tower.effectiveRange
        }
        
        // Target enemy with highest path progress (closest to end)
        return inRange.max(by: { $0.pathProgress < $1.pathProgress })
    }
    
    /// Execute tower attack on target
    public func executeAttack(tower: Tower, target: Enemy) -> CombatResult {
        let damage = tower.effectiveDamage
        let wasDied = target.takeDamage(damage)
        
        tower.recordDamage(damage)
        tower.resetFireCooldown()
        
        var result = CombatResult(
            damage: damage,
            targetDied: wasDied,
            targetRemainingHP: target.currentHP
        )
        
        // Apply slow if tower has slow-on-hit
        if tower.slowOnHit > 0 {
            let slowDuration = 60 // 1 second at 60 ticks/sec
            target.applySlow(amount: tower.slowOnHit, durationTicks: slowDuration)
            result.slowApplied = true
        }
        
        if wasDied {
            tower.recordKill()
        }
        
        return result
    }
    
    /// Calculate grid position from path progress
    private func calculatePosition(pathProgress: Double) -> GridPosition {
        let waypoints = mapDef.waypoints.sorted { $0.pathProgress < $1.pathProgress }
        
        guard !waypoints.isEmpty else {
            return GridPosition(x: 0, y: 0)
        }
        
        if pathProgress <= waypoints.first!.pathProgress {
            return waypoints.first!.position
        }
        
        if pathProgress >= waypoints.last!.pathProgress {
            return waypoints.last!.position
        }
        
        // Find segment
        for i in 0..<(waypoints.count - 1) {
            let start = waypoints[i]
            let end = waypoints[i + 1]
            
            if pathProgress >= start.pathProgress && pathProgress <= end.pathProgress {
                // Linear interpolation
                let t = (pathProgress - start.pathProgress) / (end.pathProgress - start.pathProgress)
                let x = Int(round(Double(start.position.x) * (1 - t) + Double(end.position.x) * t))
                let y = Int(round(Double(start.position.y) * (1 - t) + Double(end.position.y) * t))
                return GridPosition(x: x, y: y)
            }
        }
        
        return waypoints.last!.position
    }
}

/// Result of a combat action
public struct CombatResult {
    public let damage: Double
    public let targetDied: Bool
    public let targetRemainingHP: Double
    public var slowApplied: Bool = false
    
    public init(damage: Double, targetDied: Bool, targetRemainingHP: Double, slowApplied: Bool = false) {
        self.damage = damage
        self.targetDied = targetDied
        self.targetRemainingHP = targetRemainingHP
        self.slowApplied = slowApplied
    }
}
