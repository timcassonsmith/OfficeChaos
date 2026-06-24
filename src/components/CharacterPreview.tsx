import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Picture, Skia } from '@shopify/react-native-skia';
import { drawProfilePreview } from '../game/pixelCharacters';
import type { CharacterProfile } from '../game/profiles';

interface Props {
  profile: CharacterProfile;
  size?: number;
}

export function CharacterPreview({ profile, size = 80 }: Props) {
  const [picture, setPicture] = useState<ReturnType<typeof Skia.PictureRecorder.prototype.finishRecordingAsPicture> | null>(null);

  useEffect(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, size, size));

    // sky background
    const bgPaint = Skia.Paint();
    bgPaint.setColor(Skia.Color('#2a4a6b'));
    canvas.drawRect({ x: 0, y: 0, width: size, height: size }, bgPaint);

    // floor strip
    const floorPaint = Skia.Paint();
    floorPaint.setColor(Skia.Color('#4a7ab5'));
    canvas.drawRect({ x: 0, y: size * 0.72, width: size, height: size * 0.28 }, floorPaint);

    // draw the character centred
    drawProfilePreview(canvas, profile, size / 2, size * 0.72, 0);

    const pic = recorder.finishRecordingAsPicture();
    setPicture(pic);
    return () => { pic.dispose?.(); };
  }, [profile, size]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        {picture && <Picture picture={picture} />}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderColor: '#ffd166',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a4a6b',
  },
});
