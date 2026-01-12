// RunManager.swift
// Manages progression profile lifecycle and run application

import Foundation

/// Manages the active progression profile and handles run completion
/// - Note: MainActor-isolated to prevent concurrent saves and ensure deterministic profile updates
@MainActor
public final class RunManager<Store: ProfileStore> {
    private let store: Store
    private let rules: ProgressionRules
    private let progressionSystem: ProgressionSystem
    
    public private(set) var profile: ProgressionProfile
    private var lastRun: LastRunMetadata?  // Track last processed run for idempotency
    
    /// Initialize RunManager and load existing profile
    /// - Parameters:
    ///   - store: Profile storage backend
    ///   - rules: Progression rules for XP/unlocks
    /// - Throws: If loading fails and corruption policy is `.throwError`
    public init(store: Store, rules: ProgressionRules = ProgressionRules()) throws {
        self.store = store
        self.rules = rules
        self.progressionSystem = ProgressionSystem(rules: rules)
        
        // Load profile (normalized with reconcileUnlocks)
        self.profile = try store.load(rules: rules)
    }
    
    /// Apply a completed run to the profile and persist
    /// - Parameter summary: Run results to process
    /// - Returns: Events generated (XP gained, level ups, unlocks)
    /// - Throws: If save fails
    public func applyRun(_ summary: RunSummary) throws -> [ProgressionEvent] {
        // Idempotency: reject duplicate runSeeds (prevents double-award)
        if let lastRun = lastRun, lastRun.runSeed == summary.runSeed {
            #if DEBUG
            print("⚠️ RunManager: Duplicate runSeed \(summary.runSeed) detected - skipping")
            #endif
            return []
        }
        
        // Apply progression logic
        let events = progressionSystem.applyRun(summary, to: &profile)
        
        // Create metadata for persistence
        let lastRun = LastRunMetadata(
            runSeed: summary.runSeed,
            didWin: summary.didWin,
            wavesCleared: summary.wavesCleared,
            ticksSurvived: summary.ticksSurvived
        )
        
        // Persist updated profile
        try store.save(profile, lastRun: lastRun)
        
        // Update in-memory lastRun tracking for idempotency
        self.lastRun = lastRun
        
        return events
    }
    
    /// Reset profile to default (for testing or user request)
    /// - Throws: If save fails
    public func resetProfile() throws {
        self.profile = ProgressionProfile()
        try store.save(profile, lastRun: nil)
    }
}
