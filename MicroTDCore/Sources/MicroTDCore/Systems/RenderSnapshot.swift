// RenderSnapshot.swift
// Rendering-only data transfer objects
// SpriteKit consumes these DTOs, NEVER Core entity types

import Foundation

/// Render-only enemy data (id + position)
public struct RenderEnemy {
    public let id: Int
    public let type: String
    public let pathProgress: Double
    
    public init(id: Int, type: String, pathProgress: Double) {
        self.id = id
        self.type = type
        self.pathProgress = pathProgress
    }
}

/// Render-only tower data (id + grid position)
public struct RenderTower {
    public let id: Int
    public let type: String
    public let gridX: Int
    public let gridY: Int
    
    public init(id: Int, type: String, gridX: Int, gridY: Int) {
        self.id = id
        self.type = type
        self.gridX = gridX
        self.gridY = gridY
    }
}

/// Complete render snapshot (no gameplay state, only what Sprite needs to render)
public struct RenderSnapshot {
    public let enemies: [RenderEnemy]
    public let towers: [RenderTower]
    
    public init(enemies: [RenderEnemy], towers: [RenderTower]) {
        self.enemies = enemies
        self.towers = towers
    }
}
