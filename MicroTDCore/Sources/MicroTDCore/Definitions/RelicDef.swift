// RelicDef.swift
// Relic definitions for roguelite choices

import Foundation

/// Effect modifier for relics
public struct RelicEffect: Codable, Equatable {
    public enum EffectType: String, Codable {
        case towerDamageMultiplier
        case towerRangeMultiplier
        case towerFireRateMultiplier
        case enemySlowOnHit
        case coinMultiplier
        case startingCoins
    }
    
    public let type: EffectType
    public let value: Double
    
    public init(type: EffectType, value: Double) {
        self.type = type
        self.value = value
    }
}

/// Relic rarity tiers
public enum RelicRarity: String, Codable {
    case common
    case uncommon
    case rare
    case legendary
}

/// Relic definition
public struct RelicDef: Codable, Equatable {
    public let id: String
    public let name: String
    public let description: String
    public let rarity: RelicRarity
    public let effects: [RelicEffect]
    
    public init(id: String, name: String, description: String, rarity: RelicRarity, effects: [RelicEffect]) {
        self.id = id
        self.name = name
        self.description = description
        self.rarity = rarity
        self.effects = effects
    }
}

/// Container for all relic definitions
public struct RelicDefinitions: Codable {
    public let relics: [RelicDef]
    
    public init(relics: [RelicDef]) {
        self.relics = relics
    }
    
    public func relic(withID id: String) -> RelicDef? {
        return relics.first { $0.id == id }
    }
    
    public func relics(withRarity rarity: RelicRarity) -> [RelicDef] {
        return relics.filter { $0.rarity == rarity }
    }
}
