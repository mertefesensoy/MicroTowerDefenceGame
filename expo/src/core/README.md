# MicroTD Core

Pure TypeScript game logic - **UI-agnostic and deterministic**.

## Structure

```
src/core/
├── GameState.ts          # Main game state & simulation
├── GameEvent.ts          # Events emitted for rendering
├── GameCommand.ts        # Player input commands
├── SeededRNG.ts          # Deterministic random number generator
├── SimulationClock.ts    # Fixed 60 ticks/second clock
└── index.ts              # Exports
```

## Design Principles

1. **No UI imports** - Core must be 100% UI-agnostic
2. **Deterministic** - Same seed + same commands = same result
3. **Event-driven** - Core emits events, rendering layer consumes them
4. **Testable** - Pure functions, no side effects

## Usage

```typescript
import { GameState } from './src/core';

// Create game with seed
const game = new GameState(12345);

// Process player commands
game.processCommand({ type: 'startWave', tick: game.currentTick });

// Run simulation
game.tick();

// Read events for rendering
const events = game.eventLog.slice(lastEventIndex);
```

## Testing

```bash
npm test
```

## Phase Status

- ✅ **C0**: Expo scaffold
- ✅ **C1**: Skia renderer installed
- 🚧 **C2**: Core structure created (logic migration in progress)
- ⏳ **C3**: Minimal playable loop
- ⏳ **C4**: Persistence
- ⏳ **C5**: EAS build
