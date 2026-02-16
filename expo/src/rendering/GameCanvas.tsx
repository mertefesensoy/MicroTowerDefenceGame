import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Pressable } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { GameState } from '../core/GameState';
import { GameDefinitions } from '../core/definitions/GameDefinitions';
import type { RunSummary } from '../core/definitions/ProgressionTypes';
import { MapRenderer } from './MapRenderer';
import { TowerRenderer } from './TowerRenderer';
import { EnemyRenderer } from './EnemyRenderer';
import type { Tower } from '../core/entities/Tower';
import type { Enemy } from '../core/entities/Enemy';
import { RelicChoiceModal } from '../screens/RelicChoiceModal';
import { TowerDetails } from '../screens/TowerDetails';

const { width, height } = Dimensions.get('window');

interface GameCanvasProps {
    definitions: GameDefinitions;
    runSeed: number;
    onGameEnd: (summary: RunSummary) => void;
}

export function GameCanvas({ definitions, runSeed, onGameEnd }: GameCanvasProps) {
    const [game] = useState(() => new GameState(runSeed, definitions));
    const [tick, setTick] = useState(0);
    const [towers, setTowers] = useState<Tower[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [selectedTowerType, setSelectedTowerType] = useState<string | null>('archer');
    const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
    const gameEndedRef = useRef(false);

    const mapDef = game.definitions.maps.map('default')!;
    const cellSize = Math.min(width, height - 200) / Math.max(mapDef.gridWidth, mapDef.gridHeight);
    const offsetX = (width - mapDef.gridWidth * cellSize) / 2;
    const offsetY = 50;

    // Game loop
    useEffect(() => {
        const interval = setInterval(() => {
            game.tick();
            setTick(game.currentTick);
            setTowers(game.getTowers() as Tower[]);
            setEnemies(game.getEnemies() as Enemy[]);

            // Check for game end
            const state = game.currentState;
            if (state.type === 'gameOver' && !gameEndedRef.current) {
                gameEndedRef.current = true;

                gameEndedRef.current = true;

                // Generate canonical run summary
                const summary = game.makeRunSummary();

                // Small delay to show final state
                setTimeout(() => onGameEnd(summary), 500);
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [game, onGameEnd]);

    const handleCanvasTap = (x: number, y: number) => {
        // If we are in relic choice, we shouldn't be tapping canvas for towers
        if (game.currentState.type === 'relicChoice') return;

        // Convert screen coords to grid coords
        const gridX = Math.floor((x - offsetX) / cellSize);
        const gridY = Math.floor((y - offsetY) / cellSize);

        if (gridX >= 0 && gridX < mapDef.gridWidth && gridY >= 0 && gridY < mapDef.gridHeight) {
            // Check if there is a tower here
            const existingTower = game.getTowers().find(t => t.position.x === gridX && t.position.y === gridY);

            if (existingTower) {
                // Select existing tower
                setSelectedTower(existingTower);
                setSelectedTowerType(null); // Clear placement selection
            } else if (selectedTowerType && game.currentState.type === 'building') {
                // Place new tower
                game.processCommand({
                    type: 'placeTower',
                    towerType: selectedTowerType,
                    gridX,
                    gridY,
                    tick: game.currentTick,
                });
                setSelectedTower(null);
            } else {
                // Deselect
                setSelectedTower(null);
            }
        } else {
            // Tapped outside grid
            setSelectedTower(null);
        }
    };

    const handleUpgrade = (pathID: string) => {
        if (!selectedTower) return;
        game.processCommand({
            type: 'upgradeTower',
            gridX: selectedTower.position.x,
            gridY: selectedTower.position.y,
            upgradePath: pathID,
            tick: game.currentTick,
        });
        // Deselect or update selection needed?
        // The game entity will be replaced, so old Tower instance handles are stale.
        // GameState emits 'towerPlaced', we could listen.
        // For simple UI, just deserialize on next tick or close details.
        setSelectedTower(null);
    };

    const handleSell = () => {
        if (!selectedTower) return;
        game.processCommand({
            type: 'sellTower',
            gridX: selectedTower.position.x,
            gridY: selectedTower.position.y,
            tick: game.currentTick,
        });
        setSelectedTower(null);
    };

    const handleRelicChoose = (index: number) => {
        game.processCommand({
            type: 'chooseRelic',
            index,
            tick: game.currentTick,
        });
    };

    const handleStartWave = () => {
        if (game.currentState.type === 'building') {
            game.processCommand({ type: 'startWave', tick: game.currentTick });
        }
    };

    return (
        <View style={styles.container}>
            {/* Game Canvas */}
            <Pressable
                onPress={(event) => {
                    handleCanvasTap(event.nativeEvent.locationX, event.nativeEvent.locationY);
                }}
            >
                <Canvas style={{ width, height: height - 150 }}>
                    <MapRenderer
                        mapDef={mapDef}
                        cellSize={cellSize}
                        offsetX={offsetX}
                        offsetY={offsetY}
                    />
                    <TowerRenderer
                        towers={towers}
                        cellSize={cellSize}
                        offsetX={offsetX}
                        offsetY={offsetY}
                    />
                    <EnemyRenderer
                        enemies={enemies}
                        mapDef={mapDef}
                        cellSize={cellSize}
                        offsetX={offsetX}
                        offsetY={offsetY}
                    />
                </Canvas>
            </Pressable>

            {/* UI Overlay */}
            <View style={styles.ui}>
                <View style={styles.stats}>
                    <Text style={styles.statText}>💰 {game.currentCoins}</Text>
                    <Text style={styles.statText}>❤️ {game.currentLives}</Text>
                    <Text style={styles.statText}>⏱️ {tick}</Text>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.towerButton, selectedTowerType === 'archer' && styles.selectedButton]}
                        onPress={() => setSelectedTowerType('archer')}
                    >
                        <Text style={styles.buttonText}>Archer (100)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.towerButton, selectedTowerType === 'cannon' && styles.selectedButton]}
                        onPress={() => setSelectedTowerType('cannon')}
                    >
                        <Text style={styles.buttonText}>Cannon (200)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.waveButton}
                        onPress={handleStartWave}
                        disabled={game.currentState.type !== 'building'}
                    >
                        <Text style={styles.buttonText}>
                            {game.currentState.type === 'building' ? 'Start Wave' : 'Wave Active'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals & Overlays */}
            <RelicChoiceModal
                visible={game.currentState.type === 'relicChoice' && !!game.currentRelicChoices}
                choices={game.currentRelicChoices || []}
                onChoose={handleRelicChoose}
            />

            {
                selectedTower && (
                    <TowerDetails
                        tower={selectedTower!}
                        definitions={definitions}
                        currentCoins={game.currentCoins}
                        onUpgrade={handleUpgrade}
                        onSell={handleSell}
                        onClose={() => setSelectedTower(null)}
                    />
                )
            }
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
    },
    ui: {
        padding: 16,
        backgroundColor: '#1a1a2e',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    statText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    controls: {
        flexDirection: 'row',
        gap: 8,
    },
    towerButton: {
        flex: 1,
        backgroundColor: '#16f2b3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#0ea87f',
        borderWidth: 2,
        borderColor: '#16f2b3',
    },
    waveButton: {
        flex: 1,
        backgroundColor: '#ff6b6b',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
