import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Difficulty } from '../game/profiles';
import { DIFFICULTY_SETTINGS } from '../game/difficulty';

interface Props {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onCustomize: () => void;
  onStart: () => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

export function MainMenuScreen({ difficulty, onDifficultyChange, onCustomize, onStart }: Props) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(420, width - 48);
  const settings = DIFFICULTY_SETTINGS[difficulty];

  return (
    <ImageBackground
      source={require('../../assets/office-bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.overlay} />
        <View style={[styles.card, { width: cardW }]}>
          <Text style={styles.title}>Office Chaos</Text>
          <Text style={styles.tagline}>Keep your team awake before the boss catches them!</Text>

          <Text style={styles.sectionLabel}>Difficulty</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => onDifficultyChange(d)}
              >
                <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                  {DIFFICULTY_SETTINGS[d].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.diffDesc}>{settings.description}</Text>

          <Pressable style={styles.secondaryBtn} onPress={onCustomize}>
            <Text style={styles.secondaryBtnText}>Customize Team</Text>
          </Pressable>

          <Pressable style={styles.primaryBtn} onPress={onStart}>
            <Text style={styles.primaryBtnText}>Start Shift</Text>
          </Pressable>

          <Text style={styles.hint}>Hold phone sideways · Tap left panel to wake coworkers</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 20, 40, 0.55)',
  },
  card: {
    backgroundColor: 'rgba(15, 30, 50, 0.94)',
    borderWidth: 3,
    borderColor: '#ffd166',
    borderRadius: 12,
    padding: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffd166',
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
  },
  diffBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#86efac',
  },
  diffText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  diffTextActive: {
    color: '#0d1b2a',
  },
  diffDesc: {
    color: '#a8dadc',
    fontSize: 12,
    marginBottom: 20,
    lineHeight: 17,
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#52b788',
    backgroundColor: '#2d6a4f',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  hint: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
  },
});
