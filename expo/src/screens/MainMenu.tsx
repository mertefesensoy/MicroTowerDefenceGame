// MainMenu.tsx
// Main menu screen

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { loadRunHistory, clearRunHistory, type RunResult } from '../persistence/RunResult';

interface MainMenuProps {
    onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
    const [runHistory, setRunHistory] = useState<RunResult[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const history = await loadRunHistory();
        setRunHistory(history.slice(0, 5)); // Show last 5 runs
    };

    const handleClearHistory = async () => {
        await clearRunHistory();
        setRunHistory([]);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>MicroTD</Text>
                <Text style={styles.subtitle}>Expo Edition</Text>
            </View>

            <TouchableOpacity style={styles.playButton} onPress={onStartGame}>
                <Text style={styles.playButtonText}>▶ Play Game</Text>
            </TouchableOpacity>

            {runHistory.length > 0 && (
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Recent Runs</Text>
                        <TouchableOpacity onPress={handleClearHistory}>
                            <Text style={styles.clearButton}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.historyList}>
                        {runHistory.map((run) => (
                            <View
                                key={run.id}
                                style={[styles.historyItem, run.isVictory ? styles.victoryItem : styles.defeatItem]}
                            >
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyResult}>
                                        {run.isVictory ? '🎉' : '💀'} {run.wavesCompleted} waves
                                    </Text>
                                    <Text style={styles.historyStats}>
                                        {run.totalCoins} coins • {run.totalKills} kills
                                    </Text>
                                    <Text style={styles.historyDate}>{formatDate(run.timestamp)}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    ✅ Phase C0-C4 Complete{'\n'}
                    🎯 Ready for EAS Build (Phase C5)
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#16f2b3',
    },
    subtitle: {
        fontSize: 18,
        color: '#888',
        marginTop: 8,
    },
    playButton: {
        backgroundColor: '#16f2b3',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 30,
    },
    playButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f0f1e',
    },
    historySection: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    clearButton: {
        color: '#ff6b6b',
        fontSize: 14,
    },
    historyList: {
        flex: 1,
    },
    historyItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    victoryItem: {
        backgroundColor: '#0f0f1e',
        borderLeftColor: '#16f2b3',
    },
    defeatItem: {
        backgroundColor: '#0f0f1e',
        borderLeftColor: '#ff6b6b',
    },
    historyInfo: {
        gap: 4,
    },
    historyResult: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    historyStats: {
        fontSize: 14,
        color: '#888',
    },
    historyDate: {
        fontSize: 12,
        color: '#666',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 18,
    },
});
