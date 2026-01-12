import XCTest
@testable import MicroTDCore
@testable import MicroTowerDefenceGame

final class UnlockCatalogTests: XCTestCase {
    
    // Guardrail: Ensure every unlock ID in Core has a UI definition
    func test_unlockCatalogCoversAllCoreUnlockIDs() {
        // 1. Get truthful IDs from Core
        let coreIDs = ProgressionRules().allKnownUnlockIDs
        
        // 2. Identify missing catalog entries
        let missing = coreIDs.filter { id in
            let descriptor = UnlockCatalog.descriptors[id]
            return descriptor == nil
        }
        
        // 3. Fail if drift detected
        XCTAssertTrue(missing.isEmpty, "🚨 UnlockCatalog is missing entries for IDs: \(missing). Please add them to UnlockCatalog.swift.")
    }
}
