import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable, useWindowDimensions, AppState, AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const SPEED_OPTIONS = [1, 2, 4] as const;
type GameSpeed = typeof SPEED_OPTIONS[number];

interface GameCanvasProps {
    definitions: GameDefinitions;
    runSeed: number;
    onGameEnd: (summary: RunSummary) => void;
}

export function GameCanvas({ definitions, runSeed, onGameEnd }: GameCanvasProps) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

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
    // Pause/speed state
    const [paused, setPaused] = useState(false);
    const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
    const pausedRef = useRef(false);
    const gameSpeedRef = useRef<GameSpeed>(1);

    // Placement feedback state
    const [invalidCell, setInvalidCell] = useState<{ x: number; y: number } | null>(null);
    const invalidCellTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Map layout — stable for the lifetime of this component
    const mapDef = useMemo(() => definitions.maps.map('default')!, [definitions]);

    // Responsive layout: account for safe areas and HUD height
    const HUD_HEIGHT = 160; // approximate height of bottom panel
    const canvasHeight = height - HUD_HEIGHT - insets.bottom;
    const cellSize = Math.min(width - 16, canvasHeight - 60) / Math.max(mapDef.gridWidth, mapDef.gridHeight);
    const offsetX = (width - mapDef.gridWidth * cellSize) / 2;
    const offsetY = 44; // space for phase banner

    // Base tower defs for placement buttons — derived from definitions, not hardcoded
    const baseTowers = useMemo(
        () => BASE_TOWER_IDS.map(id => definitions.towers.tower(id)!).filter(Boolean),
        [definitions],
    );

    // Keep refs in sync so the RAF loop reads current values without re-subscribing
    pausedRef.current = paused;
    gameSpeedRef.current = gameSpeed;

    // ─── Pause on app background ───
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state !== 'active') {
                setPaused(true);
            }
        });
        return () => sub.remove();
    }, []);

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

            // When paused: keep RAF alive for UI, but don't accumulate simulation time
            if (!pausedRef.current) {
                accumulator += delta * gameSpeedRef.current;

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
    const selectedTower: Tower | null = useMemo(
        () => selectedTowerId !== null
            ? (game.getTowers().find(t => t.instanceId === selectedTowerId) ?? null)
            : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedTowerId, snapshotRef.current.tick],
    );

    // ─── Input handlers ───

    const showInvalidFeedback = useCallback((x: number, y: number) => {
        if (invalidCellTimer.current) clearTimeout(invalidCellTimer.current);
        setInvalidCell({ x, y });
        invalidCellTimer.current = setTimeout(() => setInvalidCell(null), 400);
    }, []);

    const handleCanvasTap = useCallback((tapX: number, tapY: number) => {
        const snapshot = snapshotRef.current;
        if (snapshot.stateType === 'relicChoice') return;

        const gridX = Math.floor((tapX - offsetX) / cellSize);
        const gridY = Math.floor((tapY - offsetY) / cellSize);

        if (gridX < 0 || gridX >= mapDef.gridWidth || gridY < 0 || gridY >= mapDef.gridHeight) {
            setSelectedTowerId(null);
            return;
        }

        const existing = snapshot.towers.find(
            t => t.gridPosition.x === gridX && t.gridPosition.y === gridY,
        );

        if (existing) {
            // Select placed tower — works during both building and wave phases
            setSelectedTowerId(existing.id);
            setSelectedTowerType('');
        } else if (selectedTowerType && snapshot.stateType === 'building') {
            // Attempt tower placement (only during building phase)
            const towerDef = definitions.towers.tower(selectedTowerType);
            if (!towerDef || snapshot.coins < towerDef.cost) {
                // Can't afford — show invalid feedback
                showInvalidFeedback(gridX, gridY);
                return;
            }

            const prevCoins = snapshot.coins;
            game.processCommand({
                type: 'placeTower',
                towerType: selectedTowerType,
                gridX,
                gridY,
                tick: game.currentTick,
            });

            // Check if placement actually succeeded (might be path tile / blocked)
            const newSnapshot = game.makeRenderSnapshot();
            if (newSnapshot.coins === prevCoins) {
                // Placement was rejected by game engine — show feedback
                showInvalidFeedback(gridX, gridY);
            }
        } else if (selectedTowerType && snapshot.stateType !== 'building') {
            // Tried to place during wave — no feedback needed, buttons already disabled
            setSelectedTowerId(null);
        } else {
            setSelectedTowerId(null);
        }
    }, [offsetX, offsetY, cellSize, mapDef, selectedTowerType, game, definitions, showInvalidFeedback]);

    const handleUpgrade = useCallback((pathID: string) => {
        if (!selectedTower) return;
        game.processCommand({
            type: 'upgradeTower',
            gridX: selectedTower.position.x,
            gridY: selectedTower.position.y,
            upgradePath: pathID,
            tick: game.currentTick,
        });
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

    const handleTogglePause = useCallback(() => {
        setPaused(p => !p);
    }, []);

    const handleCycleSpeed = useCallback(() => {
        setGameSpeed(current => {
            const idx = SPEED_OPTIONS.indexOf(current);
            return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
        });
    }, []);

    // ─── Render ───

    const snapshot = snapshotRef.current;
    const isBuilding = snapshot.stateType === 'building';
    const livesLow = snapshot.lives <= 5 && snapshot.lives > 0;

    // Phase banner text
    const phaseBannerText = isBuilding
        ? `🔨 BUILDING — Wave ${snapshot.currentWave + 1}/${snapshot.totalWaves}`
        : snapshot.stateType === 'inWave'
            ? `⚔️ WAVE ${snapshot.currentWave + 1}/${snapshot.totalWaves}`
            : snapshot.stateType === 'relicChoice'
                ? '✨ CHOOSE A RELIC'
                : snapshot.stateType === 'gameOver'
                    ? '💀 GAME OVER'
                    : `Wave ${snapshot.currentWave + 1}/${snapshot.totalWaves}`;

    return (
        <View style={styles.container}>
            {/* Phase Banner */}
            <View style={[styles.phaseBanner, isBuilding ? styles.phaseBannerBuilding : styles.phaseBannerWave]}>
                <Text style={styles.phaseBannerText}>{phaseBannerText}</Text>
            </View>

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
                        invalidCell={invalidCell}
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
            <View style={[styles.ui, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <View style={styles.stats}>
                    <Text style={styles.statText}>💰 {snapshot.coins}</Text>
                    <Text style={[styles.statText, livesLow && styles.statTextDanger]}>
                        ❤️ {snapshot.lives}
                    </Text>
                </View>

                <View style={styles.controls}>
                    {baseTowers.map(def => {
                        const canAfford = snapshot.coins >= def.cost;
                        return (
                            <TouchableOpacity
                                key={def.id}
                                style={[
                                    styles.towerButton,
                                    selectedTowerType === def.id && styles.selectedButton,
                                    !isBuilding && styles.disabledButton,
                                    isBuilding && !canAfford && styles.unaffordableButton,
                                ]}
                                onPress={() => {
                                    setSelectedTowerType(def.id);
                                    setSelectedTowerId(null);
                                }}
                                disabled={!isBuilding}
                            >
                                <Text style={styles.buttonText}>{def.name}</Text>
                                <Text style={[
                                    styles.costText,
                                    isBuilding && !canAfford && styles.costTextUnaffordable,
                                ]}>
                                    {def.cost} 💰
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity
                        style={[styles.waveButton, !isBuilding && styles.waveButtonDisabled]}
                        onPress={handleStartWave}
                        disabled={!isBuilding}
                    >
                        <Text style={styles.waveButtonText}>
                            {isBuilding ? '▶ Start\nWave' : '⚔️ Wave\nActive'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Pause + Speed controls */}
                <View style={styles.gameControls}>
                    <TouchableOpacity
                        style={[styles.controlButton, paused && styles.controlButtonActive]}
                        onPress={handleTogglePause}
                    >
                        <Text style={[styles.controlButtonText, paused && styles.controlButtonTextActive]}>
                            {paused ? '▶ Resume' : '⏸ Pause'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handleCycleSpeed}
                    >
                        <Text style={styles.controlButtonText}>{gameSpeed}x Speed</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pause Overlay */}
            {paused && (
                <View style={styles.pauseOverlay}>
                    <View style={styles.pauseBox}>
                        <Text style={styles.pauseTitle}>⏸ PAUSED</Text>
                        <TouchableOpacity style={styles.pauseResumeButton} onPress={handleTogglePause}>
                            <Text style={styles.pauseResumeText}>▶ Resume</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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
                    isBuilding={isBuilding}
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
    // ─── Phase Banner ───
    phaseBanner: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    phaseBannerBuilding: {
        backgroundColor: '#1a3a2e',
    },
    phaseBannerWave: {
        backgroundColor: '#3a1a1a',
    },
    phaseBannerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    // ─── HUD ───
    ui: {
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: '#1a1a2e',
        borderTopWidth: 1,
        borderTopColor: '#2a2a3e',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 10,
    },
    statText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    statTextDanger: {
        color: '#ff4444',
    },
    // ─── Tower Buttons ───
    controls: {
        flexDirection: 'row',
        gap: 6,
    },
    towerButton: {
        flex: 1,
        backgroundColor: '#16f2b3',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    selectedButton: {
        backgroundColor: '#0ea87f',
        borderWidth: 2,
        borderColor: '#fff',
    },
    disabledButton: {
        opacity: 0.35,
    },
    unaffordableButton: {
        backgroundColor: '#555',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    costText: {
        color: '#ffffffcc',
        fontSize: 12,
        marginTop: 2,
    },
    costTextUnaffordable: {
        color: '#ff6b6b',
    },
    // ─── Wave Button ───
    waveButton: {
        flex: 1,
        backgroundColor: '#ff6b6b',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    waveButtonDisabled: {
        backgroundColor: '#553333',
        opacity: 0.8,
    },
    waveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    // ─── Pause + Speed ───
    gameControls: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    controlButton: {
        flex: 1,
        backgroundColor: '#2a2a3e',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        minHeight: 44,
        justifyContent: 'center',
    },
    controlButtonActive: {
        backgroundColor: '#16f2b3',
    },
    controlButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    controlButtonTextActive: {
        color: '#0f0f1e',
    },
    // ─── Pause Overlay ───
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    pauseBox: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        paddingVertical: 32,
        paddingHorizontal: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a3e',
    },
    pauseTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        letterSpacing: 2,
    },
    pauseResumeButton: {
        backgroundColor: '#16f2b3',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
    },
    pauseResumeText: {
        color: '#0f0f1e',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
