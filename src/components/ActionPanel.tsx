import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { GameEngine } from '../game/GameEngine';
import { Worker } from '../game/entities';
import { BOSS_ACTIONS, WAKE_ACTIONS } from '../game/constants';

interface Props {
  visible: boolean;
  game: GameEngine;
  actor: Worker | null;
  onSelectActor: (w: Worker) => void;
  width: number;
  canvasHeight: number;
}

export function ActionPanel({ visible, game, actor, onSelectActor, width, canvasHeight }: Props) {
  const [, bump] = useState(0);
  const sleepy = game.getSleepyWorker();
  const bossActive = game.boss.active;
  const actors = game.getActorWorkers();

  if (!visible || (!sleepy && !bossActive) || width <= 0) return null;

  const refresh = () => bump((n) => n + 1);
  const btnSize = canvasHeight < 260 ? 52 : canvasHeight < 340 ? 58 : 64;

  const renderAction = (
    action: (typeof WAKE_ACTIONS)[0] | (typeof BOSS_ACTIONS)[0],
    isBoss: boolean,
  ) => {
    if (!actor) return null;
    const cd = actor.cooldowns[action.id] ?? 0;
    const disabled = !actor.canUseAction(action.id);
    return (
      <Pressable
        key={action.id}
        style={[
          styles.actionBtn,
          { width: btnSize, minHeight: btnSize },
          isBoss && styles.bossBtn,
          disabled && styles.btnDisabled,
        ]}
        disabled={disabled}
        onPress={() => {
          const ok = isBoss
            ? game.executeBossAction(actor, action as (typeof BOSS_ACTIONS)[0])
            : game.executeWakeAction(actor, action as (typeof WAKE_ACTIONS)[0]);
          if (ok) refresh();
        }}
      >
        <Text style={styles.actionIcon}>{action.icon}</Text>
        <Text style={styles.actionLabel} numberOfLines={2}>
          {action.label}
        </Text>
        {cd > 0 && <Text style={styles.cd}>{cd.toFixed(1)}s</Text>}
      </Pressable>
    );
  };

  const actions = sleepy ? WAKE_ACTIONS : BOSS_ACTIONS;

  return (
    <View style={[styles.panel, { width, height: canvasHeight }]}>
      <Text style={styles.heading} numberOfLines={2}>
        {sleepy ? `Wake ${sleepy.name}!` : 'Stall boss!'}
      </Text>
      <Text style={styles.sub}>Pick helper → tap action</Text>

      <ScrollView style={styles.actorCol} showsVerticalScrollIndicator={false}>
        {actors.map((w) => (
          <Pressable
            key={w.id}
            style={[styles.actorChip, actor?.id === w.id && styles.actorChipActive]}
            onPress={() => onSelectActor(w)}
          >
            <Text style={styles.actorName}>{w.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.actionCol}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.actionColContent}
      >
        {!actor ? (
          <Text style={styles.hint}>Select a coworker first</Text>
        ) : (
          actions.map((a) => renderAction(a, !sleepy))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(12, 24, 42, 0.96)',
    borderRightWidth: 2,
    borderRightColor: '#ffd166',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 8,
  },
  heading: {
    color: '#ffd166',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  sub: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 6,
  },
  actorCol: {
    maxHeight: 110,
    marginBottom: 6,
  },
  actorChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    borderWidth: 2,
    borderColor: '#4a7ab5',
    alignItems: 'center',
  },
  actorChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#86efac',
  },
  actorName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionCol: {
    flex: 1,
  },
  actionColContent: {
    paddingBottom: 12,
  },
  actionBtn: {
    padding: 4,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossBtn: {
    borderColor: '#ffd166',
    backgroundColor: '#422006',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },
  cd: {
    color: '#fbbf24',
    fontSize: 8,
    marginTop: 1,
  },
  hint: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
