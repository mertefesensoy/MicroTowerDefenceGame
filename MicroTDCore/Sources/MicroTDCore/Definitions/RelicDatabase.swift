// RelicDatabase.swift
// Efficient lookup for RelicDefinitions

import Foundation

public struct RelicDatabase: Sendable {
    public let all: [RelicDef]
    public let byID: [String: RelicDef]
    
    public init(relicDefs: [RelicDef]) {
        self.all = relicDefs
        self.byID = Dictionary(uniqueKeysWithValues: relicDefs.map { ($0.id, $0) })
    }
    
    // Convenience for GameDefinitions
    public init(definitions: RelicDefinitions) {
        self.init(relicDefs: definitions.all)
    }
    
    public func relic(id: String) -> RelicDef? {
        return byID[id]
    }
}
