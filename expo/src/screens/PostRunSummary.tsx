// PostRunSummary.tsx
// Shows run results after game ends

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { PostRunPresentation } from './PostRunPresentation';

interface PostRunSummaryProps {
    presentation: PostRunPresentation;
    onRestart: () => void;
    onMainMenu: () => void;
}

export function PostRunSummary({ presentation, onRestart, onMainMenu }: PostRunSummaryProps) {
    // No internal state needed, strictly presentational

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, presentation.didWin ? styles.victory : styles.defeat]}>
                        {presentation.didWin ? '🎉 VICTORY!' : '💀 DEFEAT'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {presentation.wavesCompleted} wave{presentation.wavesCompleted !== 1 ? 's' : ''} completed
                    </Text>
                </View>

                {/* Progression (XP & Level) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Progression</Text>
                    <View style={styles.statRow}>
                        <Text style={styles.statText}>XP Gained: +{presentation.xpGained}</Text>
                    </View>
                    <View style={styles.xpContainer}>
                        <Text style={styles.statText}>Level {presentation.startLevel} → {presentation.endLevel}</Text>
                        <View style={styles.xpBarBackground}>
                            <View style={[styles.xpBarFill, { width: `${presentation.endFraction * 100}%` }]} />
                        </View>
                        {presentation.endLevel > presentation.startLevel && (
                            <Text style={styles.levelUpText}>✨ LEVEL UP! ✨</Text>
                        )}
                    </View>
                </View>

                {/* Unlocks */}
                {presentation.unlocks.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>New Unlocks</Text>
                        {presentation.unlocks.map(id => (
                            <Text key={id} style={styles.unlockText}>🔓 {id}</Text>
                        ))}
                    </View>
                )}

                {/* Run Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Run Statistics</Text>
                    <View style={styles.statGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{presentation.wavesCompleted}</Text>
                            <Text style={styles.statLabel}>Waves</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{presentation.totalCoins}</Text>
                            <Text style={styles.statLabel}>Coins Earned</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{presentation.durationStats}</Text>
                        </View>
                    </View>
                </View>

                {/* Persistence Status */}
                {presentation.saveStatus.type === 'failed' && (
                    <Text style={styles.errorText}>⚠️ Save Failed: {presentation.saveStatus.errorMessage}</Text>
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
    xpContainer: {
        marginTop: 12,
        marginBottom: 8,
    },
    xpBarBackground: {
        height: 12,
        backgroundColor: '#444',
        borderRadius: 6,
        marginTop: 8,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: '#16f2b3',
    },
    levelUpText: {
        color: '#ffd700',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
    },
    unlockText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 4,
    },
    errorText: {
        color: '#ff4444',
        textAlign: 'center',
        marginBottom: 16,
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
