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
              left: b.x - 12,
              top: b.y - 10,
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
    minWidth: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#ffffffee',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#37474f',
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#212529',
  },
});
