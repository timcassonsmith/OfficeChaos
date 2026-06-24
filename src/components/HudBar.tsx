import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  progress: number;
  wakeMeter: number;
  clock: string;
  status: string;
  height?: number;
  compact?: boolean;
}

export function HudBar({ progress, wakeMeter, clock, status, height, compact }: Props) {
  const progressClass = progress < 35 ? styles.barDanger : progress < 60 ? styles.barWarning : styles.barGood;
  const wakeClass = wakeMeter >= 75 ? styles.wakeDanger : styles.wakeFill;
  const barH = compact ? 14 : 18;

  return (
    <View style={[styles.wrap, height ? { minHeight: height } : null]}>
      <View style={styles.barRow}>
        <View style={styles.barBlock}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Work</Text>
            <Text style={styles.value}>{Math.round(progress)}%</Text>
          </View>
          <View style={[styles.track, { height: barH }]}>
            <View style={[styles.fill, progressClass, { width: `${progress}%` }]} />
          </View>
        </View>

        {wakeMeter > 0 && (
          <View style={styles.barBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Sleep</Text>
              <Text style={[styles.value, styles.wakeValue]}>{Math.round(wakeMeter)}%</Text>
            </View>
            <View style={[styles.track, { height: barH }]}>
              <View style={[styles.fill, wakeClass, { width: `${wakeMeter}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.clockBlock}>
          <Text style={styles.clock}>{clock}</Text>
        </View>
      </View>

      <Text style={styles.status} numberOfLines={1}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0d1b2a',
    borderTopWidth: 2,
    borderTopColor: '#4a7ab5',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 2,
    backgroundColor: 'rgba(30, 58, 95, 0.95)',
  },
  barBlock: {
    flex: 1,
    minWidth: 80,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: '#a8dadc',
    fontSize: 11,
    fontWeight: '800',
  },
  wakeValue: {
    color: '#ffba08',
  },
  track: {
    backgroundColor: '#0a1628',
    borderWidth: 1,
    borderColor: '#4a7ab5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  barGood: {
    backgroundColor: '#2d6a4f',
  },
  barWarning: {
    backgroundColor: '#e09f3e',
  },
  barDanger: {
    backgroundColor: '#c1121f',
  },
  wakeFill: {
    backgroundColor: '#e85d04',
  },
  wakeDanger: {
    backgroundColor: '#9d0208',
  },
  clockBlock: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: '#4a7ab5',
    borderRadius: 4,
    minWidth: 72,
    alignItems: 'center',
  },
  clock: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '800',
  },
  status: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#0d1b2a',
  },
});
