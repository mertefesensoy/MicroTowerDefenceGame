// CombatTests.swift
// Test combat system damage, targeting, and slow effects

import XCTest
@testable import MicroTDCore

final class CombatTests: XCTestCase {
    
    func testDamageApplication() {
        // Setup
        let enemyDef = EnemyDef(id: "test", name: "Test", hp: 100, speed: 1.0, coinReward: 10, livesCost: 1, description: "Test enemy")
        let enemy = Enemy(instanceId: 1, typeID: "test", baseDef: enemyDef)
        
        XCTAssertEqual(enemy.currentHP, 100)
        XCTAssertTrue(enemy.isAlive)
        
        // Apply damage
        let died = enemy.takeDamage(30)
        XCTAssertFalse(died)
        XCTAssertEqual(enemy.currentHP, 70)
        XCTAssertTrue(enemy.isAlive)
    }
    
    func testEnemyDeath() {
        let enemyDef = EnemyDef(id: "test", name: "Test", hp: 50, speed: 1.0, coinReward: 10, livesCost: 1, description: "Test")
        let enemy = Enemy(instanceId: 1, typeID: "test", baseDef: enemyDef)
        
        // Deal killing blow
        let died = enemy.takeDamage(60)
        XCTAssertTrue(died)
        XCTAssertEqual(enemy.currentHP, -10)
        XCTAssertFalse(enemy.isAlive)
    }
    
    func testSlowRefresh() {
        let enemyDef = EnemyDef(id: "test", name: "Test", hp: 100, speed: 2.0, coinReward: 10, livesCost: 1, description: "Test")
        let enemy = Enemy(instanceId: 1, typeID: "test", baseDef: enemyDef)
        
        // Apply first slow: 30% for 60 ticks
        enemy.applySlow(amount: 0.3, durationTicks: 60)
        XCTAssertNotNil(enemy.slowEffect)
        XCTAssertEqual(enemy.slowEffect?.amount, 0.3)
        XCTAssertEqual(enemy.slowEffect?.remainingTicks, 60)
        XCTAssertEqual(enemy.effectiveSpeed, 2.0 * 0.7) // 30% slow = 70% speed
        
        // Tick down
        enemy.tickSlow()
        XCTAssertEqual(enemy.slowEffect?.remainingTicks, 59)
        
        // Apply second slow: 20% for 60 ticks (weaker)
        // Should keep stronger slow (30%) but refresh duration
        enemy.applySlow(amount: 0.2, durationTicks: 60)
        XCTAssertEqual(enemy.slowEffect?.amount, 0.3, "Should keep stronger slow")
        XCTAssertEqual(enemy.slowEffect?.remainingTicks, 60, "Should refresh duration")
        
        // Apply third slow: 50% for 30 ticks (stronger)
        // Should upgrade to stronger slow
        enemy.applySlow(amount: 0.5, durationTicks: 30)
        XCTAssertEqual(enemy.slowEffect?.amount, 0.5, "Should upgrade to stronger slow")
        XCTAssertEqual(enemy.slowEffect?.remainingTicks, 30)
    }
    
    func testSlowExpiry() {
        let enemyDef = EnemyDef(id: "test", name: "Test", hp: 100, speed: 2.0, coinReward: 10, livesCost: 1, description: "Test")
        let enemy = Enemy(instanceId: 1, typeID: "test", baseDef: enemyDef)
        
        enemy.applySlow(amount: 0.5, durationTicks: 2)
        XCTAssertNotNil(enemy.slowEffect)
        
        enemy.tickSlow()
        XCTAssertNotNil(enemy.slowEffect)
        XCTAssertEqual(enemy.slowEffect?.remainingTicks, 1)
        
        enemy.tickSlow()
        XCTAssertNil(enemy.slowEffect, "Slow should expire after duration")
        XCTAssertEqual(enemy.effectiveSpeed, 2.0, "Speed should return to normal")
    }
    
    func testTargeting() {
        let mapDef = MapDef(
            id: "test",
            name: "Test",
            gridWidth: 6,
            gridHeight: 6,
            waypoints: [
                Waypoint(position: GridPosition(x: 0, y: 0), pathProgress: 0.0),
                Waypoint(position: GridPosition(x: 5, y: 0), pathProgress: 1.0)
            ]
        )
        
        let combatSystem = CombatSystem(mapDef: mapDef)
        
        let towerDef = TowerDef(id: "test", name: "Test", cost: 100, range: 3.0, fireRate: 1.0, damage: 10, description: "Test", upgradePaths: [])
        let tower = Tower(instanceId: 1, typeID: "test", position: GridPosition(x: 2, y: 0), baseDef: towerDef)
        
        let enemyDef = EnemyDef(id: "test", name: "Test", hp: 100, speed: 1.0, coinReward: 10, livesCost: 1, description: "Test")
        
        let enemy1 = Enemy(instanceId: 1, typeID: "test", baseDef: enemyDef)
        enemy1.move(deltaProgress: 0.2) // Progress 0.2
        
        let enemy2 = Enemy(instanceId: 2, typeID: "test", baseDef: enemyDef)
        enemy2.move(deltaProgress: 0.5) // Progress 0.5 (closer to end)
        
        // Should target enemy2 (highest path progress)
        let target = combatSystem.findTarget(for: tower, enemies: [enemy1, enemy2])
        XCTAssertEqual(target?.instanceId, enemy2.instanceId, "Should target enemy with highest path progress")
    }
}
