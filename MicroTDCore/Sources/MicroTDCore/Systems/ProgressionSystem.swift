// ProgressionSystem.swift
// Pure logic system for applying run results to progression profile

import Foundation

public struct ProgressionSystem: Sendable {
    public let rules: ProgressionRules
    
    public init(rules: ProgressionRules = ProgressionRules()) {
        self.rules = rules
    }
    
    /// Apply run summary to profile, returning events and updated profile
    /// This is a PURE function - it does not mutate input in place, but returns usage result
    /// (Or mutating if preferred, but explicit is nice)
    public func applyRun(_ run: RunSummary, to profile: inout ProgressionProfile) -> [ProgressionEvent] {
        var events: [ProgressionEvent] = []
        
        // 1. Calculate and Add XP
        let gainedXP = rules.xpForRun(run)
        if gainedXP > 0 {
            profile.xp += gainedXP
            events.append(.xpGained(amount: gainedXP))
        }
        
        // 2. Check for Level Up
        // Continue leveling up as long as we have enough XP
        while true {
            let threshold = rules.totalXpRequiredToReachNextLevel(from: profile.level)
            if profile.xp >= threshold {
                let oldLevel = profile.level
                profile.level += 1
                // XP is cumulative in this model (Standard RPG style), or resets?
                // "xpRequiredForLevel(1)" = 100.
                // If I have 150, I reach level 2. Do I keep 150? Or 50?
                // "100 * level * level" implies cumulative threshold.
                // L1->L2 needs 100 total. L2->L3 needs 400 total.
                
                events.append(.leveledUp(from: oldLevel, to: profile.level))
                
                // 3. Check for Unlocks
                let newUnlocks = rules.unlocksForLevel(profile.level)
                for unlockID in newUnlocks {
                    if !profile.unlocks.contains(unlockID) {
                        profile.unlocks.insert(unlockID)
                        events.append(.unlocked(id: unlockID))
                    }
                }
                
            } else {
                break
            }
        }
        
        return events
    }
}
