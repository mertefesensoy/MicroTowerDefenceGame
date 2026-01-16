import { StatusBar } from 'expo-status-bar';
import { GameCanvas } from './src/rendering/GameCanvas';

export default function App() {
  return (
    <>
      <GameCanvas />
      <StatusBar style="light" />
    </>
  );
}
