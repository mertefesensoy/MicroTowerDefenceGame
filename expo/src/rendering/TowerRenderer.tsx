// TowerRenderer.tsx
// Renders towers using RenderTower DTOs (no game-entity coupling)

import { Circle, Group } from '@shopify/react-native-skia';
import type { RenderTower } from '../core/systems/RenderSnapshot';

interface TowerRendererProps {
    towers: RenderTower[];
    cellSize: number;
    offsetX: number;
    offsetY: number;
    selectedTowerId: number | null;
}

export function TowerRenderer({ towers, cellSize, offsetX, offsetY, selectedTowerId }: TowerRendererProps) {
    const getTowerColor = (typeID: string): string => {
        switch (typeID) {
            // Cannon family
            case 'cannon': return '#ff6b6b';
            case 'heavy':  return '#cc2222';
            case 'rapid':  return '#ff9966';
            // Frost family
            case 'frost':       return '#00bfff';
            case 'deep_freeze': return '#0066cc';
            case 'wide_chill':  return '#88eeff';
            // Bomb family
            case 'bomb':    return '#ffcc00';
            case 'napalm':  return '#ff8800';
            case 'cluster': return '#ffee88';
            default:        return '#888888';
        }
    };

    return (
        <>
            {towers.map((tower) => {
                const cx = offsetX + tower.gridPosition.x * cellSize + cellSize / 2;
                const cy = offsetY + tower.gridPosition.y * cellSize + cellSize / 2;
                const color = getTowerColor(tower.typeID);
                const isSelected = tower.id === selectedTowerId;

                return (
                    <Group key={tower.id}>
                        {/* Range indicator when tower is selected */}
                        {isSelected && (
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={tower.effectiveRange * cellSize}
                                color={color}
                                opacity={0.15}
                            />
                        )}

                        {/* Tower base (translucent halo) */}
                        <Circle cx={cx} cy={cy} r={cellSize * 0.35} color={color} opacity={0.3} />

                        {/* Tower core */}
                        <Circle cx={cx} cy={cy} r={cellSize * 0.25} color={color} />

                        {/* Ready-to-fire indicator dot */}
                        {tower.canFire && (
                            <Circle
                                cx={cx}
                                cy={cy - cellSize * 0.15}
                                r={cellSize * 0.08}
                                color="#ffffff"
                                opacity={0.85}
                            />
                        )}
                    </Group>
                );
            })}
        </>
    );
}
