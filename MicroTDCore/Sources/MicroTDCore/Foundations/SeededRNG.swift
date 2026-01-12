// SeededRNG.swift
// Deterministic random number generator using Xoshiro256** algorithm

import Foundation

/// High-quality deterministic random number generator
/// Uses Xoshiro256** algorithm for reproducibility across runs
public final class SeededRNG: @unchecked Sendable {
    private var state: (UInt64, UInt64, UInt64, UInt64)
    
    public init(seed: UInt64) {
        // SplitMix64 for state initialization from single seed
        var s = seed
        func next() -> UInt64 {
            s &+= 0x9E3779B97F4A7C15
            var z = s
            z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
            z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
            return z ^ (z >> 31)
        }
        
        self.state = (next(), next(), next(), next())
    }
    
    /// Generate next UInt64 value
    public func nextUInt64() -> UInt64 {
        let result = rotateLeft(state.1 &* 5, by: 7) &* 9
        let t = state.1 << 17
        
        state.2 ^= state.0
        state.3 ^= state.1
        state.1 ^= state.2
        state.0 ^= state.3
        state.2 ^= t
        state.3 = rotateLeft(state.3, by: 45)
        
        return result
    }
    
    /// Generate random Int in range [0, upperBound)
    public func nextInt(in range: Range<Int>) -> Int {
        precondition(range.count > 0, "Range must not be empty")
        let count = UInt64(range.count)
        let random = nextUInt64()
        return Int((random % count)) + range.lowerBound
    }
    
    /// Generate random Double in range [0, 1)
    public func nextDouble() -> Double {
        return Double(nextUInt64() >> 11) * (1.0 / Double(UInt64(1) << 53))
    }
    
    /// Choose random element from array
    public func choose<T>(from array: [T]) -> T? {
        guard !array.isEmpty else { return nil }
        let index = nextInt(in: 0..<array.count)
        return array[index]
    }
    
    /// Shuffle array in place (Fisher-Yates)
    public func shuffle<T>(_ array: inout [T]) {
        guard array.count > 1 else { return }
        for i in stride(from: array.count - 1, through: 1, by: -1) {
            let j = nextInt(in: 0..<(i + 1))  // 0...i inclusive, using Range
            array.swapAt(i, j)
        }
    }
    
    private func rotateLeft(_ value: UInt64, by rotation: Int) -> UInt64 {
        return (value << rotation) | (value >> (64 - rotation))
    }
}
