// RelicSystem.swift
// Generates and manages relic choices

import Foundation

/// Relic choice generation and effect application
public final class RelicSystem {
    private let relicDefs: RelicDefinitions
    private let rng: SeededRNG
    public private(set) var activeRelics: [Relic] = []
    
    public init(relicDefs: RelicDefinitions, rng: SeededRNG) {
        self.relicDefs = relicDefs
        self.rng = rng
    }
    
    /// Generate 3 relic choices deterministically
    public func generateChoices(count: Int = 3) -> [RelicDef] {
        var available = relicDefs.relics
        available.shuffle() // Uses the rng internally if we provide it
        
        // For now, simple random selection
        // In full version, would use rarity weighting
        var choices: [RelicDef] = []
        for _ in 0..<min(count, available.count) {
            if let choice = rng.choose(from: available) {
                choices.append(choice)
                available.removeAll { $0.id == choice.id }
            }
        }
        
        return choices
    }
    
    /// Add chosen relic to active relics
    public func chooseRelic(id: String) -> Bool {
        guard let def = relicDefs.relic(withID: id) else { return false }
        let relic = Relic(id: id, def: def)
        activeRelics.append(relic)
        return true
    }
    
    /// Get combined multiplier for effect type
    public func combinedMultiplier(for effectType: RelicEffect.EffectType) -> Double {
        var total = 1.0
        for relic in activeRelics {
            total *= relic.multiplier(for: effectType)
        }
        return total
    }
    
    /// Get combined additive value for effect type
    public func combinedAdditiveValue(for effectType: RelicEffect.EffectType) -> Double {
        var total = 0.0
        for relic in activeRelics {
            total += relic.additiveValue(for: effectType)
        }
        return total
    }
    
    /// Reset for new run
    public func reset() {
        activeRelics.removeAll()
    }
}
