// GameBridge.swift
// Adapter pattern: Connects Core (ViewModel) to SpriteKit (GameScene)
// Handles Command -> Tick synchronization and Snapshot -> Node updates

import Foundation
import SpriteKit
import MicroTDCore

@MainActor
final class GameBridge: ObservableObject {
    let scene: GameScene
    
    private weak var viewModel: GameViewModel?
    
    init(gridWidth: Int = 6, gridHeight: Int = 6, tileSize: CGFloat = 64) {
        // Initialize scene with grid dimensions from default map (6x6)
        self.scene = GameScene(gridWidth: gridWidth, gridHeight: gridHeight, tileSize: tileSize)
    }
    
    func bind(to vm: GameViewModel) {
        self.viewModel = vm
        
        // Output: Scene Tap -> ViewModel Command
        // We use currentTick from VM to ensure deterministic command handling
        scene.onGridTap = { [weak vm] gridX, gridY in
            guard let vm = vm else { return }
            vm.send(.placeTower(type: "cannon", gridX: gridX, gridY: gridY, tick: vm.currentTick))
        }
    }
    
    // Input: ViewModel Snapshot -> Scene Update
    func apply(snapshot: RenderSnapshot) {
        scene.apply(snapshot: snapshot)
    }
    
    // State: Pause/Resume
    func setPaused(_ paused: Bool) {
        scene.isPaused = paused
    }
}
