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
    private let toastManager: ToastManager
    private var lastEventIndex: Int = 0
    
    // Progression tracking
    private var didFinalizeCurrentRun = false
    @Published var isPaused: Bool = false
    
    // HUD state (used by ContentView/HUDView)
    @Published var coins: Int = 0
    @Published var lives: Int = 0
    @Published var waveText: String = "Not Started"
    @Published var phaseText: String = "Pre-Run"
    @Published var currentTickText: String = "Tick: 0"
    @Published var lastAction: String = ""
    
    // Progression debug
    @Published var level: Int = 1
    @Published var xp: Int = 0
    @Published var lastRunSeed: String = "-"
    
    // Rendering
    @Published var renderSnapshot: RenderSnapshot = RenderSnapshot(enemies: [], towers: [])
    
    // Timer
    private var timer: AnyCancellable?
    
    init(runManager: RunManager<JSONFileProfileStore>, toastManager: ToastManager) {
        self.runManager = runManager
        self.toastManager = toastManager
        
        // Load definitions from bundle
        let definitions: GameDefinitions
        do {
            definitions = try GameDefinitions.loadFromBundle()
        } catch {
            fatalError("Failed to load game definitions: \(error)")
        }
        
        // Initialize with default GameState
        // Use a random seed for the first game loop
        self.game = GameState(runSeed: UInt64.random(in: 0...UInt64.max), definitions: definitions)
        
        // Initial sync
        self.coins = game.currentCoins
        self.lives = game.currentLives
        self.currentTickText = "Tick: 0"
        self.waveText = "Not Started"
        self.phaseText = "Pre-Run"
        self.lastRunSeed = "-"
        self.level = runManager.profile.level
        self.xp = runManager.profile.xp
        self.renderSnapshot = game.getRenderSnapshot()
        
        if let lastRun = runManager.lastRun {
            self.lastRunSeed = String(String(lastRun.runSeed).suffix(6))
        }
    }
    
    // MARK: - Public Interface
    
    /// Pause the game loop (lifecycle or user initiated)
    func pause() {
        guard !isPaused else { return }
        isPaused = true
        stop() // Cancel timer
    }
    
    /// Resume the game loop
    func resume() {
        guard isPaused else { return }
        // Don't resume if post-run summary is showing
        guard postRun == nil else { return }
        
        isPaused = false
        start() // Restart timer
    }
    
    /// Start the 60Hz tick loop (idempotent - prevents double-start)
    func start() {
        guard timer == nil, !isPaused else { return }
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
        guard !isPaused else { return } // Input guard
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
        
        // Reset pause state and restart
        isPaused = false
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
        
        // Stop the game loop immediately
        pause()
        
        // 1. Capture final ticks
        let ticksSurvived = game.currentTick
        
        // 2. Create summary (Core Logic)
        // Use GameState helper to ensure all fields (coins, relics) are populated
        let summary = game.makeRunSummary(didWin: didWin)
        
        // 3. Process Progression (Async)
        Task { [weak self] in
            guard let self else { return }
            
            do {
                // Capture Snapshot Start
                let startLevel = self.runManager.profile.level
                let totalStartXP = self.runManager.profile.xp 
                
                // Apply Run (Async IO)
                let events = try await self.runManager.applyRun(summary)
                
                // Capture Snapshot End
                let endLevel = self.runManager.profile.level
                let totalEndXP = self.runManager.profile.xp
                
                // Extract metrics
                let xpGained = events.reduce(0) { sum, event in
                    if case .xpGained(let amount) = event { return sum + amount }
                    return sum
                }
                
                let newUnlocks: [String] = events.compactMap { event in
                    if case .unlocked(let id) = event { return id }
                    return nil
                }
                
                // Calculate Fractions
                let rules = ProgressionRules()
                
                // Start Fraction
                let startFloor = rules.xpThreshold(forLevel: startLevel)
                let startCeiling = rules.xpThreshold(forLevel: startLevel + 1)
                let startRange = Double(max(1, startCeiling - startFloor))
                let effectiveStartXP = totalEndXP - xpGained
                let startFraction = Double(effectiveStartXP - startFloor) / startRange
                
                // End Fraction
                let endFloor = rules.xpThreshold(forLevel: endLevel)
                let endCeiling = rules.xpThreshold(forLevel: endLevel + 1)
                let endRange = Double(max(1, endCeiling - endFloor))
                let endFraction = Double(totalEndXP - endFloor) / endRange
                
                // Construct Presentation (Success)
                let saveSeed = self.runManager.lastRun?.runSeed ?? 0
                let seconds = ticksSurvived / 60
                let timeStr = String(format: "%02d:%02d", seconds / 60, seconds % 60)
                
                self.postRun = PostRunPresentation(
                    didWin: didWin,
                    wavesCompleted: waves,
                    totalCoins: self.game.currentCoins,
                    durationStats: timeStr,
                    xpGained: xpGained,
                    startLevel: startLevel,
                    endLevel: endLevel,
                    startFraction: max(0, min(1, startFraction)),
                    endFraction: max(0, min(1, endFraction)),
                    unlocks: newUnlocks,
                    saveStatus: .saved(seed: saveSeed)
                )
                
            } catch {
                print("❌ Failed to save run: \(error)")
                
                // Handle Protection Error
                let nsError = error as NSError
                let isProtected = nsError.domain == NSCocoaErrorDomain && nsError.code == NSFileReadNoPermissionError
                
                if isProtected {
                    self.toastManager.showProtectedDataWarning()
                } else {
                    self.toastManager.showSaveFailure(error.localizedDescription)
                }
                
                // Construct Presentation (Failure)
                let seconds = ticksSurvived / 60
                let timeStr = String(format: "%02d:%02d", seconds / 60, seconds % 60)
                
                self.postRun = PostRunPresentation(
                    didWin: didWin,
                    wavesCompleted: waves,
                    totalCoins: self.game.currentCoins,
                    durationStats: timeStr,
                    xpGained: 0,
                    startLevel: self.runManager.profile.level,
                    endLevel: self.runManager.profile.level,
                    startFraction: 0,
                    endFraction: 0,
                    unlocks: [],
                    saveStatus: isProtected ? .protectedData : .failed(errorMessage: error.localizedDescription)
                )
            }
        }
    }
}
