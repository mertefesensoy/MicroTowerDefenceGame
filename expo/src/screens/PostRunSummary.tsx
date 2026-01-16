// PostRunSummary.tsx
// Shows run results after game ends

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { RunResult } from '../persistence/RunResult';
import { getRunStats } from '../persistence/RunResult';

interface PostRunSummaryProps {
    result: RunResult;
    onRestart: () => void;
    onMainMenu: () => void;
}

export function PostRunSummary({ result, onRestart, onMainMenu }: PostRunSummaryProps) {
    const [stats, setStats] = useState<{
        totalRuns: number;
        victories: number;
        defeats: number;
        avgWavesCompleted: number;
        bestRun: RunResult | null;
    } | null>(null);

    useEffect(() => {
        getRunStats().then(setStats);
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, result.isVictory ? styles.victory : styles.defeat]}>
                        {result.isVictory ? '🎉 VICTORY!' : '💀 DEFEAT'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {result.wavesCompleted} wave{result.wavesCompleted !== 1 ? 's' : ''} completed
                    </Text>
                </View>

                {/* Run Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>This Run</Text>
                    <View style={styles.statGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{result.wavesCompleted}</Text>
                            <Text style={styles.statLabel}>Waves</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{result.totalCoins}</Text>
                            <Text style={styles.statLabel}>Coins</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{result.totalKills}</Text>
                            <Text style={styles.statLabel}>Kills</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{Math.round(result.totalDamage)}</Text>
                            <Text style={styles.statLabel}>Damage</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{result.finalLives}</Text>
                            <Text style={styles.statLabel}>Lives Left</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatDuration(result.durationSeconds)}</Text>
                            <Text style={styles.statLabel}>Time</Text>
                        </View>
                    </View>
                </View>

                {/* Overall Stats */}
                {stats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Overall Stats</Text>
                        <View style={styles.statRow}>
                            <Text style={styles.statText}>Total Runs: {stats.totalRuns}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statText}>
                                Victories: {stats.victories} ({Math.round((stats.victories / stats.totalRuns) * 100)}%)
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statText}>
                                Defeats: {stats.defeats}
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statText}>
                                Avg Waves: {stats.avgWavesCompleted}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Best Run */}
                {stats?.bestRun && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Best Run</Text>
                        <View style={styles.bestRunCard}>
                            <Text style={styles.bestRunText}>
                                {stats.bestRun.wavesCompleted} waves • {stats.bestRun.totalCoins} coins
                            </Text>
                            <Text style={styles.bestRunDate}>
                                {formatDate(stats.bestRun.timestamp)}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
                    <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuButton} onPress={onMainMenu}>
                    <Text style={styles.buttonText}>Main Menu</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    victory: {
        color: '#16f2b3',
    },
    defeat: {
        color: '#ff6b6b',
    },
    subtitle: {
        fontSize: 18,
        color: '#888',
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statItem: {
        width: '30%',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#0f0f1e',
        borderRadius: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#16f2b3',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    statRow: {
        paddingVertical: 8,
    },
    statText: {
        fontSize: 16,
        color: '#fff',
    },
    bestRunCard: {
        backgroundColor: '#0f0f1e',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#16f2b3',
    },
    bestRunText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 4,
    },
    bestRunDate: {
        fontSize: 12,
        color: '#888',
    },
    actions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#1a1a2e',
    },
    restartButton: {
        flex: 1,
        backgroundColor: '#16f2b3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    menuButton: {
        flex: 1,
        backgroundColor: '#444',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
