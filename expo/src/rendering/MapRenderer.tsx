// MapRenderer.tsx
// Renders game map, grid, and path using Skia

import { Rect, Path, Circle, Skia } from '@shopify/react-native-skia';
import type { MapDef } from '../core/definitions/MapDef';

interface MapRendererProps {
    mapDef: MapDef;
    cellSize: number;
    offsetX: number;
    offsetY: number;
}

export function MapRenderer({ mapDef, cellSize, offsetX, offsetY }: MapRendererProps) {
    // Create path from waypoints
    const createPath = () => {
        if (mapDef.waypoints.length === 0) return null;

        const path = Skia.Path.Make();
        const sorted = [...mapDef.waypoints].sort((a, b) => a.pathProgress - b.pathProgress);

        const firstWp = sorted[0];
        path.moveTo(
            offsetX + firstWp.position.x * cellSize + cellSize / 2,
            offsetY + firstWp.position.y * cellSize + cellSize / 2
        );

        for (let i = 1; i < sorted.length; i++) {
            const wp = sorted[i];
            path.lineTo(
                offsetX + wp.position.x * cellSize + cellSize / 2,
                offsetY + wp.position.y * cellSize + cellSize / 2
            );
        }

        return path;
    };

    const enemyPath = createPath();

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

            {/* Grid lines */}
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
