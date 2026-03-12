// EnemyRenderer.tsx
// Renders enemies moving along the path using RenderEnemy DTOs (no game-entity coupling)

import { useMemo } from 'react';
import { Circle, Group, Rect } from '@shopify/react-native-skia';
import type { RenderEnemy } from '../core/systems/RenderSnapshot';
import type { MapDef } from '../core/definitions/MapDef';

interface EnemyRendererProps {
    enemies: RenderEnemy[];
    mapDef: MapDef;
    cellSize: number;
    offsetX: number;
    offsetY: number;
}

export function EnemyRenderer({ enemies, mapDef, cellSize, offsetX, offsetY }: EnemyRendererProps) {
    // Pre-sort waypoints once — the map never changes mid-run
    const sortedWaypoints = useMemo(
        () => [...mapDef.waypoints].sort((a, b) => a.pathProgress - b.pathProgress),
        [mapDef],
    );

    const getEnemyColor = (typeID: string, isBoss: boolean): string => {
        if (isBoss) return '#ff00ff';
        switch (typeID) {
            case 'runner':   return '#ffd700';
            case 'tank':     return '#ff1744';
            case 'swarm':    return '#00e676';
            case 'shielded': return '#64b5f6';
            default:         return '#aaaaaa';
        }
    };

    const calculatePosition = (pathProgress: number): { x: number; y: number } => {
        const wps = sortedWaypoints;
        if (wps.length === 0) return { x: 0, y: 0 };
        if (pathProgress <= wps[0].pathProgress) return wps[0].position;
        if (pathProgress >= wps[wps.length - 1].pathProgress) return wps[wps.length - 1].position;

        for (let i = 0; i < wps.length - 1; i++) {
            const start = wps[i];
            const end = wps[i + 1];
            if (pathProgress >= start.pathProgress && pathProgress <= end.pathProgress) {
                const t = (pathProgress - start.pathProgress) / (end.pathProgress - start.pathProgress);
                return {
                    x: start.position.x * (1 - t) + end.position.x * t,
                    y: start.position.y * (1 - t) + end.position.y * t,
                };
            }
        }

        return wps[wps.length - 1].position;
    };

    const hpColor = (fraction: number): string => {
        if (fraction > 0.5) return '#44ff44';
        if (fraction > 0.25) return '#ffaa00';
        return '#ff3333';
    };

    return (
        <>
            {enemies.map((enemy) => {
                const pos = calculatePosition(enemy.pathProgress);
                const cx = offsetX + pos.x * cellSize + cellSize / 2;
                const cy = offsetY + pos.y * cellSize + cellSize / 2;
                const color = getEnemyColor(enemy.typeID, enemy.isBoss);
                const radius = enemy.isBoss ? cellSize * 0.45 : cellSize * 0.3;

                // HP bar: a rectangle above the enemy
                const barW = cellSize * 0.7;
                const barH = cellSize * 0.1;
                const barX = cx - barW / 2;
                const barY = cy - radius - barH - 3;

                return (
                    <Group key={enemy.id}>
                        {/* Slow glow */}
                        {enemy.isSlowed && (
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={radius * 1.5}
                                color="#00bfff"
                                opacity={0.25}
                            />
                        )}

                        {/* Enemy body */}
                        <Circle cx={cx} cy={cy} r={radius} color={color} />

                        {/* HP bar — only shown when damaged */}
                        {enemy.hpFraction < 1 && (
                            <>
                                <Rect
                                    x={barX}
                                    y={barY}
                                    width={barW}
                                    height={barH}
                                    color="#222"
                                    opacity={0.8}
                                />
                                <Rect
                                    x={barX}
                                    y={barY}
                                    width={barW * enemy.hpFraction}
                                    height={barH}
                                    color={hpColor(enemy.hpFraction)}
                                />
                            </>
                        )}
                    </Group>
                );
            })}
        </>
    );
}
