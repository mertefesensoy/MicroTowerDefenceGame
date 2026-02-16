import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MainMenu } from './src/screens/MainMenu';
import { GameCanvas } from './src/rendering/GameCanvas';
import { PostRunSummary } from './src/screens/PostRunSummary';
import { RunManager } from './src/persistence/RunManager';
import { AsyncStorageProfileStore as ProfileStore } from './src/persistence/ProfileStore';
import { createDefaultDefinitions, GameDefinitions } from './src/core/definitions/GameDefinitions';
import { RunSummary, ProgressionRules, RunSummary as IRunSummary } from './src/core/definitions/ProgressionTypes';
import { createPostRunPresentation, PostRunPresentation } from './src/screens/PostRunPresentation';
import { ErrorBoundary } from './src/ErrorBoundary';

type Screen = 'loading' | 'menu' | 'game' | 'summary';

function RootApp() {
    const [screen, setScreen] = useState<Screen>('loading');
    const [runManager, setRunManager] = useState<RunManager | null>(null);
    const [definitions, setDefinitions] = useState<GameDefinitions | null>(null);
    const [presentation, setPresentation] = useState<PostRunPresentation | null>(null);
    const [currentRunSeed, setCurrentRunSeed] = useState<number>(Date.now());

    // 1. Initialize System
    useEffect(() => {
        async function initialize() {
            try {
                // Initialize resources
                const defs = createDefaultDefinitions();
                setDefinitions(defs);

                // Initialize persistence
                const store = new ProfileStore();
                const manager = await RunManager.make(store, new ProgressionRules());
                setRunManager(manager);

                setScreen('menu');
            } catch (e) {
                console.error("Failed to initialize game:", e);
                // Fallback?
            }
        }
        initialize();
    }, []);

    const handleStartGame = useCallback(() => {
        setCurrentRunSeed(Date.now());
        setScreen('game');
    }, []);

    const handleGameEnd = useCallback(async (summary: RunSummary) => {
        if (!runManager) return;

        // Apply run results
        const events = await runManager.applyRun(summary);

        // Calculate presentation data using Rules (stateless)
        // Calculate XP from events since summary doesn't have it
        const xpEvent = events.find(e => e.type === 'xpGained');
        const xpGained = xpEvent && xpEvent.type === 'xpGained' ? xpEvent.amount : 0;

        const endXP = runManager.profile.xp;
        const startXPVal = endXP - xpGained;

        const rules = new ProgressionRules();
        const startLevel = rules.levelForXP(startXPVal);
        const endLevel = runManager.profile.level;

        const unlocks = events
            .filter(e => e.type === 'unlocked')
            .map(e => e.type === 'unlocked' ? e.itemID : '')
            .filter(Boolean);

        const pres = createPostRunPresentation({
            didWin: summary.didWin,
            wavesCompleted: summary.wavesCleared,
            totalCoins: summary.totalCoinsEarned,
            ticksSurvived: summary.ticksSurvived,
            xpGained,
            startLevel,
            endLevel,
            startXP: startXPVal,
            endXP,
            xpForCurrentLevel: rules.xpRequiredForLevel(startLevel),
            xpForNextLevel: rules.xpRequiredForLevel(startLevel + 1),
            unlocks,
            saveStatus: { type: 'saved', seed: summary.runSeed } // Assume save worked if applyRun returned
        });

        setPresentation(pres);
        setScreen('summary');
    }, [runManager]);

    const handleRestart = useCallback(() => {
        setCurrentRunSeed(Date.now());
        setScreen('game');
    }, []);

    const handleMainMenu = useCallback(() => {
        setScreen('menu');
    }, []);

    if (screen === 'loading' || !runManager || !definitions) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16f2b3" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {screen === 'menu' && (
                <MainMenu
                    onStartGame={handleStartGame}
                // Pass profile for level display if MainMenu supports it (TODO)
                />
            )}

            {screen === 'game' && (
                <GameCanvas
                    definitions={definitions}
                    runSeed={currentRunSeed}
                    onGameEnd={handleGameEnd}
                />
            )}

            {screen === 'summary' && presentation && (
                <PostRunSummary
                    presentation={presentation}
                    onRestart={handleRestart}
                    onMainMenu={handleMainMenu}
                />
            )}
            <StatusBar style="light" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f0f1e',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 18,
    }
});

export default function App() {
    return (
        <ErrorBoundary>
            <RootApp />
        </ErrorBoundary>
    );
}
