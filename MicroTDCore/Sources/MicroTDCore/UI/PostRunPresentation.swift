import Foundation

/// Defines the exact state to be presented on the Post-Run Summary screen.
/// This model acts as the "View Model" for the summary overlay, decoupled from the active GameState.
/// It must be populated ONLY from finalized consistency data (RunManager events + Disk Verification).
public struct PostRunPresentation: Equatable {
    
    // MARK: - Run Outcome
    public let didWin: Bool
    public let wavesCompleted: Int
    public let totalCoins: Int
    public let durationStats: String // formatted string for "Time: 12:34" or similar
    
    // MARK: - Progression Rewards
    public let xpGained: Int
    public let startLevel: Int
    public let endLevel: Int
    public let startFraction: Double
    public let endFraction: Double
    public let unlocks: [String] // IDs of unlocked items
    
    // MARK: - Persistence Status
    public enum SaveStatus: Equatable, Sendable {
        case saved(seed: UInt64)
        case failed(errorMessage: String)
        case protectedData
    }
    public let saveStatus: SaveStatus
    
    // MARK: - Derived Helpers
    public var didLevelUp: Bool {
        return endLevel > startLevel
    }
    
    public init(
        didWin: Bool,
        wavesCompleted: Int,
        totalCoins: Int,
        durationStats: String,
        xpGained: Int,
        startLevel: Int,
        endLevel: Int,
        startFraction: Double,
        endFraction: Double,
        unlocks: [String],
        saveStatus: SaveStatus
    ) {
        self.didWin = didWin
        self.wavesCompleted = wavesCompleted
        self.totalCoins = totalCoins
        self.durationStats = durationStats
        self.xpGained = xpGained
        self.startLevel = startLevel
        self.endLevel = endLevel
        self.startFraction = startFraction
        self.endFraction = endFraction
        self.unlocks = unlocks
        self.saveStatus = saveStatus
    }
}
