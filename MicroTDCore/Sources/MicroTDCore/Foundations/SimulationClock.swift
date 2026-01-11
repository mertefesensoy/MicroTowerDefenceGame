// SimulationClock.swift
// Fixed timestep simulation clock for deterministic gameplay

/// Manages simulation time with fixed 60 ticks/second
public final class SimulationClock {
    public static let ticksPerSecond: Int = 60
    public static let secondsPerTick: Double = 1.0 / Double(ticksPerSecond)
    
    public private(set) var currentTick: Int = 0
    private var accumulator: Double = 0.0
    
    public init() {}
    
    /// Advance clock by delta time, returns number of ticks to simulate
    /// - Parameter deltaTime: Real-world time elapsed in seconds
    /// - Returns: Number of fixed-timestep ticks to process
    public func advance(by deltaTime: Double) -> Int {
        accumulator += deltaTime
        var ticksToProcess = 0
        
        while accumulator >= Self.secondsPerTick {
            accumulator -= Self.secondsPerTick
            currentTick += 1
            ticksToProcess += 1
            
            // Safety: prevent spiral of death if simulation can't keep up
            if ticksToProcess >= 10 {
                accumulator = 0
                break
            }
        }
        
        return ticksToProcess
    }
    
    /// Get current simulation time in seconds
    public var currentTime: Double {
        return Double(currentTick) * Self.secondsPerTick
    }
    
    /// Reset clock to initial state
    public func reset() {
        currentTick = 0
        accumulator = 0.0
    }
}
