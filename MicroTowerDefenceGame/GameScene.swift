// GameScene.swift
// Pure rendering layer - No game logic, only Node management based on Snapshots

import SpriteKit
import MicroTDCore

@MainActor
final class GameScene: SKScene {
    // Callback for input (Glue code handles logic)
    var onGridTap: ((Int, Int) -> Void)?
    
    private let gridWidth: Int
    private let gridHeight: Int
    private let tileSize: CGFloat
    
    // Node Pools (ID-based mapping)
    private var enemyNodes: [Int: SKShapeNode] = [:]
    private var towerNodes: [Int: SKShapeNode] = [:]
    
    // Map Path visualization (Hardcoded for 'default' map for now)
    // Path: (0,3) -> (2,3) -> (2,1) -> (4,1) -> (4,4) -> (5,4)
    private let pathTiles: [GridPosition] = [
        .init(x: 0, y: 3),
        .init(x: 2, y: 3),
        .init(x: 2, y: 1),
        .init(x: 4, y: 1),
        .init(x: 4, y: 4),
        .init(x: 5, y: 4)
    ]
    
    private lazy var pathPoints: [CGPoint] = pathTiles.map { gridCenter($0.x, $0.y) }
    private lazy var pathSegmentLengths: [CGFloat] = zip(pathPoints, pathPoints.dropFirst()).map { a, b in
        hypot(b.x - a.x, b.y - a.y)
    }
    private lazy var pathTotalLength: CGFloat = pathSegmentLengths.reduce(0, +)
    
    init(gridWidth: Int, gridHeight: Int, tileSize: CGFloat) {
        self.gridWidth = gridWidth
        self.gridHeight = gridHeight
        self.tileSize = tileSize
        
        super.init(size: CGSize(width: CGFloat(gridWidth) * tileSize,
                                height: CGFloat(gridHeight) * tileSize))
        
        self.scaleMode = .aspectFit
        self.anchorPoint = .zero
        self.backgroundColor = SKColor(red: 0.1, green: 0.1, blue: 0.15, alpha: 1.0) // Dark background
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func didMove(to view: SKView) {
        drawGrid()
        drawPathOverlay()
    }
    
    // MARK: - Snapshot Application
    
    func apply(snapshot: RenderSnapshot) {
        // Update Towers
        let currentTowerIDs = Set(snapshot.towers.map(\.id))
        
        for tower in snapshot.towers {
            let node = towerNodes[tower.id] ?? createTowerNode(type: tower.type)
            if towerNodes[tower.id] == nil {
                towerNodes[tower.id] = node
                addChild(node)
                // Initialize position
                node.position = gridCenter(tower.gridX, tower.gridY)
            }
            // Towers are static, usually don't need update per frame unless upgrading
        }
        
        // Remove dead towers
        for id in towerNodes.keys where !currentTowerIDs.contains(id) {
            towerNodes[id]?.removeFromParent()
            towerNodes[id] = nil
        }
        
        // Update Enemies
        let currentEnemyIDs = Set(snapshot.enemies.map(\.id))
        
        for enemy in snapshot.enemies {
            let node = enemyNodes[enemy.id] ?? createEnemyNode(type: enemy.type)
            if enemyNodes[enemy.id] == nil {
                enemyNodes[enemy.id] = node
                addChild(node)
            }
            
            // Update position based on path progress
            node.position = positionAlongPath(progress: enemy.pathProgress)
        }
        
        // Remove dead enemies
        for id in enemyNodes.keys where !currentEnemyIDs.contains(id) {
            enemyNodes[id]?.removeFromParent()
            enemyNodes[id] = nil
        }
    }
    
    // MARK: - Input
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let location = touches.first?.location(in: self) else { return }
        
        let gridX = Int(location.x / tileSize)
        let gridY = Int(location.y / tileSize)
        
        if gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight {
            // Check if valid tile (not blocked/path) handled by Core, we just suggest
            onGridTap?(gridX, gridY)
        }
    }
    
    // MARK: - Helpers
    
    private func gridCenter(_ x: Int, _ y: Int) -> CGPoint {
        return CGPoint(
            x: (CGFloat(x) + 0.5) * tileSize,
            y: (CGFloat(y) + 0.5) * tileSize
        )
    }
    
    private func positionAlongPath(progress: Double) -> CGPoint {
        guard pathPoints.count >= 2, pathTotalLength > 0 else { return .zero }
        
        var targetDist = CGFloat(max(0, min(1, progress))) * pathTotalLength
        
        for i in 0..<(pathPoints.count - 1) {
            let segLen = pathSegmentLengths[i]
            if targetDist <= segLen {
                let p1 = pathPoints[i]
                let p2 = pathPoints[i+1]
                let t = segLen > 0 ? targetDist / segLen : 0
                return CGPoint(
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                )
            }
            targetDist -= segLen
        }
        
        return pathPoints.last ?? .zero
    }
    
    // MARK: - Factory Methods
    
    private func createTowerNode(type: String) -> SKShapeNode {
        let size = tileSize * 0.8
        let node = SKShapeNode(rectOf: CGSize(width: size, height: size), cornerRadius: 4)
        
        switch type {
        case "cannon": node.fillColor = .cyan
        case "frost": node.fillColor = .blue
        case "bomb": node.fillColor = .red
        default: node.fillColor = .white
        }
        
        node.strokeColor = .black
        node.lineWidth = 2
        node.zPosition = 10
        return node
    }
    
    private func createEnemyNode(type: String) -> SKShapeNode {
        let radius = tileSize * 0.3
        let node = SKShapeNode(circleOfRadius: radius)
        
        switch type {
        case "basic": node.fillColor = .yellow
        case "fast": node.fillColor = .orange
        case "tank": node.fillColor = .purple
        default: node.fillColor = .green
        }
        
        node.strokeColor = .black
        node.lineWidth = 1
        node.zPosition = 20
        return node
    }
    
    private func drawGrid() {
        let gridPath = CGMutablePath()
        
        for x in 0...gridWidth {
            let posX = CGFloat(x) * tileSize
            gridPath.move(to: CGPoint(x: posX, y: 0))
            gridPath.addLine(to: CGPoint(x: posX, y: CGFloat(gridHeight) * tileSize))
        }
        
        for y in 0...gridHeight {
            let posY = CGFloat(y) * tileSize
            gridPath.move(to: CGPoint(x: 0, y: posY))
            gridPath.addLine(to: CGPoint(x: CGFloat(gridWidth) * tileSize, y: posY))
        }
        
        let gridNode = SKShapeNode(path: gridPath)
        gridNode.strokeColor = SKColor(white: 1.0, alpha: 0.1)
        gridNode.lineWidth = 1
        gridNode.zPosition = 0
        addChild(gridNode)
    }
    
    private func drawPathOverlay() {
        guard pathPoints.count >= 2 else { return }
        
        let pathVis = CGMutablePath()
        pathVis.move(to: pathPoints[0])
        for p in pathPoints.dropFirst() {
            pathVis.addLine(to: p)
        }
        
        let node = SKShapeNode(path: pathVis)
        node.strokeColor = SKColor(green: 1.0, alpha: 0.2)
        node.lineWidth = tileSize * 0.5
        node.lineJoin = .round
        node.zPosition = 1
        addChild(node)
    }
}
