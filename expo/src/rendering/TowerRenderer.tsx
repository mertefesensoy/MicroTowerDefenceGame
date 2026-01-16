// TowerRenderer.tsx
// Renders towers with range indicators

import { Circle, Group } from '@shopify/react-native-skia';
import type { Tower } from '../core/entities/Tower';

interface TowerRendererProps {
    towers: Tower[];
    cellSize: number;
    offsetX: number;
    offsetY: number;
    selectedTower?: Tower;
}

export function TowerRenderer({ towers, cellSize, offsetX, offsetY, selectedTower }: TowerRendererProps) {
    const getTowerColor = (typeID: string): string => {
        switch (typeID) {
            case 'archer':
                return '#16f2b3';
            case 'cannon':
                return '#ff6b6b';
            default:
                return '#888';
        }
    };

    return (
        <>
            {towers.map((tower) => {
                const cx = offsetX + tower.position.x * cellSize + cellSize / 2;
                const cy = offsetY + tower.position.y * cellSize + cellSize / 2;
                const isSelected = selectedTower?.instanceId === tower.instanceId;

                return (
                    <Group key={tower.instanceId}>
                        {/* Range indicator (if selected) */}
                        {isSelected && (
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={tower.effectiveRange * cellSize}
                                color={getTowerColor(tower.typeID)}
                                opacity={0.15}
                            />
                        )}

                        {/* Tower base */}
                        <Circle
                            cx={cx}
                            cy={cy}
                            r={cellSize * 0.35}
                            color={getTowerColor(tower.typeID)}
                            opacity={0.3}
                        />

                        {/* Tower core */}
                        <Circle
                            cx={cx}
                            cy={cy}
                            r={cellSize * 0.25}
                            color={getTowerColor(tower.typeID)}
                        />

                        {/* Fire indicator */}
                        {tower.canFire() && (
                            <Circle
                                cx={cx}
                                cy={cy - cellSize * 0.15}
                                r={cellSize * 0.08}
                                color="#fff"
                                opacity={0.8}
                            />
                        )}
                    </Group>
                );
            })}
        </>
    );
}
