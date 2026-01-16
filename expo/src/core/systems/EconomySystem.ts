// EconomySystem.ts
// Manages coins and rewards

/**
 * Economy system for coins and rewards
 */
export class EconomySystem {
    private _coins: number;
    private _totalCoinsEarned = 0;

    constructor(public readonly startingCoins: number = 200) {
        this._coins = startingCoins;
        // Initial coins don't count as "earned"
    }

    get coins(): number {
        return this._coins;
    }

    get totalCoinsEarned(): number {
        return this._totalCoinsEarned;
    }

    /**
     * Add coins
     */
    addCoins(amount: number, reason: string = 'reward'): number {
        this._coins += amount;
        if (amount > 0) {
            this._totalCoinsEarned += amount;
        }
        return this._coins;
    }

    /**
     * Spend coins if available
     */
    spendCoins(amount: number): boolean {
        if (this._coins < amount) return false;
        this._coins -= amount;
        return true;
    }

    /**
     * Check if can afford
     */
    canAfford(cost: number): boolean {
        return this._coins >= cost;
    }

    /**
     * Reset for new run
     */
    reset(startingCoins: number): void {
        this._coins = startingCoins;
        this._totalCoinsEarned = 0;
    }
}
