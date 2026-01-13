//  ContentView.swift
//  Main UI with HUD and debug controls

import SwiftUI
import SpriteKit
import MicroTDCore
import Combine

struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var bridge = GameBridge()
    
    var body: some View {
        if let runManager = appState.runManager {
            GameRootView(runManager: runManager, toastManager: appState.toastManager, bridge: bridge)
        } else {
            // Loading / Splash Screen
            ZStack {
                Color.black.ignoresSafeArea()
                ProgressView("Loading Profile...")
                    .foregroundStyle(.white)
                    .tint(.white)
            }
        }
    }
}

struct GameRootView: View {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var vm: GameViewModel
    let bridge: GameBridge
    
    @EnvironmentObject private var appState: AppState // Need access for settings
    @State private var showSettings = false
    
    init(runManager: RunManager<JSONFileProfileStore>, toastManager: ToastManager, bridge: GameBridge) {
        _vm = StateObject(wrappedValue: GameViewModel(runManager: runManager, toastManager: toastManager))
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
                HStack(alignment: .top) {
                    // HUD Metrics
                    HUDView(
                        coins: vm.coins,
                        lives: vm.lives,
                        waveText: vm.waveText,
                        phaseText: vm.phaseText,
                        tickText: vm.currentTickText,
                        lastAction: vm.lastAction,
                        level: vm.level,
                        xp: vm.xp,
                        lastRunSeed: vm.lastRunSeed
                    )
                    .padding()
                    .background(.ultraThinMaterial)
                    .cornerRadius(12)
                    
                    Spacer()
                    
                    // Settings Gear
                    Button {
                        vm.pause() // Pause when opening settings
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .font(.title2)
                            .foregroundStyle(.white)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                }
                .padding()
                
                Spacer()
                
                // Debug / Controls
                HStack(spacing: 20) {
                    Button("Start Wave") {
                        vm.send(.startWave(tick: vm.currentTick))
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(vm.phaseText == "In Wave")
                    
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
            .zIndex(10) // HUD stays above game
            .sheet(isPresented: $showSettings) {
                SettingsSheet(appState: appState, vm: vm)
            }
            
            // Post-Run Modal Overlay
            if let postRun = vm.postRun {
                PostRunSummaryView(model: postRun) {
                    vm.dismissPostRun()
                }
                .zIndex(100) // Modal covers everything
                .transition(.opacity.animation(.easeInOut(duration: 0.3)))
            }
            
            // Toast Overlay (Highest Layer, Non-Blocking)
            ToastOverlay(manager: appState.toastManager)
                .zIndex(200)
                
            // Simple Pause Overlay
            if vm.isPaused && vm.postRun == nil {
                Color.black.opacity(0.4)
                    .ignoresSafeArea()
                    .overlay(
                        Text("PAUSED")
                            .font(.largeTitle.bold())
                            .foregroundStyle(.white)
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .cornerRadius(12)
                    )
                    .onTapGesture {
                        vm.resume()
                    }
                    .zIndex(150)
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
        .onReceive(vm.$renderSnapshot) { snapshot in
            bridge.apply(snapshot: snapshot)
        }
        // Lifecycle Sync
        .onChange(of: scenePhase) { phase in
            switch phase {
            case .active:
                // Resume only if not in post-run summary
                if vm.postRun == nil {
                     vm.resume()
                }
            case .inactive, .background:
                vm.pause()
            @unknown default:
                break
            }
        }
        // Bridge Sync
        .onChange(of: vm.isPaused) { paused in
            bridge.setPaused(paused)
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


#if DEBUG
struct HUDView_Previews: PreviewProvider {
    static var previews: some View {
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
}
#endif

