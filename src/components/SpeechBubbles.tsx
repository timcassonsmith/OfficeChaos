import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Bubble {
  x: number;
  y: number;
  text: string;
  key: string;
  kind?: string;
}

export function SpeechBubbles({ bubbles }: { bubbles: Bubble[] }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map((b) => {
        const isSleep = b.kind === 'sleep';
        const isChat = b.kind === 'chat';
        return (
          <View
            key={b.key}
            style={[
              styles.bubble,
              isSleep && styles.sleepBubble,
              isChat && styles.chatBubble,
              {
                left: b.x - (isSleep ? 14 : 12),
                top: b.y - 10,
              },
            ]}
          >
            <Text style={[styles.text, isSleep && styles.sleepText, isChat && styles.chatText]}>
              {b.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#ffffffee',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#37474f',
    alignItems: 'center',
  },
  sleepBubble: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
    minWidth: 28,
    paddingHorizontal: 6,
  },
  chatBubble: {
    backgroundColor: '#fef9c3',
    borderColor: '#ca8a04',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#212529',
  },
  sleepText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 1,
  },
  chatText: {
    fontSize: 10,
    color: '#713f12',
  },
});
