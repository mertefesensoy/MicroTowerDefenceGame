// WaveSystem.swift
// Manages enemy wave spawning deterministically

import Foundation

/// Wave spawning and management system
public final class WaveSystem {
    private let waveDefs: WaveDefinitions
    private let enemyDefs: EnemyDefinitions
    private let rng: SeededRNG
    
    private var currentWaveIndex: Int = -1
    private var currentWaveDef: WaveDef?
    private var waveStartTick: Int = 0
    private var spawnedIndices: Set<Int> = []
    
    public init(waveDefs: WaveDefinitions, enemyDefs: EnemyDefinitions, rng: SeededRNG) {
        self.waveDefs = waveDefs
        self.enemyDefs = enemyDefs
        self.rng = rng
    }
    
    /// Start the next wave
    public func startWave(currentTick: Int) -> WaveDef? {
        currentWaveIndex += 1
        guard let waveDef = waveDefs.wave(at: currentWaveIndex) else {
            return nil
        }
        
        currentWaveDef = waveDef
        waveStartTick = currentTick
        spawnedIndices.removeAll()
        
        return waveDef
    }
    
    /// Check for and return enemies to spawn this tick
    public func checkSpawns(currentTick: Int) -> [(String, EnemyDef)] {
        guard let waveDef = currentWaveDef else { return [] }
        
        let ticksIntoWave = currentTick - waveStartTick
        var toSpawn: [(String, EnemyDef)] = []
        
        for (index, spawn) in waveDef.spawns.enumerated() {
            if spawn.spawnTick == ticksIntoWave && !spawnedIndices.contains(index) {
                if let enemyDef = enemyDefs.enemy(withID: spawn.enemyType) {
                    toSpawn.append((spawn.enemyType, enemyDef))
                    spawnedIndices.insert(index)
                }
            }
        }
        
        return toSpawn
    }
    
    /// Check if current wave is complete (all enemies spawned)
    public func isWaveSpawningComplete() -> Bool {
        guard let waveDef = currentWaveDef else { return false }
        return spawnedIndices.count == waveDef.spawns.count
    }
    
    public var totalWaves: Int {
        return waveDefs.totalWaves
    }
    
    public var currentWave: Int {
        return currentWaveIndex
    }
}
