//  MicroTowerDefenceGameApp.swift
//  SwiftUI app entry point

import SwiftUI

@main
struct MicroTowerDefenceGameApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
