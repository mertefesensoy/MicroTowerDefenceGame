# MicroTD - Expo Edition

## 🎮 Tower Defense Game - Mac-Free iOS Development

A complete tower defense game rebuilt using **Expo + React Native + Skia**, enabling iOS builds and App Store submissions **without a Mac**.

---

## 🚀 Quick Start

### Play Locally
```bash
cd expo
npx expo start
```
Scan QR code with **Expo Go** on iPhone/iPad!

### Build for TestFlight
```bash
cd expo
eas login
eas build --platform ios --profile production
eas submit --platform ios --latest
```

See [`docs/eas_build_submit_guide.md`](../docs/eas_build_submit_guide.md) for detailed instructions.

---

## ✨ Features

- **3 Enemy Types**: Basic, Fast, Tank
- **2 Tower Types**: Archer, Cannon
- **3 Waves**: Progressive difficulty
- **Touch Controls**: Tap to place towers
- **Real-time Combat**: 60 FPS Skia rendering
- **Persistent Stats**: Run history with AsyncStorage
- **Victory/Defeat**: Complete conditions
- **Post-Run Summary**: Detailed statistics

---

## 📁 Project Structure

```
expo/
├── src/
│   ├── core/              # Pure TypeScript game logic (UI-agnostic)
│   │   ├── entities/      # Enemy, Tower, GridPosition
│   │   ├── definitions/   # Game data (enemies, towers, waves, maps)
│   │   ├── systems/       # WaveSystem, CombatSystem, EconomySystem
│   │   └── *.ts          # GameState, GameEvent, GameCommand, RNG, Clock
│   ├── rendering/         # Skia visual layer
│   │   ├── MapRenderer.tsx
│   │   ├── TowerRenderer.tsx
│   │   ├── EnemyRenderer.tsx
│   │   └── GameCanvas.tsx
│   ├── screens/           # UI screens
│   │   ├── MainMenu.tsx
│   │   └── PostRunSummary.tsx
│   └── persistence/       # AsyncStorage integration
│       └── RunResult.ts
├── App.tsx                # Entry point
├── app.json               # Expo configuration
└── eas.json              # EAS Build configuration
```

---

## 🎯 Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81
- **Language**: TypeScript
- **Rendering**: @shopify/react-native-skia
- **Storage**: @react-native-async-storage/async-storage
- **Build**: EAS (Expo Application Services)

---

## 🏗️ Architecture

### Core Principles
1. **UI-Agnostic Core**: Pure TypeScript, no React imports
2. **Event-Driven**: Core emits events, rendering consumes
3. **Deterministic**: Seeded RNG for reproducible gameplay
4. **Fixed Timestep**: 60 ticks/second simulation

### Game Loop
```
Main Menu → Game Canvas → Post-Run Summary → Main Menu
```

### Simulation Flow
```
1. Wave spawning (deterministic based on tick)
2. Tower firing (target highest path progress)
3. Enemy movement (interpolated along waypoints)
4. Combat resolution (instant damage)
5. Wave completion (check victory/defeat)
```

---

## 📊 Statistics

- **Total Files**: 25 TypeScript/TSX
- **Lines of Code**: ~3,300
- **Core Logic**: 16 files, ~2,000 LoC
- **Rendering**: 4 files, ~600 LoC
- **Screens**: 2 files, ~500 LoC
- **Persistence**: 1 file, ~130 LoC

---

## 🎮 Gameplay

### Controls
- **Select Tower**: Tap Archer or Cannon button
- **Place Tower**: Tap grid cell (costs coins)
- **Start Wave**: Tap button to begin wave
- **Auto-Combat**: Towers fire automatically

### Objective
- Survive 3 waves
- Don't let enemies reach the end
- Earn coins from kills
- Place strategic towers

### Win Condition
- Complete all 3 waves with lives remaining

### Lose Condition
- Lives reach 0 (enemies leak through)

---

## 📖 Documentation

- [`docs/expo_migration_playbook.md`](../docs/expo_migration_playbook.md) - Migration strategy overview
- [`docs/eas_release_playbook.md`](../docs/eas_release_playbook.md) - Quick release reference
- [`docs/eas_build_submit_guide.md`](../docs/eas_build_submit_guide.md) - Detailed deployment guide
- [`src/core/README.md`](./src/core/README.md) - Core architecture documentation

---

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Test on Device
```bash
npx expo start
```
Scan QR with Expo Go app.

### Check Determinism
```typescript
// Same seed = same result
const game1 = new GameState(12345, definitions);
const game2 = new GameState(12345, definitions);
// After N ticks, both games have identical state
```

---

## 🚀 Deployment

### Prerequisites
- Expo account (free): https://expo.dev/signup
- Apple Developer account ($99/year)
- App Store Connect app created

### Build Profiles
- **development**: For simulators and internal testing
- **preview**: For TestFlight distribution
- **production**: For App Store submission

### Commands
```bash
# Preview build (internal testing)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest
```

---

## 🔧 Development

### Install Dependencies
```bash
npm install
```

### Start Dev Server
```bash
npx expo start
```

### Clear Cache
```bash
npx expo start -c
```

### View Logs
Press `l` in the terminal while server is running.

---

## 🌟 Key Achievements

✅ **100% Feature Parity** with Swift version  
✅ **Mac-Free iOS Development** via EAS cloud builds  
✅ **Cross-Platform Ready** (iOS + Android + Web)  
✅ **Modern Stack** (TypeScript, React Native, Skia)  
✅ **Better Developer Experience** (hot reload, debugging)  
✅ **Persistent Statistics** with AsyncStorage  
✅ **60 FPS Performance** with Skia rendering  

---

## 🎯 Future Enhancements

### Short Term
- [ ] Sound effects
- [ ] Background music
- [ ] More tower types
- [ ] More enemy types
- [ ] Additional maps

### Medium Term
- [ ] Android build
- [ ] Web deployment
- [ ] Online leaderboards
- [ ] Achievement system

### Long Term
- [ ] Multiplayer mode
- [ ] Level editor
- [ ] In-app purchases
- [ ] Cloud save sync

---

## 📝 License

[Your License Here]

---

## 👨‍💻 Author

Mert Efe Sensoy

---

## 🙏 Acknowledgments

- Original Swift implementation
- Expo team for amazing tooling
- Shopify for react-native-skia
- React Native community

---

## 📞 Support

For issues or questions:
1. Check documentation in `/docs`
2. Review testing guide
3. Check Expo docs: https://docs.expo.dev/

---

**Built with ❤️ using Expo - No Mac Required!** 🚀
