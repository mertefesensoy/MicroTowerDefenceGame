// MapRenderer.tsx
// Renders the game grid and enemy path using Skia.
// Path is memoized — it only needs to be recreated if the map layout or cell size changes.

import { useMemo } from 'react';
import { Rect, Path, Circle, Skia } from '@shopify/react-native-skia';
import type { MapDef } from '../core/definitions/MapDef';

interface MapRendererProps {
    mapDef: MapDef;
    cellSize: number;
    offsetX: number;
    offsetY: number;
}

export function MapRenderer({ mapDef, cellSize, offsetX, offsetY }: MapRendererProps) {
    // Build Skia path once — the map and cell size are stable during a run.
    // This prevents allocating a new path object on every frame (~60/s).
    const enemyPath = useMemo(() => {
        if (mapDef.waypoints.length === 0) return null;

        const path = Skia.Path.Make();
        const sorted = [...mapDef.waypoints].sort((a, b) => a.pathProgress - b.pathProgress);

        path.moveTo(
            offsetX + sorted[0].position.x * cellSize + cellSize / 2,
            offsetY + sorted[0].position.y * cellSize + cellSize / 2,
        );
        for (let i = 1; i < sorted.length; i++) {
            path.lineTo(
                offsetX + sorted[i].position.x * cellSize + cellSize / 2,
                offsetY + sorted[i].position.y * cellSize + cellSize / 2,
            );
        }

        return path;
    }, [mapDef, cellSize, offsetX, offsetY]);

    return (
        <>
            {/* Grid background */}
            <Rect
                x={offsetX}
                y={offsetY}
                width={mapDef.gridWidth * cellSize}
                height={mapDef.gridHeight * cellSize}
                color="#1a1a2e"
            />

            {/* Vertical grid lines */}
            {Array.from({ length: mapDef.gridWidth + 1 }).map((_, i) => (
                <Rect
                    key={`v-${i}`}
                    x={offsetX + i * cellSize}
                    y={offsetY}
                    width={1}
                    height={mapDef.gridHeight * cellSize}
                    color="#2a2a3e"
                />
            ))}

            {/* Horizontal grid lines */}
            {Array.from({ length: mapDef.gridHeight + 1 }).map((_, i) => (
                <Rect
                    key={`h-${i}`}
                    x={offsetX}
                    y={offsetY + i * cellSize}
                    width={mapDef.gridWidth * cellSize}
                    height={1}
                    color="#2a2a3e"
                />
            ))}

            {/* Enemy path */}
            {enemyPath && (
                <Path
                    path={enemyPath}
                    color="#ff6b6b"
                    style="stroke"
                    strokeWidth={cellSize * 0.4}
                    opacity={0.3}
                />
            )}

            {/* Waypoint markers */}
            {mapDef.waypoints.map((wp, idx) => (
                <Circle
                    key={idx}
                    cx={offsetX + wp.position.x * cellSize + cellSize / 2}
                    cy={offsetY + wp.position.y * cellSize + cellSize / 2}
                    r={cellSize * 0.15}
                    color="#ff6b6b"
                    opacity={0.6}
                />
            ))}
        </>
    );
}
