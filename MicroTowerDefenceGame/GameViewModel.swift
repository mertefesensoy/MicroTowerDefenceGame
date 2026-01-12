//  GameViewModel.swift
//  Bridge between Core simulation and SwiftUI

import SwiftUI
import Combine
import MicroTDCore

@MainActor
final class GameViewModel: ObservableObject {
    // Core simulation
    private let game: GameState
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
    
    // MARK: - Private Implementation
    
    private func tickOnce() {
        game.tick()
        updateFromCore()
    }
    
    private func updateFromCore() {
        // Drain events (exactly-once consumption via index slicing)
        let newEvents = game.eventLog.slice(from: lastEventIndex)
        lastEventIndex = game.eventLog.events.count
        
        var terminalOutcome: Bool? = nil
        
        // Track last action for debugging + detect terminal events
        for event in newEvents {
            switch event {
            case .towerPlaced(let id, let type, _, _, _):
                lastAction = "Tower placed: \(type) (ID: \(id))"
            case .towerSold(let id, let refund, _):
                lastAction = "Tower sold (ID: \(id), refund: \(refund))"
            case .gameOver:
                #if DEBUG
                if let existing = terminalOutcome {
                    assertionFailure("Multiple terminal events: didWin=\(existing) then .gameOver")
                }
                #endif
                terminalOutcome = false
            case .runCompleted:
                #if DEBUG
                if let existing = terminalOutcome {
                    assertionFailure("Multiple terminal events: didWin=\(existing) then .runCompleted")
                }
                #endif
                terminalOutcome = true
            default:
                break
            }
        }
        
        // Update published HUD state
        coins = game.currentCoins
        lives = game.currentLives
        currentTickText = "Tick: \(game.currentTick)"
        
        // ✅ Finalize exactly once when Core emits terminal event
        if let didWin = terminalOutcome {
            finalizeRunIfNeeded(didWin: didWin)
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
    
    private func finalizeRunIfNeeded(didWin: Bool) {
        guard !didFinalizeCurrentRun else { return }
        didFinalizeCurrentRun = true  // Set latch BEFORE calling applyRun (non-transactional)
        
        let summary = game.makeRunSummary(didWin: didWin)
        
        let t0 = CFAbsoluteTimeGetCurrent()
        do {let events = try runManager.applyRun(summary)
            #if DEBUG
            print("applyRun took \(CFAbsoluteTimeGetCurrent() - t0)s")
            #endif
            
            // TODO: Surface progression events to UI (toasts, level-up animations)
            for event in events {
                switch event {
                case .xpGained(let amount):
                    print("🎯 +\(amount) XP")
                case .leveledUp(let from, let to):
                    print("⬆️ Level \(from) → \(to)")
                case .unlocked(let id):
                    print("🔓 Unlocked \(id)")
                }
            }
        } catch {
            #if DEBUG
            print("❌ Progression save failed: \(error)")
            #endif
            // Optional: Show non-blocking banner/toast to user
            // Note: No retry allowed - applyRun is non-transactional
        }
    }
}
