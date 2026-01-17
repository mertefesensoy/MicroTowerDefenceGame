import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { MainMenu } from './src/screens/MainMenu';
import { GameCanvas } from './src/rendering/GameCanvas';
import { PostRunSummary } from './src/screens/PostRunSummary';
import type { RunResult } from './src/persistence/RunResult';
import { ErrorBoundary } from './src/ErrorBoundary';

type Screen = 'menu' | 'game' | 'summary';

function RootApp() {
    const [screen, setScreen] = useState<Screen>('menu');
    const [runResult, setRunResult] = useState<RunResult | null>(null);

    const handleStartGame = () => {
        setScreen('game');
    };

    const handleGameEnd = (result: RunResult) => {
        setRunResult(result);
        setScreen('summary');
    };

    const handleRestart = () => {
        setScreen('game');
    };

    const handleMainMenu = () => {
        setScreen('menu');
    };

    return (
        <>
            {screen === 'menu' && <MainMenu onStartGame={handleStartGame} />}
            {screen === 'game' && <GameCanvas onGameEnd={handleGameEnd} />}
            {screen === 'summary' && runResult && (
                <PostRunSummary
                    result={runResult}
                    onRestart={handleRestart}
                    onMainMenu={handleMainMenu}
                />
            )}
            <StatusBar style="light" />
        </>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <RootApp />
        </ErrorBoundary>
    );
}
