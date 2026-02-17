import { createDefaultDefinitions } from '../../src/core/definitions/GameDefinitions';

describe('DefinitionsLoader', () => {
    it('should load default definitions without error', () => {
        const defs = createDefaultDefinitions();

        expect(defs.enemies.enemies.length).toBeGreaterThan(0);
        expect(defs.towers.towers.length).toBeGreaterThan(0);
        expect(defs.waves.waves.length).toBeGreaterThan(0);
        expect(defs.maps.maps.length).toBeGreaterThan(0);
        expect(defs.relics.relics.length).toBeGreaterThan(0);
    });

    it('should have valid cross-references', () => {
        const defs = createDefaultDefinitions();

        // Check wave spawns reference valid enemies
        for (const wave of defs.waves.waves) {
            for (const spawn of wave.spawns) {
                expect(defs.enemies.enemy(spawn.enemyType)).toBeDefined();
            }
        }

        // Check tower upgrades reference valid towers
        for (const tower of defs.towers.towers) {
            for (const upgradeID of tower.upgradePaths) {
                expect(defs.towers.tower(upgradeID)).toBeDefined();
            }
        }
    });
});
