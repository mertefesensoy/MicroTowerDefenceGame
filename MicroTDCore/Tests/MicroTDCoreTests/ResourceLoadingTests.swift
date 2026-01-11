// ResourceLoadingTests.swift
// Verify Bundle.module resource loading works correctly

import XCTest
@testable import MicroTDCore

final class ResourceLoadingTests: XCTestCase {
    
    /// Test that GameDefinitions.loadFromBundle() successfully loads all JSON resources
    /// This proves Bundle.module is correctly configured and resources are bundled
    func testLoadFromBundle() throws {
        // This is the CRITICAL test that proves Bundle.module works
        let definitions = try GameDefinitions.loadFromBundle()
        
        // Verify all definition types loaded
        XCTAssertGreaterThan(definitions.towers.towers.count, 0, "Should load tower definitions")
        XCTAssertGreaterThan(definitions.enemies.enemies.count, 0, "Should load enemy definitions")
        XCTAssertGreaterThan(definitions.relics.relics.count, 0, "Should load relic definitions")
        XCTAssertGreaterThan(definitions.maps.maps.count, 0, "Should load map definitions")
        XCTAssertGreaterThan(definitions.waves.waves.count, 0, "Should load wave definitions")
        
        // Verify specific expected content from JSON files
        XCTAssertNotNil(definitions.towers.tower(withID: "cannon"), "Should load cannon tower")
        XCTAssertNotNil(definitions.towers.tower(withID: "frost"), "Should load frost tower")
        XCTAssertNotNil(definitions.towers.tower(withID: "bomb"), "Should load bomb tower")
        
        XCTAssertNotNil(definitions.enemies.enemy(withID: "runner"), "Should load runner enemy")
        XCTAssertNotNil(definitions.enemies.enemy(withID: "tank"), "Should load tank enemy")
        
        XCTAssertNotNil(definitions.maps.map(withID: "default"), "Should load default map")
        
        // Verify waves loaded and are sorted by spawnTick
        XCTAssertEqual(definitions.waves.totalWaves, 12, "Should have 12 waves")
        
        // Verify wave 11 spawns are in chronological order (0, 60, 120, 180, 200)
        if let wave11 = definitions.waves.wave(at: 11) {
            XCTAssertEqual(wave11.spawns.count, 5, "Wave 11 should have 5 spawns")
            XCTAssertEqual(wave11.spawns[0].spawnTick, 0)
            XCTAssertEqual(wave11.spawns[1].spawnTick, 60)
            XCTAssertEqual(wave11.spawns[2].spawnTick, 120)
            XCTAssertEqual(wave11.spawns[3].spawnTick, 180)
            XCTAssertEqual(wave11.spawns[4].spawnTick, 200)
        } else {
            XCTFail("Wave 11 should exist")
        }
    }
    
    /// Test that individual resource loading works
    func testLoadIndividualResources() throws {
        let towers = try DefinitionsLoader.load(TowerDefinitions.self, from: "towers.json")
        XCTAssertEqual(towers.towers.count, 3, "Should load 3 tower types")
        
        let enemies = try DefinitionsLoader.load(EnemyDefinitions.self, from: "enemies.json")
        XCTAssertGreaterThan(enemies.enemies.count, 0, "Should load enemies")
        
        let relics = try DefinitionsLoader.load(RelicDefinitions.self, from: "relics.json")
        XCTAssertGreaterThan(relics.relics.count, 0, "Should load relics")
        
        let maps = try DefinitionsLoader.load(MapDefinitions.self, from: "maps.json")
        XCTAssertEqual(maps.maps.count, 1, "Should load 1 map")
        
        let waves = try DefinitionsLoader.load(WaveDefinitions.self, from: "waves.json")
        XCTAssertEqual(waves.waves.count, 12, "Should load 12 waves")
    }
    
    /// Test that missing resources throw appropriate errors
    func testMissingResourceError() {
        XCTAssertThrowsError(try DefinitionsLoader.load(TowerDefinitions.self, from: "nonexistent.json")) { error in
            if case DefinitionsError.resourceNotFound(let filename) = error {
                XCTAssertEqual(filename, "nonexistent.json")
            } else {
                XCTFail("Should throw resourceNotFound error")
            }
        }
    }
}
