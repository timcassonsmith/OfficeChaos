import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Bubble {
  x: number;
  y: number;
  text: string;
  key: string;
}

export function SpeechBubbles({ bubbles }: { bubbles: Bubble[] }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bubbles.map((b) => (
        <View
          key={b.key}
          style={[
            styles.bubble,
            {
              left: b.x - 18,
              top: b.y - 14,
            },
          ]}
        >
          <Text style={styles.text}>{b.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#37474f',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: '#212529',
  },
});
