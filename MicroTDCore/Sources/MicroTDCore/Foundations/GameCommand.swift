// GameCommand.swift
// Player input commands with timestamps for deterministic replay

import Foundation

/// Commands sent from UI layer to Core simulation
/// Each command includes the tick at which it was issued for replay support
public enum GameCommand: Equatable {
    case placeTower(type: String, gridX: Int, gridY: Int, tick: Int)
    case sellTower(gridX: Int, gridY: Int, tick: Int)
    case upgradeTower(gridX: Int, gridY: Int, upgradePath: String, tick: Int)
    case startWave(tick: Int)
    case chooseRelic(index: Int, tick: Int)
    
    /// Extract the tick from any command
    public var tick: Int {
        switch self {
        case .placeTower(_, _, _, let tick),
             .sellTower(_, _, let tick),
             .upgradeTower(_, _, _, let tick),
             .startWave(let tick),
             .chooseRelic(_, let tick):
            return tick
        }
    }
}

/// Log of all commands for deterministic replay
public struct CommandLog {
    public private(set) var commands: [GameCommand] = []
    
    public init() {}
    
    public mutating func append(_ command: GameCommand) {
        commands.append(command)
    }
    
    /// Verify commands are in chronological order
    public var isChronological: Bool {
        for i in 1..<commands.count {
            if commands[i].tick < commands[i-1].tick {
                return false
            }
        }
        return true
    }
}
