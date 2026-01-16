import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Pressable } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { GameState } from '../core/GameState';
import { createSampleDefinitions } from '../core/definitions/GameDefinitions';
import { MapRenderer } from './MapRenderer';
import { TowerRenderer } from './TowerRenderer';
import { EnemyRenderer } from './EnemyRenderer';
import type { Tower } from '../core/entities/Tower';
import type { Enemy } from '../core/entities/Enemy';

const { width, height } = Dimensions.get('window');

export function GameCanvas() {
    const [game] = useState(() => new GameState(Date.now(), createSampleDefinitions()));
    const [tick, setTick] = useState(0);
    const [towers, setTowers] = useState<Tower[]>([]);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [selectedTowerType, setSelectedTowerType] = useState<string | null>('archer');

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
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [game]);

    const handleCanvasTap = (x: number, y: number) => {
        if (!selectedTowerType) return;
        if (game.currentState.type !== 'building') return;

        // Convert screen coords to grid coords
        const gridX = Math.floor((x - offsetX) / cellSize);
        const gridY = Math.floor((y - offsetY) / cellSize);

        if (gridX >= 0 && gridX < mapDef.gridWidth && gridY >= 0 && gridY < mapDef.gridHeight) {
            game.processCommand({
                type: 'placeTower',
                towerType: selectedTowerType,
                gridX,
                gridY,
                tick: game.currentTick,
            });
        }
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
        </View>
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
