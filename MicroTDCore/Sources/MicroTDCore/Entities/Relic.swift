// Relic.swift
// Runtime active relic

import Foundation

/// Runtime active relic instance
public struct Relic {
    public let id: String
    public let def: RelicDef
    
    public init(id: String, def: RelicDef) {
        self.id = id
        self.def = def
    }
    
    /// Get multiplier for specific effect type
    public func multiplier(for effectType: RelicEffect.EffectType) -> Double {
        var total = 1.0
        for effect in def.effects where effect.type == effectType {
            total *= effect.value
        }
        return total
    }
    
    /// Get additive value for specific effect type
    public func additiveValue(for effectType: RelicEffect.EffectType) -> Double {
        var total = 0.0
        for effect in def.effects where effect.type == effectType {
            total += effect.value
        }
        return total
    }
}
