// DefinitionsLoader.swift
// Portable JSON resource loader using Bundle.module

import Foundation

/// Loads JSON definitions from package resources
/// Uses Bundle.module for portability (works in tests, CI, and app integration)
public enum DefinitionsLoader {
    
    /// Load and decode JSON resource from package bundle
    public static func load<T: Decodable>(_ type: T.Type, from filename: String) throws -> T {
        let parts = filename.split(separator: ".", maxSplits: 1).map(String.init)
        let name = parts.first ?? filename
        let ext = (parts.count == 2) ? parts[1] : "json"
        
        guard let url = Bundle.module.url(forResource: name, withExtension: ext) else {
            throw DefinitionsError.resourceNotFound(filename)
        }
        
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw DefinitionsError.decodingFailed(filename, underlyingError: error)
        }
    }
    
    /// Load all game definitions from bundled JSON resources
    public static func loadAllDefinitions() throws -> GameDefinitions {
        let towers = try load(TowerDefinitions.self, from: "towers.json")
        let enemies = try load(EnemyDefinitions.self, from: "enemies.json")
        let relics = try load(RelicDefinitions.self, from: "relics.json")
        let maps = try load(MapDefinitions.self, from: "maps.json")
        var waves = try load(WaveDefinitions.self, from: "waves.json")
        
        // Sort wave spawns by tick for deterministic behavior
        waves = sortWaveSpawns(waves)
        
        return GameDefinitions(
            towers: towers,
            enemies: enemies,
            relics: relics,
            maps: maps,
            waves: waves
        )
    }
    
    /// Sort spawns within each wave by (spawnTick, originalIndex)
    /// Ensures stable deterministic behavior even with duplicate spawn ticks
    private static func sortWaveSpawns(_ waves: WaveDefinitions) -> WaveDefinitions {
        let sortedWaves = waves.waves.map { waveDef -> WaveDef in
            let sortedSpawns = waveDef.spawns.enumerated().sorted { lhs, rhs in
                // Primary: sort by spawnTick
                if lhs.element.spawnTick != rhs.element.spawnTick {
                    return lhs.element.spawnTick < rhs.element.spawnTick
                }
                // Secondary: preserve original order for same tick (stable sort)
                return lhs.offset < rhs.offset
            }.map { $0.element }
            
            return WaveDef(
                waveIndex: waveDef.waveIndex,
                spawns: sortedSpawns,
                coinReward: waveDef.coinReward,
                isBossWave: waveDef.isBossWave
            )
        }
        
        return WaveDefinitions(waves: sortedWaves)
    }
}

/// Errors that can occur during definition loading
public enum DefinitionsError: Error, LocalizedError {
    case resourceNotFound(String)
    case decodingFailed(String, underlyingError: Error)
    
    public var errorDescription: String? {
        switch self {
        case .resourceNotFound(let filename):
            return "Resource not found: \(filename)"
        case .decodingFailed(let filename, let error):
            return "Failed to decode \(filename): \(error.localizedDescription)"
        }
    }
}
