// RNGTests.swift
// Test deterministic random number generation

import XCTest
@testable import MicroTDCore

final class RNGTests: XCTestCase {
    
    func testDeterminism() {
        let seed: UInt64 = 12345
        
        let rng1 = SeededRNG(seed: seed)
        let rng2 = SeededRNG(seed: seed)
        
        // Generate 1000 values from each
        for _ in 0..<1000 {
            let val1 = rng1.nextUInt64()
            let val2 = rng2.nextUInt64()
            XCTAssertEqual(val1, val2, "Same seed should produce same sequence")
        }
    }
    
    func testDifferentSeeds() {
        let rng1 = SeededRNG(seed: 12345)
        let rng2 = SeededRNG(seed: 54321)
        
        let val1 = rng1.nextUInt64()
        let val2 = rng2.nextUInt64()
        
        XCTAssertNotEqual(val1, val2, "Different seeds should produce different values")
    }
    
    func testNextIntRange() {
        let rng = SeededRNG(seed: 99999)
        
        for _ in 0..<100 {
            let value = rng.nextInt(in: 0..<10)
            XCTAssertTrue(value >= 0 && value < 10, "Value should be in range [0, 10)")
        }
    }
    
    func testNextDouble() {
        let rng = SeededRNG(seed: 77777)
        
        for _ in 0..<100 {
            let value = rng.nextDouble()
            XCTAssertTrue(value >= 0.0 && value < 1.0, "Double should be in [0, 1)")
        }
    }
    
    func testChoose() {
        let rng = SeededRNG(seed: 11111)
        let array = ["a", "b", "c", "d", "e"]
        
        for _ in 0..<100 {
            let choice = rng.choose(from: array)
            XCTAssertNotNil(choice)
            XCTAssertTrue(array.contains(choice!))
        }
    }
}
