// RunManager.swift
// Manages progression profile lifecycle and run application

import Foundation

/// Manages the active progression profile and handles run completion
/// - Note: MainActor-isolated to prevent concurrent saves and ensure deterministic profile updates
@MainActor
public final class RunManager<Store: ProfileStore> {
    private let io: ProfileStoreIO<Store>
    private let rules: ProgressionRules
    private let progressionSystem: ProgressionSystem
    
    public private(set) var profile: ProgressionProfile
    public private(set) var lastRun: LastRunMetadata?
    
    // Guard against re-entrant saves (since await yields the thread)
    private var inFlightRunSeeds = Set<UInt64>()
    
    // Private init - forces use of async factory
    private init(
        io: ProfileStoreIO<Store>,
        rules: ProgressionRules,
        profile: ProgressionProfile,
        lastRun: LastRunMetadata?
    ) {
        self.io = io
        self.rules = rules
        self.progressionSystem = ProgressionSystem(rules: rules)
        self.profile = profile
        self.lastRun = lastRun
    }
    
    /// Async factory to initialize RunManager (loads profile off-main)
    public static func make(store: Store, rules: ProgressionRules = ProgressionRules()) async throws -> RunManager {
        let io = ProfileStoreIO(store)
        let (profile, lastRun) = try await io.load(rules: rules)
        return RunManager(io: io, rules: rules, profile: profile, lastRun: lastRun)
    }
    
    /// Apply a completed run to the profile and persist
    /// - Parameter summary: Run results to process
    /// - Returns: Events generated (XP gained, level ups, unlocks)
    /// - Throws: If save fails
    public func applyRun(_ summary: RunSummary) async throws -> [ProgressionEvent] {
        // Idempotency: reject duplicate runSeeds (prevents double-award)
        if let lastRun, lastRun.runSeed == summary.runSeed {
            #if DEBUG
            print("⚠️ RunManager: Duplicate runSeed \(summary.runSeed) detected - skipping")
            #endif
            return []
        }
        
        // Re-entrancy guard
        if inFlightRunSeeds.contains(summary.runSeed) {
            #if DEBUG
            print("⚠️ RunManager: RunSeed \(summary.runSeed) already in-flight - skipping")
            #endif
            return []
        }
        
        inFlightRunSeeds.insert(summary.runSeed)
        defer { inFlightRunSeeds.remove(summary.runSeed) }
        
        // Compute-then-commit pattern
        var newProfile = profile
        let events = progressionSystem.applyRun(summary, to: &newProfile)
        
        // Create metadata for persistence
        let newLastRun = LastRunMetadata(
            runSeed: summary.runSeed,
            didWin: summary.didWin,
            wavesCleared: summary.wavesCleared,
            ticksSurvived: summary.ticksSurvived
        )
        
        // Persist updated profile off-main
        try await io.save(newProfile, lastRun: newLastRun)
        
        // Commit to memory only on success
        self.profile = newProfile
        self.lastRun = newLastRun
        
        return events
    }
    
    /// Reset profile to default (for testing or user request)
    /// - Throws: If save/delete fails
    public func resetProfile() async throws {
        try await io.reset()
        self.profile = ProgressionProfile()
        self.lastRun = nil
        self.inFlightRunSeeds.removeAll()
    }
}
