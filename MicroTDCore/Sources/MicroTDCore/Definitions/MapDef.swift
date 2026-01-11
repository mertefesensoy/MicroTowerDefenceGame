// MapDef.swift
// Map layout and path definitions

import Foundation

/// 2D grid position
public struct GridPosition: Codable, Equatable, Hashable {
    public let x: Int
    public let y: Int
    
    public init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }
    
    public func distance(to other: GridPosition) -> Double {
        let dx = Double(x - other.x)
        let dy = Double(y - other.y)
        return sqrt(dx * dx + dy * dy)
    }
}

/// Waypoint along enemy path
public struct Waypoint: Codable, Equatable {
    public let position: GridPosition
    public let pathProgress: Double  // 0.0 to 1.0
    
    public init(position: GridPosition, pathProgress: Double) {
        self.position = position
        self.pathProgress = pathProgress
    }
}

/// Map definition
public struct MapDef: Codable, Equatable {
    public let id: String
    public let name: String
    public let gridWidth: Int
    public let gridHeight: Int
    public let waypoints: [Waypoint]
    public let blockedTiles: [GridPosition]
    
    public init(id: String, name: String, gridWidth: Int, gridHeight: Int, waypoints: [Waypoint], blockedTiles: [GridPosition] = []) {
        self.id = id
        self.name = name
        self.gridWidth = gridWidth
        self.gridHeight = gridHeight
        self.waypoints = waypoints
        self.blockedTiles = blockedTiles
    }
    
    public func isValidPlacement(_ position: GridPosition) -> Bool {
        // Check bounds
        guard position.x >= 0 && position.x < gridWidth &&
              position.y >= 0 && position.y < gridHeight else {
            return false
        }
        
        // Check not on path or blocked
        return !waypoints.contains { $0.position == position } &&
               !blockedTiles.contains(position)
    }
}

/// Container for map definitions
public struct MapDefinitions: Codable {
    public let maps: [MapDef]
    
    public init(maps: [MapDef]) {
        self.maps = maps
    }
    
    public func map(withID id: String) -> MapDef? {
        return maps.first { $0.id == id }
    }
}
