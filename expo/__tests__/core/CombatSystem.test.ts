import { CombatSystem, Enemy, Tower, GridPosition, MapDef } from '../../src/core';
import { createDefaultDefinitions } from '../../src/core/definitions/GameDefinitions';

describe('CombatSystem', () => {
    let combat: CombatSystem;
    let mapDef: MapDef;
    let defs = createDefaultDefinitions();

    beforeEach(() => {
        // Simple linear map
        mapDef = {
            id: 'test',
            name: 'Test Map',
            gridWidth: 10,
            gridHeight: 10,
            blockedTiles: [],
            waypoints: [
                { position: new GridPosition(0, 0), pathProgress: 0.0 },
                { position: new GridPosition(10, 0), pathProgress: 1.0 }
            ]
        };
        combat = new CombatSystem(mapDef);
    });

    it('should damage enemies within range', () => {
        // Tower at (5, 0)
        const towerDef = defs.towers.tower('cannon')!;
        const tower = new Tower(1, 'cannon', new GridPosition(5, 0), towerDef);

        // Enemy at progress 0.5 => (5, 0). Exact match.
        const enemyDef = defs.enemies.enemy('runner')!;
        const enemy = new Enemy(1, 'runner', enemyDef);

        // Move enemy to 0.5
        enemy.move(0.5);

        const target = combat.findTarget(tower, [enemy]);
        expect(target).toBe(enemy);

        if (target) {
            const result = combat.executeAttack(tower, target);
            expect(result.damage).toBeGreaterThan(0);
            expect(target.currentHP).toBeLessThan(enemyDef.hp);
        }
    });

    it('should not damage enemies out of range', () => {
        const towerDef = defs.towers.tower('cannon')!;
        const tower = new Tower(1, 'cannon', new GridPosition(5, 0), towerDef);

        const enemyDef = defs.enemies.enemy('runner')!;
        const enemy = new Enemy(1, 'runner', enemyDef);

        // Enemy at start (0,0). Distance to (5,0) is 5. Cannon range is 2.5.
        enemy.move(0.0);

        const target = combat.findTarget(tower, [enemy]);
        expect(target).toBeNull();
    });

    it('should apply slow effect from frost tower', () => {
        const towerDef = defs.towers.tower('frost')!;
        const tower = new Tower(1, 'frost', new GridPosition(5, 0), towerDef);

        const enemyDef = defs.enemies.enemy('runner')!;
        const enemy = new Enemy(1, 'runner', enemyDef);
        enemy.move(0.5); // In range

        const target = combat.findTarget(tower, [enemy]);
        expect(target).toBeDefined();

        if (target) {
            const result = combat.executeAttack(tower, target);
            expect(result.slowApplied).toBe(true);
            expect(target.effectiveSpeed).toBeLessThan(enemyDef.speed);
        }
    });
});
