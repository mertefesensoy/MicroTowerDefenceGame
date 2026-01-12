// GameState.swift
// Authoritative game state - processes commands, runs simulation, emits events

import Foundation

/// Main game state - pure Swift, deterministic, testable
/// NO UI imports allowed in this file
public final class GameState {
    // Core config
    public let runSeed: UInt64
    public let definitions: GameDefinitions
    
    // Systems
    private let rng: SeededRNG
    private let clock: SimulationClock
    private var stateMachine: RunStateMachine
    private let waveSystem: WaveSystem
    private let combatSystem: CombatSystem
    private let economySystem: EconomySystem
    private let relicSystem: RelicSystem
    
    // Runtime state
    private let mapDef: MapDef
    public private(set) var towers: [Tower] = []
    public private(set) var enemies: [Enemy] = []
    public private(set) var lives: Int
    private var towerGrid: [GridPosition: Tower] = [:]
    
    // Deterministic ID assignment (monotonic counters)
    private var nextEnemyInstanceId: Int = 1
    private var nextTowerInstanceId: Int = 1
    
    // Output
    public private(set) var eventLog: EventLog = EventLog()
    public private(set) var commandLog: CommandLog = CommandLog()
    
    // Config
    private let startingLives: Int = 20
    private let relicOfferInterval: Int = 2  // every 2 waves
    
    public init(runSeed: UInt64, definitions: GameDefinitions, mapID: String = "default") {
        self.runSeed = runSeed
        self.definitions = definitions
        
        // Initialize systems
        self.rng = SeededRNG(seed: runSeed)
        self.clock = SimulationClock()
        self.stateMachine = RunStateMachine(initialState: .preRun)
        
        guard let map = definitions.maps.map(withID: mapID) else {
            fatalError("Map '\(mapID)' not found")
        }
        self.mapDef = map
        
        self.waveSystem = WaveSystem(
            waveDefs: definitions.waves,
            enemyDefs: definitions.enemies,
            rng: rng
        )
        self.combatSystem = CombatSystem(mapDef: map)
        self.economySystem = EconomySystem(startingCoins: 200)
        self.relicSystem = RelicSystem(
            relicDefs: definitions.relics,
            rng: rng
        )
        
        self.lives = startingLives
        
        // Start at building phase for wave 0
        try? stateMachine.transition(to: .building(waveIndex: 0))
    }
    
    // MARK: - Public Interface
    
    public var currentTick: Int {
        return clock.currentTick
    }
    
    public var currentState: RunState {
        return stateMachine.state
    }
    
    public var currentCoins: Int {
        return economySystem.coins
    }
    
    public var currentLives: Int {
        return lives
    }
    
    /// Get render snapshot for SpriteKit (DTOs only, no Core entity types)
    public func getRenderSnapshot() -> RenderSnapshot {
        let renderEnemies = enemies.map { enemy in
            RenderEnemy(id: enemy.instanceId, type: enemy.typeID, pathProgress: enemy.pathProgress)
        }
        let renderTowers = towers.map { tower in
            RenderTower(id: tower.instanceId, type: tower.typeID, gridX: tower.position.x, gridY: tower.position.y)
        }
        return RenderSnapshot(enemies: renderEnemies, towers: renderTowers)
    }
    
    /// Main simulation tick - advances game by one fixed timestep
    public func tick() {
        // Advance clock by exactly one tick (60 Hz fixed timestep)
        clock.step()
        let tick = clock.currentTick
        
        // Check wave spawns
        let spawnsThisTick = waveSystem.checkSpawns(currentTick: tick)
        for (typeID, enemyDef) in spawnsThisTick {
            let enemyId = nextEnemyInstanceId
            nextEnemyInstanceId += 1  // SINGLE INCREMENT SITE for enemy IDs
            
            let enemy = Enemy(instanceId: enemyId, typeID: typeID, baseDef: enemyDef)
            enemies.append(enemy)
            eventLog.emit(.enemySpawned(id: enemyId, type: typeID, pathProgress: 0.0, tick: tick))
        }
        
        // Tower firing
        for tower in towers {
            tower.incrementTick()
            
            if tower.canFire() {
                if let target = combatSystem.findTarget(for: tower, enemies: enemies) {
                    let result = combatSystem.executeAttack(tower: tower, target: target)
                    
                    eventLog.emit(.towerFired(damage: result.damage, tick: tick))
                    eventLog.emit(.enemyDamaged(damage: result.damage, remainingHP: result.targetRemainingHP, tick: tick))
                    
                    if result.slowApplied {
                        eventLog.emit(.enemySlowed(slowAmount: tower.slowOnHit, durationTicks: 60,  tick: tick))
                    }
                    
                    if result.targetDied {
                        let coinReward = target.baseDef.coinReward
                        economySystem.addCoins(coinReward, reason: "kill")
                        eventLog.emit(.enemyDied(id: target.instanceId, coinReward: coinReward, tick: tick))
                        eventLog.emit(.coinChanged(newTotal: economySystem.coins, delta: coinReward, reason: "kill", tick: tick))
                    }
                }
            }
        }
        
        // Move enemies
        let progressPerTick = 1.0 / Double(SimulationClock.ticksPerSecond)
        for enemy in enemies {
            if enemy.isAlive {
                let moveAmount = enemy.effectiveSpeed * progressPerTick
                enemy.move(deltaProgress: moveAmount)
                enemy.tickSlow()
                
                // Check if reached end
                if enemy.hasReachedEnd {
                    lives -= enemy.baseDef.livesCost
                    eventLog.emit(.enemyLeaked(id: enemy.instanceId, livesCost: enemy.baseDef.livesCost, tick: tick))
                    eventLog.emit(.livesChanged(newTotal: lives, delta: -enemy.baseDef.livesCost, tick: tick))
                    
                    if lives <= 0 {
                        try? stateMachine.transition(to: .gameOver)
                        eventLog.emit(.gameOver(wavesCompleted: waveSystem.currentWave, tick: tick))
                    }
                }
            }
        }
        
        // Clean up dead/leaked enemies
        enemies.removeAll { !$0.isAlive || $0.hasReachedEnd }
        
        // Check wave completion
        if case .inWave(let waveIndex) = stateMachine.state {
            if waveSystem.isWaveSpawningComplete() && enemies.isEmpty {
                // Wave complete!
                if let waveDef = definitions.waves.wave(at: waveIndex) {
                    economySystem.addCoins(waveDef.coinReward, reason: "wave_complete")
                    eventLog.emit(.waveCompleted(index: waveIndex, reward: waveDef.coinReward, tick: tick))
                    eventLog.emit(.coinChanged(newTotal: economySystem.coins, delta: waveDef.coinReward, reason: "wave_complete", tick: tick))
                }
                
                // Check for relic offer
                if (waveIndex + 1) % relicOfferInterval == 0 {
                    try? stateMachine.transition(to: .relicChoice(waveIndex: waveIndex))
                    let choices = relicSystem.generateChoices(count: 3)
                    let choiceIDs = choices.map { $0.id }
                    eventLog.emit(.relicOffered(choices: choiceIDs, tick: tick))
                } else {
                    // Move to next wave building
                    try? stateMachine.transition(to: .building(waveIndex: waveIndex + 1))
                }
            }
        }
    }
    
