import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tower } from '../core/entities/Tower';
import { GameDefinitions } from '../core/definitions/GameDefinitions';

interface TowerDetailsProps {
    tower: Tower;
    definitions: GameDefinitions;
    currentCoins: number;
    isBuilding: boolean;
    onUpgrade: (pathID: string) => void;
    onSell: () => void;
    onClose: () => void;
}

export function TowerDetails({ tower, definitions, currentCoins, isBuilding, onUpgrade, onSell, onClose }: TowerDetailsProps) {
    const refundAmount = Math.floor(tower.baseDef.cost * 0.5);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{tower.baseDef.name}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonWrapper}>
                    <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>DMG</Text>
                    <Text style={styles.statValue}>{(tower.baseDef.damage * tower.damageMultiplier).toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>RNG</Text>
                    <Text style={styles.statValue}>{(tower.baseDef.range * tower.rangeMultiplier).toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>SPD</Text>
                    <Text style={styles.statValue}>{(tower.baseDef.fireRate * tower.fireRateMultiplier).toFixed(2)}/s</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>KILLS</Text>
                    <Text style={styles.statValue}>{tower.kills}</Text>
                </View>
            </View>

            <View style={styles.upgrades}>
                <Text style={styles.sectionTitle}>
                    {isBuilding ? 'Upgrades' : 'Upgrades (between waves)'}
                </Text>
                <View style={styles.upgradeList}>
                    {tower.baseDef.upgradePaths.map(pathID => {
                        const upgradeDef = definitions.towers.tower(pathID);
                        if (!upgradeDef) return null;

                        const upgradeCost = Math.max(0, upgradeDef.cost - tower.baseDef.cost);
                        const canAfford = currentCoins >= upgradeCost;
                        const canUpgrade = isBuilding && canAfford;

                        return (
                            <TouchableOpacity
                                key={pathID}
                                style={[
                                    styles.upgradeButton,
                                    !canUpgrade && styles.disabled,
                                    !isBuilding && styles.lockedButton,
                                ]}
                                onPress={() => canUpgrade && onUpgrade(pathID)}
                                disabled={!canUpgrade}
                            >
                                <Text style={[styles.upgradeName, !canUpgrade && styles.disabledText]}>
                                    {upgradeDef.name}
                                </Text>
                                <Text style={[
                                    styles.cost,
                                    !canUpgrade && styles.disabledText,
                                    isBuilding && !canAfford && styles.costUnaffordable,
                                ]}>
                                    {upgradeCost} 💰
                                </Text>
                                {!isBuilding && (
                                    <Text style={styles.lockedLabel}>🔒</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                    {tower.baseDef.upgradePaths.length === 0 && (
                        <Text style={styles.noUpgrades}>Max Level</Text>
                    )}
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.sellButton, !isBuilding && styles.sellButtonDisabled]}
                    onPress={isBuilding ? onSell : undefined}
                    disabled={!isBuilding}
                >
                    <Text style={[styles.sellText, !isBuilding && styles.disabledText]}>
                        {isBuilding
                            ? `Sell (+${refundAmount} 💰)`
                            : `Sell 🔒 (between waves)`}
                    </Text>
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
        borderTopWidth: 2,
        borderTopColor: '#16f2b3',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButtonWrapper: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        fontSize: 22,
        color: '#888',
    },
    // ─── Stats Grid ───
    stats: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    statItem: {
        flex: 1,
        backgroundColor: '#0f0f1e',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 4,
        alignItems: 'center',
    },
    statLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    // ─── Upgrades ───
    upgrades: {
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#aaa',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    upgradeList: {
        flexDirection: 'row',
        gap: 8,
    },
    upgradeButton: {
        flex: 1,
        backgroundColor: '#16f2b3',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
        minHeight: 48,
        justifyContent: 'center',
    },
    disabled: {
        backgroundColor: '#333',
        opacity: 0.8,
    },
    lockedButton: {
        backgroundColor: '#2a2a3e',
        opacity: 0.6,
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
    costUnaffordable: {
        color: '#ff4444',
    },
    disabledText: {
        color: '#888',
    },
    lockedLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    noUpgrades: {
        color: '#666',
        fontStyle: 'italic',
    },
    // ─── Sell ───
    actions: {
        alignItems: 'center',
    },
    sellButton: {
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff6b6b',
        width: '100%',
        alignItems: 'center',
        minHeight: 44,
        justifyContent: 'center',
    },
    sellButtonDisabled: {
        borderColor: '#555',
    },
    sellText: {
        color: '#ff6b6b',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
