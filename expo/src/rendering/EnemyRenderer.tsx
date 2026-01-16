// EnemyRenderer.tsx
// Renders enemies moving along path

import { Circle, Group } from '@shopify/react-native-skia';
import type { Enemy } from '../core/entities/Enemy';
import type { MapDef } from '../core/definitions/MapDef';

interface EnemyRendererProps {
    enemies: Enemy[];
    mapDef: MapDef;
    cellSize: number;
    offsetX: number;
    offsetY: number;
}

export function EnemyRenderer({ enemies, mapDef, cellSize, offsetX, offsetY }: EnemyRendererProps) {
    const getEnemyColor = (typeID: string): string => {
        switch (typeID) {
            case 'basic':
                return '#ffd700';
            case 'fast':
                return '#00ffff';
            case 'tank':
                return '#ff1744';
            default:
                return '#888';
        }
    };

    const calculatePosition = (pathProgress: number) => {
        const waypoints = [...mapDef.waypoints].sort((a, b) => a.pathProgress - b.pathProgress);

        if (waypoints.length === 0) return { x: 0, y: 0 };
        if (pathProgress <= waypoints[0].pathProgress) return waypoints[0].position;
        if (pathProgress >= waypoints[waypoints.length - 1].pathProgress) {
            return waypoints[waypoints.length - 1].position;
        }

        // Find segment and interpolate
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];

            if (pathProgress >= start.pathProgress && pathProgress <= end.pathProgress) {
                const t = (pathProgress - start.pathProgress) / (end.pathProgress - start.pathProgress);
                return {
                    x: start.position.x * (1 - t) + end.position.x * t,
                    y: start.position.y * (1 - t) + end.position.y * t,
                };
            }
        }

        return waypoints[waypoints.length - 1].position;
    };

    return (
        <>
            {enemies.map((enemy) => {
                const pos = calculatePosition(enemy.pathProgress);
                const cx = offsetX + pos.x * cellSize + cellSize / 2;
                const cy = offsetY + pos.y * cellSize + cellSize / 2;
                const hpPercent = enemy.currentHP / enemy.baseDef.hp;

                return (
                    <Group key={enemy.instanceId}>
                        {/* Enemy body */}
                        <Circle
                            cx={cx}
                            cy={cy}
                            r={cellSize * 0.3}
                            color={getEnemyColor(enemy.typeID)}
                        />

                        {/* HP bar background */}
                        <Circle
                            cx={cx}
                            cy={cy}
                            r={cellSize * 0.35}
                            color="#000"
                            opacity={0.5}
                            style="stroke"
                            strokeWidth={2}
                        />

                        {/* HP bar (arc showing health) */}
                        {hpPercent < 1 && (
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={cellSize * 0.35}
                                color="#ff4444"
                                opacity={0.8}
                                style="stroke"
                                strokeWidth={2}
                            />
                        )}

                        {/* Slow effect indicator */}
                        {enemy.slowEffect && (
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={cellSize * 0.4}
                                color="#00ffff"
                                opacity={0.3}
                            />
                        )}
                    </Group>
                );
            })}
        </>
    );
}
