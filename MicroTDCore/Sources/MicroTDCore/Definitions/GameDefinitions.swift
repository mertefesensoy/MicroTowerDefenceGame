// GameDefinitions.swift
// Aggregates all definitions for easy loading

import Foundation

/// Aggregates all game definitions
public struct GameDefinitions {
    public let towers: TowerDefinitions
    public let enemies: EnemyDefinitions
    public let relics: RelicDefinitions
    public let maps: MapDefinitions
    public let waves: WaveDefinitions
    
    public init(towers: TowerDefinitions, enemies: EnemyDefinitions, relics: RelicDefinitions, maps: MapDefinitions, waves: WaveDefinitions) {
        self.towers = towers
        self.enemies = enemies
        self.relics = relics
        self.maps = maps
        self.waves = waves
    }
    
    /// Load all definitions from bundled JSON resources
    public static func loadFromBundle() throws -> GameDefinitions {
        return try DefinitionsLoader.loadAllDefinitions()
    }
    
    /// Load all definitions from JSON data (for testing with custom data)
    public static func load(
        towersJSON: Data,
        enemiesJSON: Data,
        relicsJSON: Data,
        mapsJSON: Data,
        wavesJSON: Data
    ) throws -> GameDefinitions {
        let decoder = JSONDecoder()
        
        let towers = try decoder.decode(TowerDefinitions.self, from: towersJSON)
        let enemies = try decoder.decode(EnemyDefinitions.self, from: enemiesJSON)
        let relics = try decoder.decode(RelicDefinitions.self, from: relicsJSON)
        let maps = try decoder.decode(MapDefinitions.self, from: mapsJSON)
        let waves = try decoder.decode(WaveDefinitions.self, from: wavesJSON)
        
        return GameDefinitions(
            towers: towers,
            enemies: enemies,
            relics: relics,
            maps: maps,
            waves: waves
        )
    }
}
