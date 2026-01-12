//  AppState.swift
//  Single source of truth for app-wide state (RunManager singleton)

import Foundation
import MicroTDCore

#if canImport(os)
import os
#endif

@MainActor
final class AppState: ObservableObject {
    let runManager: RunManager<JSONFileProfileStore>

    init() {
        let profileURL = Self.makeProfileURL()
        let logger: (any ProfileStoreLogger)? = Self.makeLogger()

        let store = JSONFileProfileStore(
            fileURL: profileURL,
            corruptPolicy: .resetToDefaultAndBackup,
            logger: logger
        )

        do {
            self.runManager = try RunManager(store: store)
        } catch {
            #if DEBUG
            fatalError("Failed to initialize RunManager: \(error)")
            #else
            // In release, decide: fatalError or "disabled progression" mode
            fatalError("Failed to initialize progression.")
            #endif
        }
    }

    private static func makeProfileURL() -> URL {
        let fm = FileManager.default
        let appSupport: URL

        do {
            appSupport = try fm.url(
                for: .applicationSupportDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            )
        } catch {
            #if DEBUG
            fatalError("Unable to resolve Application Support directory: \(error)")
            #else
            // Fallback (not ideal, but avoids instant crash)
            return fm.urls(for: .cachesDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("com.microtd.progression", isDirectory: true)
                .appendingPathComponent("profile.json")
            #endif
        }

        let dir = appSupport.appendingPathComponent("com.microtd.progression", isDirectory: true)
        do {
            try fm.createDirectory(at: dir, withIntermediateDirectories: true)
        } catch {
            #if DEBUG
            fatalError("Unable to create profile directory: \(error)")
            #endif
        }

        var url = dir.appendingPathComponent("profile.json")

        // Avoid iCloud backup for game progression
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try? url.setResourceValues(values)

        return url
    }

    private static func makeLogger() -> (any ProfileStoreLogger)? {
        #if DEBUG
        #if canImport(os)
        if #available(iOS 14.0, macOS 11.0, *) {
            return OSLogProfileStoreLogger()
        }
        #endif
        #endif
        return nil
    }
}
