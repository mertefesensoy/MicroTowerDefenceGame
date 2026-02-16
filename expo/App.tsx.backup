import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { MainMenu } from './src/screens/MainMenu';
import { GameCanvas } from './src/rendering/GameCanvas';
import { PostRunSummary } from './src/screens/PostRunSummary';
import type { RunResult } from './src/persistence/RunResult';

type Screen = 'menu' | 'game' | 'summary';

export default function App() {
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
