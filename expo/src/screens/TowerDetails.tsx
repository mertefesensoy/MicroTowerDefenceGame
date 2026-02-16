import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tower } from '../core/entities/Tower';
import { GameDefinitions } from '../core/definitions/GameDefinitions';

interface TowerDetailsProps {
    tower: Tower;
    definitions: GameDefinitions;
    currentCoins: number;
    onUpgrade: (pathID: string) => void;
    onSell: () => void;
    onClose: () => void;
}

export function TowerDetails({ tower, definitions, currentCoins, onUpgrade, onSell, onClose }: TowerDetailsProps) {
    const refundAmount = Math.floor(tower.baseDef.cost * 0.5);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{tower.baseDef.name}</Text>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.stats}>
                <Text style={styles.stat}>Damage: {(tower.baseDef.damage * tower.damageMultiplier).toFixed(1)}</Text>
                <Text style={styles.stat}>Range: {(tower.baseDef.range * tower.rangeMultiplier).toFixed(1)}</Text>
                <Text style={styles.stat}>Speed: {(tower.baseDef.fireRate * tower.fireRateMultiplier).toFixed(2)}/s</Text>
                <Text style={styles.stat}>Kills: {tower.kills}</Text>
            </View>

            <View style={styles.upgrades}>
                <Text style={styles.sectionTitle}>Upgrades</Text>
                <View style={styles.upgradeList}>
                    {tower.baseDef.upgradePaths.map(pathID => {
                        const upgradeDef = definitions.towers.tower(pathID);
                        if (!upgradeDef) return null;

                        // Net cost logic: NewCost - 50% OldCost (current value)
                        // Actually GameState implementation is: max(0, newCost - oldCost)
                        // Let's match GameState logic.
                        const upgradeCost = Math.max(0, upgradeDef.cost - tower.baseDef.cost);
                        const canAfford = currentCoins >= upgradeCost;

                        return (
                            <TouchableOpacity
                                key={pathID}
                                style={[styles.upgradeButton, !canAfford && styles.disabled]}
                                onPress={() => canAfford && onUpgrade(pathID)}
                                disabled={!canAfford}
                            >
                                <Text style={styles.upgradeName}>{upgradeDef.name}</Text>
                                <Text style={styles.cost}>{upgradeCost} 💰</Text>
                            </TouchableOpacity>
                        );
                    })}
                    {tower.baseDef.upgradePaths.length === 0 && (
                        <Text style={styles.noUpgrades}>Max Level</Text>
                    )}
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.sellButton} onPress={onSell}>
                    <Text style={styles.sellText}>Sell (+{refundAmount} 💰)</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        fontSize: 24,
        color: '#888',
        padding: 4,
    },
    stats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    stat: {
        color: '#ccc',
        fontSize: 14,
        width: '45%',
    },
    upgrades: {
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    upgradeList: {
        flexDirection: 'row',
        gap: 8,
    },
    upgradeButton: {
        flex: 1,
        backgroundColor: '#16f2b3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabled: {
        backgroundColor: '#333',
        opacity: 0.7,
    },
    upgradeName: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cost: {
        color: '#000',
        fontSize: 12,
    },
    noUpgrades: {
        color: '#666',
        fontStyle: 'italic',
    },
    actions: {
        alignItems: 'center',
    },
    sellButton: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff6b6b',
        width: '100%',
        alignItems: 'center',
    },
    sellText: {
        color: '#ff6b6b',
        fontWeight: 'bold',
    },
});
