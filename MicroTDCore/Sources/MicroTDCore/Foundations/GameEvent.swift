// GameEvent.swift
// Events emitted by Core simulation for rendering layer

import Foundation

/// Events emitted by simulation for rendering/UI consumption
/// These drive all visual updates - rendering layer must NOT have game logic
public enum GameEvent: Equatable {
    // LIFECYCLE events (include Int IDs for rendering)
    case enemySpawned(id: Int, type: String, pathProgress: Double, tick: Int)
    case enemyDied(id: Int, coinReward: Int, tick: Int)
    case enemyLeaked(id: Int, livesCost: Int, tick: Int)
    case towerPlaced(id: Int, type: String, gridX: Int, gridY: Int, tick: Int)
    case towerSold(id: Int, refund: Int, tick: Int)
    // Note: towerUpgraded removed - not part of Mission 2 scope
    
    // COSMETIC events (NO IDs - keeps golden tests stable)
    case enemyMoved(pathProgress: Double, tick: Int)  // Not needed for MVP
    case enemyDamaged(damage: Double, remainingHP: Double, tick: Int)
    case enemySlowed(slowAmount: Double, durationTicks: Int, tick: Int)
    case towerFired(damage: Double, tick: Int)
    
    // Economy events (NO IDs)
    case coinChanged(newTotal: Int, delta: Int, reason: String, tick: Int)
    case livesChanged(newTotal: Int, delta: Int, tick: Int)
    
    // Wave events
    case waveStarted(index: Int, enemyCount: Int, tick: Int)
    case waveCompleted(index: Int, reward: Int, tick: Int)
    
    // Relic events
    case relicOffered(choices: [String], tick: Int)
    case relicChosen(relicID: String, tick: Int)
    
    // Game state events
    case gameOver(wavesCompleted: Int, tick: Int)
    case runCompleted(wavesCompleted: Int, totalCoins: Int, tick: Int)
    
    /// Extract tick from any event
    public var tick: Int {
        switch self {
        case .enemySpawned(_, _, _, let tick),
             .enemyMoved(_, let tick),
             .enemyDamaged(_, _, let tick),
             .enemySlowed(_, _, let tick),
             .enemyDied(_, _, let tick),
             .enemyLeaked(_, _, let tick),
             .towerPlaced(_, _, _, _, let tick),
             .towerFired(_, let tick),
             .towerSold(_, _, let tick),
             .coinChanged(_, _, _, let tick),
             .livesChanged(_, _, let tick),
             .waveStarted(_, _, let tick),
             .waveCompleted(_, _, let tick),
             .relicOffered(_, let tick),
             .relicChosen(_, let tick),
             .gameOver(_, let tick),
             .runCompleted(_, _, let tick):
            return tick
        }
    }
}

/// Event log for rendering consumption and debugging
public struct EventLog {
    public private(set) var events: [GameEvent] = []
    
    public init() {}
    
    public mutating func emit(_ event: GameEvent) {
        events.append(event)
    }
    
    /// Get events from a specific index onward (for rendering consumption)
    /// Use with lastEventIndex tracking: read slice(from: lastIndex), then update lastIndex = events.count
    public func slice(from index: Int) -> ArraySlice<GameEvent> {
        guard index >= 0 && index <= events.count else { return [] }
        return events[index..<events.count]
    }
    
    /// Clear all events (for resetting)
    public mutating func clear() {
        events.removeAll()
    }
}
