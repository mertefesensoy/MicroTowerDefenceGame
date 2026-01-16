// SeededRNG.ts
// Deterministic random number generator for reproducible gameplay

/**
 * Seeded RNG using xorshift128+ algorithm
 * Produces deterministic random numbers for replay support
 */
export class SeededRNG {
    private state0: number;
    private state1: number;

    constructor(seed: number) {
        // Initialize state using seed
        // Use simple mixing to create two 32-bit states
        this.state0 = seed & 0xFFFFFFFF;
        this.state1 = (seed >>> 16) & 0xFFFFFFFF;

        // Ensure states are non-zero
        if (this.state0 === 0) this.state0 = 1;
        if (this.state1 === 0) this.state1 = 2;

        // Warm up the generator
        for (let i = 0; i < 10; i++) {
            this.next();
        }
    }

    /**
     * Generate next random number in [0, 1)
     */
    next(): number {
        // xorshift128+ algorithm
        let s1 = this.state0;
        const s0 = this.state1;
        this.state0 = s0;
        s1 ^= s1 << 23;
        s1 ^= s1 >>> 17;
        s1 ^= s0;
        s1 ^= s0 >>> 26;
        this.state1 = s1;

        const result = (this.state0 + this.state1) >>> 0;
        return result / 0x100000000;
    }

    /**
     * Generate random integer in [min, max]
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate random float in [min, max]
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Choose random element from array
     */
    choose<T>(array: T[]): T {
        const index = this.nextInt(0, array.length - 1);
        return array[index];
    }

    /**
     * Shuffle array in-place (Fisher-Yates)
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
