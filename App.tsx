import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GameScreen from './src/screens/GameScreen';
import { MainMenuScreen } from './src/screens/MainMenuScreen';
import { CharacterSetupScreen } from './src/screens/CharacterSetupScreen';
import { DEFAULT_PROFILES, cloneProfiles, type CharacterProfile, type Difficulty } from './src/game/profiles';

type Screen = 'menu' | 'characters' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [profiles, setProfiles] = useState<CharacterProfile[]>(() => cloneProfiles(DEFAULT_PROFILES));
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {screen === 'menu' && (
          <MainMenuScreen
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onCustomize={() => setScreen('characters')}
            onStart={() => setScreen('game')}
          />
        )}
        {screen === 'characters' && (
          <CharacterSetupScreen
            profiles={profiles}
            onSave={(p) => {
              setProfiles(p);
              setScreen('menu');
            }}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            profiles={profiles}
            difficulty={difficulty}
            onExit={() => setScreen('menu')}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
