import { RelicSystem } from '../../src/core/systems/RelicSystem';
import { SeededRNG } from '../../src/core/SeededRNG';
import { createDefaultDefinitions } from '../../src/core/definitions/GameDefinitions';
import { RelicDatabase } from '../../src/core/definitions/RelicDatabase';
import { Relic } from '../../src/core/entities/Relic';

describe('RelicSystem', () => {
    let system: RelicSystem;
    let defs = createDefaultDefinitions();

    beforeEach(() => {
        const db = new RelicDatabase(defs.relics);
        system = new RelicSystem(db, new SeededRNG(123));
    });

    it('should generate valid choices', () => {
        const choices = system.generateChoices(3);
        expect(choices.length).toBe(3);
        // Ensure uniqueness
        const ids = new Set(choices.map(c => c.id));
        expect(ids.size).toBe(3);
    });

    it('should apply selected relic', () => {
        const choices = system.generateChoices(3);
        system.chooseRelic(choices[0].id);

        expect((system as any).inventory.length).toBe(1);
        expect((system as any).inventory[0].definition.id).toBe(choices[0].id);
    });

    it('should stack modifiers correctly', () => {
        // Mock inventory with two relics that boost damage
        // Relic A: x1.5 damage
        // Relic B: x2.0 damage

        // We can't easily mock private inventory, so use public API to add known relics if possible,
        // or just rely on 'Tower' entity tests for modifier application.
        // But RelicSystem has `combinedMultiplier`.

        // Let's rely on standard relics
        const powerAmp = defs.relics.relic('power_amp')!; // +50% dmg (1.5x)
        const devastation = defs.relics.relic('devastation')!; // +100% dmg (2.0x)

        // Manually push to inventory for testing (if we can't via chooseRelic easily)
        // Access private inventory via any cast
        (system as any).inventory.push(new Relic(powerAmp));
        (system as any).inventory.push(new Relic(devastation));

        // Total damage multiplier: 1.5 * 2.0 = 3.0
        const mult = system.combinedMultiplier('towerDamageMultiplier');
        expect(mult).toBeCloseTo(3.0);
    });
});
