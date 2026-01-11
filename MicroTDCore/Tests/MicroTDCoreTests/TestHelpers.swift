// TestHelpers.swift
// Helper functions for loading test fixtures

import Foundation
@testable import MicroTDCore

/// Load JSON test fixtures
struct TestFixtures {
    static func loadDefinitions() throws -> GameDefinitions {
        // For tests, we'll create minimal definitions programmatically
        // In production, these would load from bundle resources
        
        let towerDef = TowerDef(
            id: "cannon",
            name: "Cannon",
            cost: 100,
            range: 2.5,
            fireRate: 1.0,
            damage: 20.0,
            description: "Basic tower",
            upgradePaths: []
        )
        
        let enemyRunnerDef = EnemyDef(
            id: "runner",
            name: "Runner",
            hp: 50.0,
            speed: 2.0,
            coinReward: 10,
            livesCost: 1,
            description: "Fast enemy"
        )
        
        let enemyTankDef = EnemyDef(
            id: "tank",
            name: "Tank",
            hp: 200.0,
            speed: 0.5,
            coinReward: 25,
            livesCost: 1,
            description: "Slow tanky enemy"
        )
        
        let relicDef = RelicDef(
            id: "power_amp",
            name: "Power Amp",
            description: "+50% damage",
            rarity: .common,
            effects: [RelicEffect(type: .towerDamageMultiplier, value: 1.5)]
        )
        
        let mapDef = MapDef(
            id: "default",
            name: "Default",
            gridWidth: 6,
            gridHeight: 6,
            waypoints: [
                Waypoint(position: GridPosition(x: 0, y: 3), pathProgress: 0.0),
                Waypoint(position: GridPosition(x: 2, y: 3), pathProgress: 0.33),
                Waypoint(position: GridPosition(x: 2, y: 1), pathProgress: 0.66),
                Waypoint(position: GridPosition(x: 5, y: 1), pathProgress: 1.0)
            ]
        )
        
        let wave0 = WaveDef(
            waveIndex: 0,
            spawns: [
                EnemySpawn(enemyType: "runner", spawnTick: 0),
                EnemySpawn(enemyType: "runner", spawnTick: 30),
                EnemySpawn(enemyType: "runner", spawnTick: 60)
            ],
            coinReward: 50
        )
        
        let wave1 = WaveDef(
            waveIndex: 1,
            spawns: [
                EnemySpawn(enemyType: "tank", spawnTick: 0),
                EnemySpawn(enemyType: "runner", spawnTick: 40)
            ],
            coinReward: 60
        )
        
        return GameDefinitions(
            towers: TowerDefinitions(towers: [towerDef]),
            enemies: EnemyDefinitions(enemies: [enemyRunnerDef, enemyTankDef]),
            relics: RelicDefinitions(relics: [relicDef]),
            maps: MapDefinitions(maps: [mapDef]),
            waves: WaveDefinitions(waves: [wave0, wave1])
        )
    }
}
