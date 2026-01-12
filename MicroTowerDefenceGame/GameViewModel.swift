//  GameViewModel.swift
//  Bridge between Core simulation and SwiftUI

import SwiftUI
import Combine
import MicroTDCore

@MainActor
final class GameViewModel: ObservableObject {
    // Core simulation
    private var game: GameState
    private let runManager: RunManager<JSONFileProfileStore>
    private var lastEventIndex: Int = 0
    
    // Progression tracking
    private var didFinalizeCurrentRun = false
    
    // Timer
    private var timer: AnyCancellable?
    
    // Published HUD state
    @Published var coins: Int = 0
    @Published var lives: Int = 0
    @Published var waveText: String = "Wave 0"
    @Published var phaseText: String = "Building"
    @Published var renderSnapshot: RenderSnapshot = RenderSnapshot(enemies: [], towers: [])
    
    // Debug state
    @Published var currentTickText: String = "Tick: 0"
    @Published var lastAction: String = "None"
    @Published var level: Int = 1
    @Published var xp: Int = 0
    @Published var lastRunSeed: String = "-"
    
    init(runManager: RunManager<JSONFileProfileStore>) {
        self.runManager = runManager
        
        // Load definitions and create game state
        do {
            let definitions = try GameDefinitions.loadFromBundle()
            self.game = GameState(runSeed: UInt64.random(in: 0...UInt64.max), definitions: definitions)
            
            // Initial update (prevents HUD showing 0s on launch)
            updateFromCore()
        } catch {
            fatalError("Failed to load game definitions: \(error)")
        }
    }
    
    // MARK: - Public Interface
    
    /// Start the 60Hz tick loop (idempotent - prevents double-start)
    func start() {
        guard timer == nil else { return }
        timer = Timer.publish(every: 1.0 / 60.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.tickOnce()
            }
    }
    
    /// Stop the tick loop
    func stop() {
        timer?.cancel()
        timer = nil
    }
    
    /// Send a command to Core
    func send(_ command: GameCommand) {
        game.processCommand(command)
        updateFromCore()
    }
    
    /// Current tick for command timestamping
    var currentTick: Int {
        game.currentTick
    }
    
    // MARK: - Post-Run Presentation
    
    @Published var postRun: PostRunPresentation? = nil
    
    /// Dismiss the summary and reset the game state
    func dismissPostRun() {
        postRun = nil
        // Reset game for new run (simple restart for now)
        // Re-create GameState instance as systems are immutable
        let definitions = game.definitions // Reuse loaded definitions
        // New random seed for new run
        self.game = GameState(runSeed: UInt64.random(in: 0...UInt64.max), definitions: definitions)
        
        // Reset VM state
        didFinalizeCurrentRun = false
        lastEventIndex = 0
        updateFromCore()
        
        // Restart timer
        start()
    }
    
    // MARK: - Private Implementation
    
    private func tickOnce() {
        // Pausing logic: if postRun is showing, do not tick
        guard postRun == nil else { return }
        
        game.tick()
        updateFromCore()
    }
    
