// TowerDef.swift
// Tower type definitions loaded from JSON

import Foundation

/// Tower definition from JSON
public struct TowerDef: Codable, Equatable {
    public let id: String
    public let name: String
    public let cost: Int
    public let range: Double
    public let fireRate: Double  // attacks per second
    public let damage: Double
    public let description: String
    public let upgradePaths: [String]
    
    public init(id: String, name: String, cost: Int, range: Double, fireRate: Double, damage: Double, description: String, upgradePaths: [String]) {
        self.id = id
        self.name = name
        self.cost = cost
        self.range = range
        self.fireRate = fireRate
        self.damage = damage
        self.description = description
        self.upgradePaths = upgradePaths
    }
}

/// Container for all tower definitions
public struct TowerDefinitions: Codable {
    public let towers: [TowerDef]
    
    public init(towers: [TowerDef]) {
        self.towers = towers
    }
    
    public func tower(withID id: String) -> TowerDef? {
        return towers.first { $0.id == id }
    }
}
