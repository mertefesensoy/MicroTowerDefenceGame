//  ContentView.swift
//  Main UI with HUD and debug controls

import SwiftUI
import SpriteKit
import MicroTDCore

struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var bridge = GameBridge()
    
    var body: some View {
        GameRootView(runManager: appState.runManager, bridge: bridge)
    }
}

struct GameRootView: View {
    @StateObject private var vm: GameViewModel
    let bridge: GameBridge
    
    init(runManager: RunManager<JSONFileProfileStore>, bridge: GameBridge) {
        _vm = StateObject(wrappedValue: GameViewModel(runManager: runManager))
        self.bridge = bridge
    }
    
    var body: some View {
        ZStack {
            // Background Game Layer
            SpriteView(scene: bridge.scene, options: [.allowsTransparency])
                .ignoresSafeArea()
                .aspectRatio(1.0, contentMode: .fit) // Force square aspect for now (6x6)
            
            // HUD Overlay
            VStack {
                HUDView(
                    coins: vm.coins,
                    lives: vm.lives,
                    waveText: vm.waveText,
                    phaseText: vm.phaseText,
                    tickText: vm.currentTickText,
                    lastAction: vm.lastAction
                )
                .padding()
                .background(.ultraThinMaterial)
                .cornerRadius(12)
                .padding()
                
                Spacer()
                
                // Debug / Controls
                HStack(spacing: 20) {
                    Button("Start Wave") {
                        vm.send(.startWave(tick: vm.currentTick))
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(vm.phaseText == "Phase: In Wave")
                    
                    // Note: Tower placement is now handled by Tapping the SpriteView
                    Text("Tap Grid to Place Cannon")
                        .font(.caption)
                        .foregroundStyle(.white)
                        .padding(6)
                        .background(.black.opacity(0.6))
                        .cornerRadius(4)
                }
                .padding(.bottom, 20)
            }
        }
        .onAppear {
            bridge.bind(to: vm) // Connect Bridge to VM
            vm.start() // Start Loop
            
            // Initial paint
            bridge.apply(snapshot: vm.renderSnapshot)
        }
        .onDisappear {
            vm.stop()
        }
        // Drive rendering from VM updates
        .onChange(of: vm.renderSnapshot) { newSnapshot in
            bridge.apply(snapshot: newSnapshot)
        }
    }
}

// Reusing HUDView from before...
struct HUDView: View {
    let coins: Int
    let lives: Int
    let waveText: String
    let phaseText: String
    let tickText: String
    let lastAction: String
    
    // Debug instrumentation
    var level: Int = 1
    var xp: Int = 0
    var lastRunSeed: String = "-"
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Stats Row
            HStack {
                Label("\(coins)", systemImage: "circle.circle")
                    .foregroundStyle(.yellow)
                Spacer()
                Label("\(lives)", systemImage: "heart.fill")
                    .foregroundStyle(.red)
            }
            .font(.headline)
            
            // Progression Row (Debug)
            HStack {
                Text("Lv \(level) (\(xp) XP)")
                    .font(.caption)
                    .foregroundStyle(.blue)
                Spacer()
                Text("Saved: \(lastRunSeed)")
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
            .padding(.vertical, 2)
            
            HStack {
                Text(waveText)
                Spacer()
                Text(phaseText)
                    .foregroundStyle(phaseText.contains("In Wave") ? .orange : .green)
            }
            .font(.subheadline)
            
            Divider().background(.white)
            
            Text(tickText)
                .font(.caption2)
                .monospacedDigit()
                .foregroundStyle(.secondary)
            
            if !lastAction.isEmpty {
                Text(lastAction)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    HUDView(
        coins: 100, 
        lives: 20, 
        waveText: "Wave 1", 
        phaseText: "Building", 
        tickText: "Tick: 0", 
        lastAction: "Ready",
        level: 5,
        xp: 1250,
        lastRunSeed: "A1B2C3"
    )
}
