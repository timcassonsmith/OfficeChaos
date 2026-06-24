import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface SwatchOption {
  color: string;
  label: string;
}

interface Props {
  label: string;
  options: SwatchOption[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatches({ label, options, value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => (
          <Pressable
            key={o.color}
            style={[styles.swatch, { backgroundColor: o.color }, value === o.color && styles.swatchActive]}
            onPress={() => onChange(o.color)}
            accessibilityLabel={o.label}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  label: {
    color: '#ffd166',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4a7ab5',
  },
  swatchActive: {
    borderColor: '#ffd166',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
});
