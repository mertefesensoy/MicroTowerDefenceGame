# Mission 1: Core Simulation with Deterministic RNG

## Summary
Implemented pure Swift simulation layer with zero UI dependencies, deterministic seeded RNG, data-driven JSON definitions, and comprehensive unit tests.

**Key Achievements**:
- ✅ Xoshiro256** deterministic RNG
- ✅ 60 ticks/sec fixed timestep simulation
- ✅ All JSON resources bundled with `Bundle.module`
- ✅ Stable spawn sorting with (spawnTick, originalIndex)
- ✅ Golden seed tests lock expected behaviors
- ✅ CI workflow enforces zero UI imports

## Files Changed
- **MicroTDCore Package**: 20 Swift files (Foundations, Definitions, Systems, Entities)
- **Resources**: 5 JSON files (towers, enemies, relics, maps, waves)
- **Tests**: 6 test files with comprehensive coverage
- **CI**: GitHub Actions workflow with UI import verification
- **Total**: 37 files created

## How to Verify

### Build Package
```bash
cd MicroTDCore
swift build
```
Expected: ✅ Build succeeds with zero errors

### Run Tests
```bash
swift test
```
Expected: ✅ All tests pass including:
- RNG determinism
- Combat logic (damage, death, slow refresh)
- Simulation determinism
- Golden seed reproducibility

### Verify No UI Imports
```bash
cd Sources/MicroTDCore
grep -r "import SwiftUI\|import SpriteKit\|import UIKit" . --include="*.swift"
```
Expected: No output (zero UI imports)

### CI Verification
Push to GitHub and verify Actions workflow passes with green ✅

## Acceptance Checklist
- [x] MicroTDCore package compiles with zero UI framework imports
- [x] All unit tests pass
- [x] Golden seeds 12345 and 98765 locked with expected outputs
- [x] SimulationRunner produces identical console output across runs
- [x] JSON resources bundled using Bundle.module
- [x] Package.swift includes resources declaration
- [x] Wave spawns sorted by (spawnTick, originalIndex) for stability
- [x] GitHub Actions CI workflow passes on macOS
- [x] CI step fails if UI imports detected

## Architecture Highlights
- **Separation of Concerns**: Core (pure Swift) vs Rendering (future)
- **Determinism**: Seeded RNG ensures reproducibility
- **Data-Driven**: All balance in JSON, zero hardcoded values
- **Testability**: Comprehensive unit tests with golden seeds
- **Portability**: Bundle.module works in tests, CI, and app

## Constitution Compliance
✅ Separate simulation from rendering  
✅ Deterministic via seeded RNG  
✅ Data-driven definitions  
✅ Specific implementation rules:
  - 60 ticks/sec
  - Slow: refresh, no stack, strongest wins
  - Targeting: highest path progress
  - Combat: instant damage (no projectile simulation)
  - Waves: explicit spawn timings

## Risks / Mitigations

### 1. Resource Integration in App Targets
**Risk**: When integrating MicroTDCore into the main iOS app, `Bundle.module` might not resolve correctly if not properly linked.

**Mitigation**: 
- CI proves `Bundle.module` works in package context
- Document integration steps for app target
- Test on actual iOS app in Mission 2

### 2. Determinism with Unordered Collections
**Risk**: If we later use `Set` or `Dictionary` iteration without sorting, determinism could break even with same seed.

**Mitigation**:
- Code review policy: any collection iteration must be sorted
- Document assumption in each system file
- Add lint/static analysis check (future)

### 3. Golden Seed Brittleness
**Risk**: Golden seed tests (12345, 98765) will break if we modify JSON definitions or algorithms, making them fragile for iterative development.

**Mitigation**:
- Document that golden seeds are tied to specific JSON snapshot
- When definitions change, update golden seed expected values
- Keep test fixtures separate from production definitions
- Consider snapshot testing library for better diff output

### 4. Platform-Specific Floating Point Differences
**Risk**: While `Double` math should be deterministic on same platform, cross-platform (iOS vs macOS vs CI) might have subtle differences in floating point operations.

**Mitigation**:
- All CI runs on macOS (same as dev environment)
- Avoid complex trig/transcendental functions in hot paths
- Document assumption: determinism guaranteed on Apple platforms only
- Use integer math where possible (tick counts, grid positions)

**Next Steps**: 
- Mission 2: SpriteKit rendering shell
- Scope: Visual-only, event bridge, touch → command translation
- NOT included: gameplay logic, relics UI, shop, ads

## Additional Documentation
- `walkthrough.md` - Full Mission 1 walkthrough
- `resource_bundling_fix.md` - Resource bundling details
- `mission1_final_validation.md` - Final validation steps
- `github_workflow.md` - Git workflow and PR guide
