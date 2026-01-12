//  ContentView.swift
//  Main UI with HUD and debug controls

import SwiftUI
import MicroTDCore

struct ContentView: View {
    @StateObject private var vm = GameViewModel()
    
    var body: some View {
        VStack(spacing: 20) {
            // HUD
            HUDView(
                coins: vm.coins,
                lives: vm.lives,
                waveText: vm.waveText,
                phaseText: vm.phaseText,
                tickText: vm.currentTickText,
                lastAction: vm.lastAction
            )
            
            Spacer()
            
            // Debug Controls
            VStack(spacing: 12) {
                Text("Debug Controls")
                    .font(.headline)
                
                Button("Start Wave") {
                    vm.send(.startWave(tick: vm.currentTick))
                }
                .buttonStyle(.borderedProminent)
                
                Button("Place Cannon (1,2)") {
                    vm.send(.placeTower(type: "cannon", gridX: 1, gridY: 2, tick: vm.currentTick))
                }
                .buttonStyle(.bordered)
            }
            .padding()
            
            Spacer()
        }
        .padding()
        .onAppear {
            vm.start()
        }
        .onDisappear {
            vm.stop()
        }
    }
}

struct HUDView: View {
    let coins: Int
    let lives: Int
    let waveText: String
    let phaseText: String
    let tickText: String
    let lastAction: String
    
    var body: some View {
        VStack(spacing: 8) {
            Text(waveText)
                .font(.title)
                .fontWeight(.bold)
            
            Text(phaseText)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            HStack(spacing: 40) {
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                        .foregroundColor(.yellow)
                    Text("\(coins)")
                        .font(.title2)
                        .fontWeight(.semibold)
                }
                
                HStack {
                    Image(systemName: "heart.fill")
                        .foregroundColor(.red)
                    Text("\(lives)")
                        .font(.title2)
                        .fontWeight(.semibold)
                }
            }
            
            // Debug info
            VStack(spacing: 4) {
                Text(tickText)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(lastAction)
                    .font(.caption2)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    ContentView()
}
