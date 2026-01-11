// WaveDef.swift
// Wave composition definitions

import Foundation

/// Enemy spawn entry in wave
public struct EnemySpawn: Codable, Equatable {
    public let enemyType: String
    public let spawnTick: Int  // relative to wave start
    
    public init(enemyType: String, spawnTick: Int) {
        self.enemyType = enemyType
        self.spawnTick = spawnTick
    }
}

/// Wave definition
public struct WaveDef: Codable, Equatable {
    public let waveIndex: Int
    public let spawns: [EnemySpawn]
    public let coinReward: Int
    public let isBossWave: Bool
    
    public init(waveIndex: Int, spawns: [EnemySpawn], coinReward: Int, isBossWave: Bool = false) {
        self.waveIndex = waveIndex
        self.spawns = spawns
        self.coinReward = coinReward
        self.isBossWave = isBossWave
    }
    
    public var totalEnemies: Int {
        return spawns.count
    }
}

/// Container for all wave definitions
public struct WaveDefinitions: Codable {
    public let waves: [WaveDef]
    
    public init(waves: [WaveDef]) {
        self.waves = waves
    }
    
    public func wave(at index: Int) -> WaveDef? {
        return waves.first { $0.waveIndex == index }
    }
    
    public var totalWaves: Int {
        return waves.count
    }
}
