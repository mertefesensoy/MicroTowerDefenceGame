import Foundation

/// Background actor to isolate synchronous File I/O from the Main Thread
/// wrappers a synchronous ProfileStore.
public actor ProfileStoreIO<Store: ProfileStore> {
    private let store: Store

    public init(_ store: Store) {
        self.store = store
    }

    public func load(rules: ProgressionRules) throws -> (ProgressionProfile, LastRunMetadata?) {
        #if DEBUG
        precondition(!Thread.isMainThread, "ProfileStoreIO.load ran on main thread")
        #endif
        return try store.load(rules: rules)
    }

    public func save(_ profile: ProgressionProfile, lastRun: LastRunMetadata?) throws {
        #if DEBUG
        precondition(!Thread.isMainThread, "ProfileStoreIO.save ran on main thread")
        #endif
        try store.save(profile, lastRun: lastRun)
    }

    public func reset() throws {
        #if DEBUG
        precondition(!Thread.isMainThread, "ProfileStoreIO.reset ran on main thread")
        #endif
        try store.reset()
    }
}
