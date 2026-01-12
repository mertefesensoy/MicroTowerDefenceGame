// RelicDatabase.swift
// Efficient lookup for Relic definitions (Immutable)

import Foundation

public struct RelicDatabase: Sendable {
    public let all: [RelicDef]
    private let byID: [String: RelicDef]
    
    public init(relicDefs: [RelicDef]) {
        self.all = relicDefs
        self.byID = Dictionary(uniqueKeysWithValues: relicDefs.map { ($0.id, $0) })
    }
    
    /// Initialize from the container struct loaded from JSON
    public init(definitions: RelicDefinitions) {
        self.init(relicDefs: definitions.relics)
    }
    
    public func relic(id: String) -> RelicDef? {
        return byID[id]
    }
}
