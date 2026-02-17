import { SeededRNG } from '../../src/core/SeededRNG';

describe('SeededRNG', () => {
    it('should produce deterministic sequences', () => {
        const rng1 = new SeededRNG(12345);
        const seq1 = [rng1.nextFloat(0, 1), rng1.nextFloat(0, 1), rng1.nextFloat(0, 1)];

        const rng2 = new SeededRNG(12345);
        const seq2 = [rng2.nextFloat(0, 1), rng2.nextFloat(0, 1), rng2.nextFloat(0, 1)];

        expect(seq1).toEqual(seq2);
    });

    it('should produce different sequences for different seeds', () => {
        const rng1 = new SeededRNG(12345);
        const val1 = rng1.nextFloat(0, 1);

        const rng2 = new SeededRNG(67890);
        const val2 = rng2.nextFloat(0, 1);

        expect(val1).not.toBe(val2);
    });
});