    /// Process player command
    public func processCommand(_ command: GameCommand) {
        commandLog.append(command)
        
        switch command {
        case .placeTower(let type, let gridX, let gridY, _):
            placeTower(type: type, at: GridPosition(x: gridX, y: gridY))
            
        case .sellTower(let gridX, let gridY, _):
            sellTower(at: GridPosition(x: gridX, y: gridY))
            
        case .startWave(_):
            startNextWave()
            
        case .chooseRelic(let index, _):
            chooseRelicAtIndex(index)
            
        case .upgradeTower:
            break // TODO: implement upgrades
        }
    }
    
    // MARK: - Private Implementation
    
    private func placeTower(type: String, at position: GridPosition) {
        guard case .building = stateMachine.state else { return }
        guard let towerDef = definitions.towers.tower(withID: type) else { return }
        guard mapDef.isValidPlacement(position) else { return }
        guard towerGrid[position] == nil else { return }
        guard economySystem.spendCoins(towerDef.cost) else { return }
        
        let towerId = nextTowerInstanceId
        nextTowerInstanceId += 1  // SINGLE INCREMENT SITE for tower IDs
        
        let tower = Tower(instanceId: towerId, typeID: type, position: position, baseDef: towerDef)
        
        // Apply relic modifiers
        tower.damageMultiplier = relicSystem.combinedMultiplier(for: .towerDamageMultiplier)
        tower.rangeMultiplier = relicSystem.combinedMultiplier(for: .towerRangeMultiplier)
        tower.fireRateMultiplier = relicSystem.combinedMultiplier(for: .towerFireRateMultiplier)
        tower.slowOnHit = relicSystem.combinedAdditiveValue(for: .enemySlowOnHit)
        
        towers.append(tower)
        towerGrid[position] = tower
        
        eventLog.emit(.towerPlaced(id: tower.instanceId, type: type, gridX: position.x, gridY: position.y, tick: currentTick))
        eventLog.emit(.coinChanged(newTotal: economySystem.coins, delta: -towerDef.cost, reason: "tower_purchase", tick: currentTick))
    }
    
    private func sellTower(at position: GridPosition) {
        guard case .building = stateMachine.state else { return }
        guard let tower = towerGrid[position] else { return }
        
        let refund = tower.baseDef.cost / 2
        economySystem.addCoins(refund, reason: "tower_sell")
        
        towers.removeAll { $0.instanceId == tower.instanceId }
        towerGrid.removeValue(forKey: position)
        
        eventLog.emit(.towerSold(id: tower.instanceId, refund: refund, tick: currentTick))
        eventLog.emit(.coinChanged(newTotal: economySystem.coins, delta: refund, reason: "tower_sell", tick: currentTick))
    }
    
    private func startNextWave() {
        guard case .building(let waveIndex) = stateMachine.state else { return }
        
        if let waveDef = waveSystem.startWave(currentTick: currentTick) {
            try? stateMachine.transition(to: .inWave(waveIndex: waveIndex))
            eventLog.emit(.waveStarted(index: waveIndex, enemyCount: waveDef.totalEnemies, tick: currentTick))
        }
    }
    
    private func chooseRelicAtIndex(_ index: Int) {
        guard case .relicChoice(let waveIndex) = stateMachine.state else { return }
        
        let choices = relicSystem.generateChoices(count: 3)
        guard index >= 0 && index < choices.count else { return }
        
        let chosen = choices[index]
        relicSystem.chooseRelic(id: chosen.id)
        
        eventLog.emit(.relicChosen(relicID: chosen.id, tick: currentTick))
        
        // Transition to next wave
        try? stateMachine.transition(to: .building(waveIndex: waveIndex + 1))
    }
}
