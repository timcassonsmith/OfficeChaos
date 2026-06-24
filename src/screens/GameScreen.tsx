import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Picture, Skia, useImage, type SkPicture } from '@shopify/react-native-skia';
// office-sprites.png is no longer used for in-game rendering (procedural characters only)
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';

import { GameEngine } from '../game/GameEngine';
import { GAME_PHASE, type GamePhase } from '../game/constants';
import type { Worker } from '../game/entities';
import { getLayoutMetrics } from '../game/layout';
import type { CharacterProfile, Difficulty } from '../game/profiles';
import { HudBar } from '../components/HudBar';
import { ActionPanel } from '../components/ActionPanel';
import { GameOverlay } from '../components/GameOverlay';
import { SpeechBubbles } from '../components/SpeechBubbles';

interface Props {
  profiles: CharacterProfile[];
  difficulty: Difficulty;
  onExit: () => void;
}

export default function GameScreen({ profiles, difficulty, onExit }: Props) {
  const { width, height } = useWindowDimensions();
  const rawInsets = useSafeAreaInsets();
  const bgImage = useImage(require('../../assets/office-bg.png'));
  const game = useMemo(() => new GameEngine(), []);
  const lastTime = useRef(0);
  const lastPictureTime = useRef(0);
  const pictureRef = useRef<SkPicture | null>(null);
  const [picture, setPicture] = useState<SkPicture | null>(null);

  const [phase, setPhase] = useState<GamePhase>(GAME_PHASE.NORMAL);
  const [progress, setProgress] = useState(100);
  const [wakeMeter, setWakeMeter] = useState(0);
  const [status, setStatus] = useState('');
  const [clock, setClock] = useState('AM 12:00');
  const [actor, setActor] = useState<Worker | null>(null);
  const [showActions, setShowActions] = useState(false);

  const actionsVisible = showActions && wakeMeter > 0;
  const layout = getLayoutMetrics(width, height, actionsVisible, rawInsets);
  const { insets } = layout;

  useEffect(() => {
    game.setCallbacks({
      onPhaseChange: setPhase,
      onProgressChange: setProgress,
      onWakeMeterChange: (p) => {
        setWakeMeter(p);
        setShowActions(p > 0);
      },
      onStatusChange: setStatus,
      onSleepyWorker: () => {
        setShowActions(true);
        const first = game.getActorWorkers()[0];
        if (first) {
          setActor(first);
          for (const w of game.workers) w.selected = false;
          first.selected = true;
        }
      },
    });
    game.configure(profiles, difficulty);
    game.startRound();
  }, [game, profiles, difficulty]);

  useEffect(() => {
    game.setBackgroundImage(bgImage ?? null);
  }, [game, bgImage]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    game.resize(layout.canvasW, layout.canvasH, layout.canvasH);
  }, [game, layout]);

  useEffect(() => {
    let frameId: number;
    let alive = true;

    const loop = (now: number) => {
      if (!alive) return;

      if (lastTime.current > 0 && layout.canvasW > 0 && layout.canvasH > 0) {
        const dt = Math.min((now - lastTime.current) / 1000, 0.05);
        game.update(dt);

        if (Math.floor(now / 500) !== Math.floor(lastPictureTime.current / 500)) {
          setClock(game.formatClock());
        }

        if (now - lastPictureTime.current >= 33) {
          try {
            const recorder = Skia.PictureRecorder();
            const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, layout.canvasW, layout.canvasH));
            game.drawSkia(canvas, now / 1000);
            const next = recorder.finishRecordingAsPicture();
            pictureRef.current?.dispose?.();
            pictureRef.current = next;
            setPicture(next);
            lastPictureTime.current = now;
          } catch {
            game.setBackgroundImage(null);
          }
        }
      }

      lastTime.current = now;
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      pictureRef.current?.dispose?.();
      pictureRef.current = null;
    };
  }, [game, layout]);

  const handleCanvasPress = useCallback(
    (x: number, y: number) => {
      if (phase === GAME_PHASE.WON || phase === GAME_PHASE.LOST) return;
      const result = game.handleTap(x, y);
      if (result?.type === 'worker') {
        setActor(result.worker);
        setShowActions(true);
        for (const w of game.workers) w.selected = w.id === result.worker.id;
      }
    },
    [game, phase],
  );

  const selectActor = useCallback(
    (w: Worker) => {
      setActor(w);
      for (const worker of game.workers) worker.selected = worker.id === w.id;
    },
    [game],
  );

  const handleRetry = useCallback(() => {
    if (game.phase === GAME_PHASE.LOST) {
      game.configure(profiles, difficulty);
      game.setBackgroundImage(bgImage ?? null);
    }
    setActor(null);
    setShowActions(false);
    game.startRound();
  }, [game, profiles, difficulty, bgImage]);

  const bubbles = game.getBubbleOverlays();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar hidden />
      <View style={[styles.mainRow, { height: layout.canvasH }]}>
        <ActionPanel
          visible={actionsVisible}
          game={game}
          actor={actor}
          onSelectActor={selectActor}
          width={layout.sidePanelW}
          canvasHeight={layout.canvasH}
        />

        <View style={[styles.canvasWrap, { flex: 1, height: layout.canvasH }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={(e) => handleCanvasPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
          >
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {picture && <Picture picture={picture} />}
            </Canvas>
          </Pressable>
          <SpeechBubbles bubbles={bubbles} />
        </View>
      </View>

      <HudBar
        progress={progress}
        wakeMeter={wakeMeter}
        clock={clock}
        status={status}
        height={layout.hudH}
        compact
      />

      <GameOverlay
        phase={phase}
        status={status}
        score={game.score}
        onRetry={handleRetry}
        onMenu={onExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  mainRow: {
    flexDirection: 'row',
  },
  canvasWrap: {
    backgroundColor: '#5bb5e8',
  },
});
