# Strategy C: Expo Migration Playbook (Solo)

## Goal
Rebuild MicroTowerDefenceGame in Expo so iOS builds + submissions can be done via EAS cloud without a Mac.

## Repo layout
- `/expo` = Expo app
- Keep native Swift code as reference (do not delete until Expo ships)

## Phases
- **C0**: Scaffold Expo app, boot on iPhone+iPad sim
- **C1**: Choose renderer (Skia recommended)
- **C2**: Port Core logic to TypeScript (deterministic, unit-tested)
- **C3**: Minimal playable loop
- **C4**: Persistence + Post-run summary
- **C5**: EAS build + submit

## Gates
- **Gate C0**: Expo app runs locally
- **Gate C2**: Core unit tests pass
- **Gate C4**: Persistence survives relaunch & failure simulation
- **Gate C5**: Build visible in TestFlight
