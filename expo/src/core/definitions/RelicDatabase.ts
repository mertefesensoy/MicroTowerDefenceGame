// RelicDatabase.ts
// Efficient relic lookup — ported from MicroTDCore/Definitions/RelicDatabase.swift

import type { RelicDef } from './RelicDef';
import { RelicDefinitions } from './RelicDef';

/**
 * Indexed relic database for O(1) ID lookups
 */
export class RelicDatabase {
    public readonly all: RelicDef[];
    private readonly byID: Map<string, RelicDef>;

    constructor(definitions: RelicDefinitions) {
        this.all = definitions.relics;
        this.byID = new Map();
        for (const relic of definitions.relics) {
            this.byID.set(relic.id, relic);
        }
    }

    /**
     * Find relic by ID (O(1) lookup)
     */
    relic(id: string): RelicDef | undefined {
        return this.byID.get(id);
    }
}
