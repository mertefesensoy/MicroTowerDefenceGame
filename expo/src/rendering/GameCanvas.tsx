import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable, useWindowDimensions } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { GameState } from '../core/GameState';
import { GameDefinitions } from '../core/definitions/GameDefinitions';
import type { RunSummary } from '../core/definitions/ProgressionTypes';
import type { RenderSnapshot } from '../core/systems/RenderSnapshot';
import type { Tower } from '../core/entities/Tower';
import { MapRenderer } from './MapRenderer';
import { TowerRenderer } from './TowerRenderer';
import { EnemyRenderer } from './EnemyRenderer';
import { RelicChoiceModal } from '../screens/RelicChoiceModal';
import { TowerDetails } from '../screens/TowerDetails';

// IDs of base (purchasable) towers — upgrades are excluded
const BASE_TOWER_IDS = ['cannon', 'frost', 'bomb'];

const TICK_MS = 1000 / 60;

interface GameCanvasProps {
    definitions: GameDefinitions;
    runSeed: number;
    onGameEnd: (summary: RunSummary) => void;
}

export function GameCanvas({ definitions, runSeed, onGameEnd }: GameCanvasProps) {
    const { width, height } = useWindowDimensions();

    // Game engine — created once per run
    const [game] = useState(() => new GameState(runSeed, definitions));

    // Snapshot ref — updated in the RAF loop, never triggers re-renders on its own
    const snapshotRef = useRef<RenderSnapshot>(game.makeRenderSnapshot());

    // Single frame counter — the only React state that drives 60fps re-renders
    const [, setFrameCount] = useState(0);

    // Game-over guard — prevents calling onGameEnd more than once
    const gameEndedRef = useRef(false);

    // UI state: what tower type is selected for placement
    const [selectedTowerType, setSelectedTowerType] = useState<string>('cannon');
    // UI state: ID of the placed tower currently selected (for TowerDetails)
    const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);

    // Map layout — stable for the lifetime of this component
    const mapDef = useMemo(() => definitions.maps.map('default')!, [definitions]);
    const cellSize = Math.min(width, height - 200) / Math.max(mapDef.gridWidth, mapDef.gridHeight);
    const offsetX = (width - mapDef.gridWidth * cellSize) / 2;
    const offsetY = 50;

    // Base tower defs for placement buttons — derived from definitions, not hardcoded
    const baseTowers = useMemo(
        () => BASE_TOWER_IDS.map(id => definitions.towers.tower(id)!).filter(Boolean),
        [definitions],
    );

    // ─── Game Loop (requestAnimationFrame + fixed-timestep accumulator) ───
    useEffect(() => {
        let raf: number;
        let lastTime = -1;
        let accumulator = 0;

        const loop = (time: number) => {
            if (gameEndedRef.current) return;

            // First frame: initialise lastTime without accumulating a huge delta
            if (lastTime < 0) lastTime = time;

            // Cap delta to 100ms to prevent the spiral-of-death on slow frames
            const delta = Math.min(time - lastTime, 100);
            lastTime = time;
            accumulator += delta;

            while (accumulator >= TICK_MS) {
                game.tick();
                snapshotRef.current = game.makeRenderSnapshot();
                accumulator -= TICK_MS;

                if (snapshotRef.current.stateType === 'gameOver') {
                    gameEndedRef.current = true;
                    setTimeout(() => onGameEnd(game.makeRunSummary()), 500);
                    break;
                }
            }

            setFrameCount(c => c + 1);

            if (!gameEndedRef.current) {
                raf = requestAnimationFrame(loop);
            }
        };

        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [game, onGameEnd]);

    // ─── Get selected tower — always a fresh lookup from the game engine ───
    // Using ID lookup avoids the stale-reference problem after upgrades.
    // GameState preserves tower instanceId across upgrades so this stays valid.
    const selectedTower: Tower | null = useMemo(
        () => selectedTowerId !== null
            ? (game.getTowers().find(t => t.instanceId === selectedTowerId) ?? null)
            : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedTowerId, snapshotRef.current.tick], // re-run whenever frame advances
    );

    // ─── Input handlers ───

    const handleCanvasTap = useCallback((x: number, y: number) => {
        const snapshot = snapshotRef.current;
        if (snapshot.stateType === 'relicChoice') return;

        const gridX = Math.floor((x - offsetX) / cellSize);
        const gridY = Math.floor((y - offsetY) / cellSize);

        if (gridX < 0 || gridX >= mapDef.gridWidth || gridY < 0 || gridY >= mapDef.gridHeight) {
            setSelectedTowerId(null);
            return;
        }

        const existing = snapshot.towers.find(
            t => t.gridPosition.x === gridX && t.gridPosition.y === gridY,
        );

        if (existing) {
            // Select placed tower — enter inspect mode
            setSelectedTowerId(existing.id);
            setSelectedTowerType('');
        } else if (selectedTowerType && snapshot.stateType === 'building') {
            // Place tower
            game.processCommand({
                type: 'placeTower',
                towerType: selectedTowerType,
                gridX,
                gridY,
                tick: game.currentTick,
            });
        } else {
            setSelectedTowerId(null);
        }
    }, [offsetX, offsetY, cellSize, mapDef, selectedTowerType, game]);

    const handleUpgrade = useCallback((pathID: string) => {
        if (!selectedTower) return;
        game.processCommand({
            type: 'upgradeTower',
            gridX: selectedTower.position.x,
            gridY: selectedTower.position.y,
            upgradePath: pathID,
            tick: game.currentTick,
        });
        // Keep selection open — instanceId is preserved after upgrade so the
        // next render will look up the upgraded tower automatically.
    }, [selectedTower, game]);

    const handleSell = useCallback(() => {
        if (!selectedTower) return;
        game.processCommand({
            type: 'sellTower',
            gridX: selectedTower.position.x,
            gridY: selectedTower.position.y,
            tick: game.currentTick,
        });
        setSelectedTowerId(null);
    }, [selectedTower, game]);

    const handleRelicChoose = useCallback((index: number) => {
        game.processCommand({ type: 'chooseRelic', index, tick: game.currentTick });
    }, [game]);

    const handleStartWave = useCallback(() => {
        if (snapshotRef.current.stateType === 'building') {
            game.processCommand({ type: 'startWave', tick: game.currentTick });
        }
    }, [game]);

    // ─── Render ───

    const snapshot = snapshotRef.current;
    const isBuilding = snapshot.stateType === 'building';
    const canvasHeight = height - 150;

    return (
        <View style={styles.container}>
            {/* Game canvas */}
            <Pressable
                onPress={(e) => handleCanvasTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            >
                <Canvas style={{ width, height: canvasHeight }}>
                    <MapRenderer
                        mapDef={mapDef}
                        cellSize={cellSize}
                        offsetX={offsetX}
                        offsetY={offsetY}
                    />
                    <TowerRenderer
                        towers={snapshot.towers}
                        cellSize={cellSize}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        selectedTowerId={selectedTowerId}
                    />
                    <EnemyRenderer
                        enemies={snapshot.enemies}
                        mapDef={mapDef}
                        cellSize={cellSize}
                        offsetX={offsetX}
                        offsetY={offsetY}
                    />
                </Canvas>
            </Pressable>

            {/* HUD */}
            <View style={styles.ui}>
                <View style={styles.stats}>
                    <Text style={styles.statText}>💰 {snapshot.coins}</Text>
                    <Text style={styles.statText}>❤️ {snapshot.lives}</Text>
                    <Text style={styles.statText}>
                        Wave {snapshot.currentWave + 1}/{snapshot.totalWaves}
                    </Text>
                </View>

                <View style={styles.controls}>
                    {baseTowers.map(def => (
                        <TouchableOpacity
                            key={def.id}
                            style={[
                                styles.towerButton,
                                selectedTowerType === def.id && styles.selectedButton,
                                !isBuilding && styles.disabledButton,
                            ]}
                            onPress={() => {
                                setSelectedTowerType(def.id);
                                setSelectedTowerId(null);
                            }}
                            disabled={!isBuilding}
                        >
                            <Text style={styles.buttonText}>{def.name}</Text>
                            <Text style={styles.costText}>{def.cost} 💰</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.waveButton, !isBuilding && styles.waveButtonDisabled]}
                        onPress={handleStartWave}
                        disabled={!isBuilding}
                    >
                        <Text style={styles.buttonText}>
                            {isBuilding ? 'Start Wave' : 'Wave Active'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals */}
            <RelicChoiceModal
                visible={snapshot.stateType === 'relicChoice' && !!game.currentRelicChoices}
                choices={game.currentRelicChoices || []}
                onChoose={handleRelicChoose}
            />

            {selectedTower && (
                <TowerDetails
                    tower={selectedTower}
                    definitions={definitions}
                    currentCoins={snapshot.coins}
                    onUpgrade={handleUpgrade}
                    onSell={handleSell}
                    onClose={() => setSelectedTowerId(null)}
                />
            )}
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
        fontSize: 16,
        fontWeight: 'bold',
    },
    controls: {
        flexDirection: 'row',
        gap: 6,
    },
    towerButton: {
        flex: 1,
        backgroundColor: '#16f2b3',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#0ea87f',
        borderWidth: 2,
        borderColor: '#16f2b3',
    },
    disabledButton: {
        opacity: 0.4,
    },
    waveButton: {
        flex: 1,
        backgroundColor: '#ff6b6b',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveButtonDisabled: {
        backgroundColor: '#883333',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    costText: {
        color: '#ffffffcc',
        fontSize: 11,
        marginTop: 2,
    },
});
