import Foundation

struct UnlockDescriptor: Equatable {
    let id: String
    let title: String
    let subtitle: String
    let systemImage: String // SF Symbol name
}

enum UnlockCatalog {
    static let descriptors: [String: UnlockDescriptor] = [
        // Level 2
        "relic_uncommon_pack": .init(
            id: "relic_uncommon_pack",
            title: "Uncommon Relic Pack",
            subtitle: "Choose a powerful artifact to boost your towers.",
            systemImage: "archivebox"
        ),
        "tower_sniper": .init(
            id: "tower_sniper",
            title: "Sniper Tower",
            subtitle: "Long-range, high-damage removal of single targets.",
            systemImage: "scope"
        ),
        
        // Level 3
        "relic_rare_pack": .init(
            id: "relic_rare_pack",
            title: "Rare Relic Pack",
            subtitle: "High-tier artifacts with unique game-changing effects.",
            systemImage: "archivebox.fill"
        ),
        "tower_missile": .init(
            id: "tower_missile",
            title: "Missile Launcher",
            subtitle: "Splash damage heavy weapon for crowd control.",
            systemImage: "rocket"
        ),
        
        // Level 5
        "relic_legendary_pack": .init(
            id: "relic_legendary_pack",
            title: "Legendary Relic Pack",
            subtitle: "The most powerful artifacts in the known universe.",
            systemImage: "crown"
        )
    ]

    static func descriptor(for id: String) -> UnlockDescriptor {
        if let d = descriptors[id] { return d }
        #if DEBUG
        print("⚠️ Missing UnlockDescriptor for id: \(id)")
        #endif
        return .init(id: id, title: "Unknown Unlock", subtitle: id, systemImage: "questionmark.circle")
    }
    
    /// Debug helper to verify all core IDs have mapped content
    /// Call this from AppState.init or similar on debug builds
    static func checkCatalogCoverage(coreIDs: [String]) {
        #if DEBUG
        let missing = coreIDs.filter { descriptors[$0] == nil }
        if !missing.isEmpty {
            print("🚨 CRITICAL: Missing UnlockCatalog entries for: \(missing)")
            // Optional: fatalError("Missing catalog entries!") 
        } else {
            print("✅ UnlockCatalog coverage verified (\(descriptors.count) items)")
        }
        #endif
    }
}
