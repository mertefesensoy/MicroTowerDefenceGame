// GameCommand.ts
// Player input commands with timestamps for deterministic replay

/**
 * Commands sent from UI layer to Core simulation
 * Each command includes the tick at which it was issued for replay support
 */
export type GameCommand =
    | { type: 'placeTower'; towerType: string; gridX: number; gridY: number; tick: number }
    | { type: 'sellTower'; gridX: number; gridY: number; tick: number }
    | { type: 'upgradeTower'; gridX: number; gridY: number; upgradePath: string; tick: number }
    | { type: 'startWave'; tick: number }
    | { type: 'chooseRelic'; index: number; tick: number };

/**
 * Log of all commands for deterministic replay
 */
export class CommandLog {
    private commands: GameCommand[] = [];

    append(command: GameCommand): void {
        this.commands.push(command);
    }

    /**
     * Get all commands
     */
    getAll(): readonly GameCommand[] {
        return this.commands;
    }

    /**
     * Verify commands are in chronological order
     */
    isChronological(): boolean {
        for (let i = 1; i < this.commands.length; i++) {
            if (this.commands[i].tick < this.commands[i - 1].tick) {
                return false;
            }
        }
        return true;
    }
}
