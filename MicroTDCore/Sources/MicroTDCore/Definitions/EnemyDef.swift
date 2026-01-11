// EnemyDef.swift
// Enemy type definitions loaded from JSON

import Foundation

/// Enemy definition from JSON
public struct EnemyDef: Codable, Equatable {
    public let id: String
    public let name: String
    public let hp: Double
    public let speed: Double  // grid cells per second
    public let coinReward: Int
    public let livesCost: Int
    public let description: String
    public let isBoss: Bool
    
    public init(id: String, name: String, hp: Double, speed: Double, coinReward: Int, livesCost: Int, description: String, isBoss: Bool = false) {
        self.id = id
        self.name = name
        self.hp = hp
        self.speed = speed
        self.coinReward = coinReward
        self.livesCost = livesCost
        self.description = description
        self.isBoss = isBoss
    }
}

/// Container for all enemy definitions
public struct EnemyDefinitions: Codable {
    public let enemies: [EnemyDef]
    
    public init(enemies: [EnemyDef]) {
        self.enemies = enemies
    }
    
    public func enemy(withID id: String) -> EnemyDef? {
        return enemies.first{ $0.id == id }
    }
}
