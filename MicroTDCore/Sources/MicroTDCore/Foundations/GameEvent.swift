// GameEvent.swift
// Events emitted by Core simulation for rendering layer

import Foundation

/// Events emitted by simulation for rendering/UI consumption
/// These drive all visual updates - rendering layer must NOT have game logic
public enum GameEvent: Equatable {
    // Enemy events
    case enemySpawned(id: UUID, type: String, pathProgress: Double, tick: Int)
    case enemyMoved(id: UUID, pathProgress: Double, tick: Int)
    case enemyDamaged(id: UUID, damage: Double, remainingHP: Double, tick: Int)
    case enemySlowed(id: UUID, slowAmount: Double, durationTicks: Int, tick: Int)
    case enemyDied(id: UUID, coinReward: Int, tick: Int)
    case enemyLeaked(id: UUID, livesCost: Int, tick: Int)
    
    // Tower events
    case towerPlaced(id: UUID, type: String, gridX: Int, gridY: Int, tick: Int)
    case towerFired(towerID: UUID, targetID: UUID, damage: Double, tick: Int)
    case towerSold(id: UUID, refund: Int, tick: Int)
    case towerUpgraded(id: UUID, upgradePath: String, tick: Int)
    
    // Economy events
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
             .enemyMoved(_, _, let tick),
             .enemyDamaged(_, _, _, let tick),
             .enemySlowed(_, _, _, let tick),
             .enemyDied(_, _, let tick),
             .enemyLeaked(_, _, let tick),
             .towerPlaced(_, _, _, _, let tick),
             .towerFired(_, _, _, let tick),
             .towerSold(_, _, let tick),
             .towerUpgraded(_, _, let tick),
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
    
    /// Get events since last read (for rendering consumption)
    public mutating func drainNew(since lastTick: Int) -> [GameEvent] {
        let newEvents = events.filter { $0.tick > lastTick }
        return newEvents
    }
    
    /// Clear all events (for resetting)
    public mutating func clear() {
        events.removeAll()
    }
}
