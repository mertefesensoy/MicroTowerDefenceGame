// VictoryTests.swift
// Verifies victory detection and runCompleted event emission

import XCTest
@testable import MicroTDCore

final class VictoryTests: XCTestCase {
    
    /// Test that .runCompleted event exists in the event model and can be emitted
    func testRunCompletedEventExists() {
        // This is a structural test - verifies the event type exists
        var eventLog = EventLog()
        
        eventLog.emit(.runCompleted(wavesCompleted: 5, totalCoins: 1000, tick: 500))
        
        // Verify event was added
        XCTAssertEqual(eventLog.events.count, 1)
        
        // Verify it's the correct event type
        if case .runCompleted(let waves, let coins, let tick) = eventLog.events[0] {
            XCTAssertEqual(waves, 5)
            XCTAssertEqual(coins, 1000)
            XCTAssertEqual(tick, 500)
        } else {
            XCTFail("Event was not .runCompleted")
        }
    }
    
    /// Test that both terminal events (.gameOver and .runCompleted) have tick extraction
    func testTerminalEventsHaveTickProperty() {
        let gameOverEvent = GameEvent.gameOver(wavesCompleted: 3, tick: 100)
        let runCompletedEvent = GameEvent.runCompleted(wavesCompleted: 5, totalCoins: 500, tick: 200)
        
        XCTAssertEqual(gameOverEvent.tick, 100)
        XCTAssertEqual(runCompletedEvent.tick, 200)
    }
}
