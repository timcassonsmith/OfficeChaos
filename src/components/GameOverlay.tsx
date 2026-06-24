import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { GAME_PHASE, GamePhase } from '../game/constants';

interface Props {
  phase: GamePhase;
  status: string;
  score: number;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverlay({ phase, status, score, onRetry, onMenu }: Props) {
  const visible = phase === GAME_PHASE.WON || phase === GAME_PHASE.LOST;
  if (!visible) return null;

  const won = phase === GAME_PHASE.WON;
  const title = won ? 'Shift Saved!' : "You're Fired!";
  const body = won ? `${status}\n\nReady for another round?` : `${status}\n\nFinal score: ${score}`;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>{won ? 'Next Shift' : 'Try Again'}</Text>
          </Pressable>
          <Pressable style={styles.menuBtn} onPress={onMenu}>
            <Text style={styles.menuBtnText}>Main Menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 28,
    borderRadius: 12,
    backgroundColor: '#1e3a5f',
    borderWidth: 3,
    borderColor: '#4a7ab5',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffd166',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2d6a4f',
    borderWidth: 2,
    borderColor: '#52b788',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
  },
  menuBtnText: {
    color: '#ffd166',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
