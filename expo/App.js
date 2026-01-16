import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { GameState } from './src/core';

export default function App() {
  const [game] = useState(() => new GameState(Date.now()));
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState(0);

  // Simple game loop (for testing)
  useEffect(() => {
    const interval = setInterval(() => {
      game.tick();
      setTick(game.currentTick);
      setEvents(game.eventLog.getAll().length);
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [game]);

  const handleStartWave = () => {
    game.processCommand({ type: 'startWave', tick: game.currentTick });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MicroTD Core - Phase C1</Text>
      <Text style={styles.stat}>Tick: {tick}</Text>
      <Text style={styles.stat}>Coins: {game.currentCoins}</Text>
      <Text style={styles.stat}>Lives: {game.currentLives}</Text>
      <Text style={styles.stat}>State: {game.currentState.type}</Text>
      <Text style={styles.stat}>Events: {events}</Text>

      <TouchableOpacity style={styles.button} onPress={handleStartWave}>
        <Text style={styles.buttonText}>Start Wave</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        ✅ Core is running!{'\n'}
        ✅ Skia renderer installed{'\n'}
        🎯 Ready for Phase C2
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16f2b3',
    marginBottom: 20,
  },
  stat: {
    fontSize: 16,
    color: '#fff',
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#16f2b3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  info: {
    marginTop: 30,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