    private func updateFromCore() {
        // Drain events (exactly-once consumption via index slicing)
        let newEvents = game.eventLog.slice(from: lastEventIndex)
        lastEventIndex = game.eventLog.events.count
        
        var terminalOutcome: Bool? = nil
        var terminalWaves = 0
        
        // Track last action for debugging + detect terminal events
        for event in newEvents {
            switch event {
            case .towerPlaced(let id, let type, _, _, _):
                lastAction = "Tower placed: \(type) (ID: \(id))"
            case .towerSold(let id, let refund, _):
                lastAction = "Tower sold (ID: \(id), refund: \(refund))"
            case .gameOver(let waves, _):
                #if DEBUG
                if let existing = terminalOutcome {
                    assertionFailure("Multiple terminal events: didWin=\(existing) then .gameOver")
                }
                #endif
                terminalOutcome = false
                terminalWaves = waves
            case .runCompleted(let waves, _, _):
                #if DEBUG
                if let existing = terminalOutcome {
                    assertionFailure("Multiple terminal events: didWin=\(existing) then .runCompleted")
                }
                #endif
                terminalOutcome = true
                terminalWaves = waves
            default:
                break
            }
        }
        
        // Update published HUD state
        coins = game.currentCoins
        lives = game.currentLives
        currentTickText = "Tick: \(game.currentTick)"
        
        // Debug updates (Progression visibility)
        level = runManager.profile.level
        xp = runManager.profile.xp
        
        // Mask the seed for UI (last 6 chars)
        if let lastRun = runManager.lastRun {
             lastRunSeed = String(String(lastRun.runSeed).suffix(6))
        } else {
             lastRunSeed = "-" 
        }
        
        // ✅ Finalize exactly once when Core emits terminal event
        if let didWin = terminalOutcome {
             finalizeRunIfNeeded(didWin: didWin, waves: terminalWaves)
        }
        
        // Update wave/phase text
        switch game.currentState {
        case .preRun:
            waveText = "Not Started"
            phaseText = "Pre-Run"
        case .building(let waveIndex):
            waveText = "Wave \(waveIndex)"
            phaseText = "Building"
        case .inWave(let waveIndex):
            waveText = "Wave \(waveIndex)"
            phaseText = "In Wave"
        case .relicChoice(let waveIndex):
            waveText = "Wave \(waveIndex)"
            phaseText = "Choose Relic"
        case .gameOver:
            phaseText = "Game Over"
        case .postRunSummary:
            phaseText = "Run Complete"
        }
        
        // Update render snapshot (for Commit 3 SpriteKit)
        renderSnapshot = game.getRenderSnapshot()
    }
    
    // MARK: - Progression Integration
    
    private func finalizeRunIfNeeded(didWin: Bool, waves: Int) {
        guard !didFinalizeCurrentRun else { return }
        didFinalizeCurrentRun = true
        
        // 1. Capture final ticks
        let ticksSurvived = game.currentTick
        
        // 2. Create summary (Core Logic)
        // Use GameState helper to ensure all fields (coins, relics) are populated
        let summary = game.makeRunSummary(didWin: didWin)
        
        do {
            // 3. Apply Progression (Persistent Write)
            // Returns events (deltas)
            let startLevel = runManager.profile.level
            let events = try runManager.applyRun(summary)
            let endLevel = runManager.profile.level
            
            // 4. Extract rewards
            var xpGained = 0
            var newUnlocks: [String] = []
            
            for event in events {
                switch event {
                case .xpGained(let amount):
                    xpGained += amount
                case .unlocked(let id):
                    newUnlocks.append(id)
                case .levelUp:
                    break
                }
            }
            
            // 5. Construct Presentation (Success Case)
            let saveSeed = runManager.lastRun?.runSeed ?? 0
            
            // Format time (ticks / 60)
            let seconds = ticksSurvived / 60
            let timeStr = String(format: "%02d:%02d", seconds / 60, seconds % 60)
            
            self.postRun = PostRunPresentation(
                didWin: didWin,
                wavesCompleted: waves,
                totalCoins: game.currentCoins,
                durationStats: timeStr,
                xpGained: xpGained,
                startLevel: startLevel,
                endLevel: endLevel,
                unlocks: newUnlocks,
                saveStatus: .saved(seed: saveSeed)
            )
            
        } catch {
            print("❌ Failed to save run: \(error)")
            
            // Handle Protection Error specifically
            let nsError = error as NSError
            let isProtected = nsError.domain == NSCocoaErrorDomain && nsError.code == NSFileReadNoPermissionError
            
            // Construct Presentation (Failure Case)
            let seconds = ticksSurvived / 60
            let timeStr = String(format: "%02d:%02d", seconds / 60, seconds % 60)
            
            self.postRun = PostRunPresentation(
                didWin: didWin,
                wavesCompleted: waves,
                totalCoins: game.currentCoins,
                durationStats: timeStr,
                xpGained: 0,
                startLevel: runManager.profile.level,
                endLevel: runManager.profile.level,
                unlocks: [],
                saveStatus: isProtected ? .protectedData : .failed(errorMessage: error.localizedDescription)
            )
        }
    }
}
