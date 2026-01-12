//  GameViewModel.swift
//  Bridge between Core simulation and SwiftUI

import SwiftUI
import Combine
import MicroTDCore

@MainActor
final class GameViewModel: ObservableObject {
    // Core simulation
    private let game: GameState
    private var lastEventIndex: Int = 0
    
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
    
    init() {
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
        
        // Track last action for debugging (Commit 3 will use newEvents for SpriteKit)
        for event in newEvents {
            if case .towerPlaced(let id, let type, _, _, _) = event {
                lastAction = "Tower placed: \(type) (ID: \(id))"
            } else if case .towerSold(let id, let refund, _) = event {
                lastAction = "Tower sold (ID: \(id), refund: \(refund))"
            }
        }
        
        // Update published HUD state
        coins = game.currentCoins
        lives = game.currentLives
        currentTickText = "Tick: \(game.currentTick)"
        
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
}
