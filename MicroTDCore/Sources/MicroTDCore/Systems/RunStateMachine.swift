// RunStateMachine.swift
// Enforces valid state transitions for run lifecycle

/// Run lifecycle states
/// Enforces orderly progression through game phases
public enum RunState: Equatable {
    case preRun
    case building(waveIndex: Int)
    case inWave(waveIndex: Int)
    case relicChoice(waveIndex: Int)
    case gameOver
    case postRunSummary
}

/// State transition errors
public enum StateTransitionError: Error {
    case invalidTransition(from: RunState, to: RunState)
    case waveIndexMismatch
}

/// Manages run state with enforced transitions
public struct RunStateMachine {
    public private(set) var state: RunState
    
    public init(initialState: RunState = .preRun) {
        self.state = initialState
    }
    
    /// Attempt to transition to new state, throws if invalid
    public mutating func transition(to newState: RunState) throws {
        guard isValidTransition(from: state, to: newState) else {
            throw StateTransitionError.invalidTransition(from: state, to: newState)
        }
        state = newState
    }
    
    private func isValidTransition(from: RunState, to: RunState) -> Bool {
        switch (from, to) {
        // From preRun
        case (.preRun, .building(let wave)):
            return wave == 0
            
        // From building
        case (.building(let wave1), .inWave(let wave2)):
            return wave1 == wave2
            
        // From inWave
        case (.inWave(let wave1), .building(let wave2)):
            return wave2 == wave1 + 1
        case (.inWave, .relicChoice):
            return true
        case (.inWave, .gameOver):
            return true
        case (.inWave, .postRunSummary):
            return true
            
        // From relicChoice
        case (.relicChoice(let wave1), .building(let wave2)):
            return wave2 == wave1 + 1
            
        // From gameOver (revive support)
        case (.gameOver, .inWave):
            return true
        case (.gameOver, .postRunSummary):
            return true
            
        // From postRunSummary (end of run)
        case (.postRunSummary, .preRun):
            return true
            
        default:
            return false
        }
    }
}
