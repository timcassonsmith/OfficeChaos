import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CharacterPreview } from '../components/CharacterPreview';
import { ColorSwatches } from '../components/ColorSwatches';
import {
  CharacterProfile,
  HAIR_COLORS,
  SKIN_COLORS,
  OUTFIT_COLORS,
  PANTS_COLORS,
  cloneProfiles,
} from '../game/profiles';
import { CHARACTER_SPRITES } from '../game/spriteAtlas';

interface Props {
  profiles: CharacterProfile[];
  onSave: (profiles: CharacterProfile[]) => void;
}

export function CharacterSetupScreen({ profiles, onSave }: Props) {
  const [team, setTeam] = useState(() => cloneProfiles(profiles));
  const [selected, setSelected] = useState(0);
  const { width } = useWindowDimensions();
  const p = team[selected];

  const update = (patch: Partial<CharacterProfile>) => {
    setTeam((prev) => prev.map((c, i) => (i === selected ? { ...c, ...patch } : c)));
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => onSave(team)}>
          <Text style={styles.backText}>← Save & Back</Text>
        </Pressable>
        <Text style={styles.title}>Customize Team</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {team.map((c, i) => (
          <Pressable
            key={i}
            style={[styles.tab, selected === i && styles.tabActive]}
            onPress={() => setSelected(i)}
          >
            <CharacterPreview profile={c} size={56} />
            <Text style={styles.tabName} numberOfLines={1}>
              {c.name || `Worker ${i + 1}`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.editor} contentContainerStyle={[styles.editorContent, { maxWidth: width }]}>
        <View style={styles.previewRow}>
          <CharacterPreview profile={p} size={120} />
          <View style={styles.nameBlock}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.nameInput}
              value={p.name}
              onChangeText={(name) => update({ name })}
              maxLength={14}
              placeholder="Name"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Sex</Text>
        <View style={styles.sexRow}>
          {(['male', 'female'] as const).map((sex) => (
            <Pressable
              key={sex}
              style={[styles.sexBtn, p.sex === sex && styles.sexBtnActive]}
              onPress={() => update({ sex })}
            >
              <Text style={[styles.sexText, p.sex === sex && styles.sexTextActive]}>
                {sex === 'male' ? '♂ Male' : '♀ Female'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ColorSwatches label="Hair" options={HAIR_COLORS} value={p.hairColor} onChange={(hairColor) => update({ hairColor })} />
        <ColorSwatches label="Skin" options={SKIN_COLORS} value={p.skinColor} onChange={(skinColor) => update({ skinColor })} />
        <ColorSwatches label="Outfit" options={OUTFIT_COLORS} value={p.outfitColor} onChange={(outfitColor) => update({ outfitColor })} />
        <ColorSwatches label="Pants / Skirt" options={PANTS_COLORS} value={p.pantsColor} onChange={(pantsColor) => update({ pantsColor })} />

        <Text style={styles.fieldLabel}>Character Style</Text>
        <View style={styles.spriteRow}>
          {CHARACTER_SPRITES.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.spriteChip, p.spriteId === s.id && styles.spriteChipActive]}
              onPress={() => update({ spriteId: s.id })}
            >
              <Text style={styles.spriteChipText}>{s.label.split(' · ')[0]}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#4a7ab5',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  backText: {
    color: '#ffd166',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  tabs: {
    maxHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  tabsContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
    width: 72,
  },
  tabActive: {
    borderColor: '#ffd166',
    backgroundColor: '#2d4a6f',
  },
  tabName: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    maxWidth: 64,
    textAlign: 'center',
  },
  editor: {
    flex: 1,
  },
  editorContent: {
    padding: 16,
    paddingBottom: 32,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  nameBlock: {
    flex: 1,
  },
  fieldLabel: {
    color: '#ffd166',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  nameInput: {
    backgroundColor: '#1e3a5f',
    borderWidth: 2,
    borderColor: '#4a7ab5',
    borderRadius: 8,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sexBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
  },
  sexBtnActive: {
    backgroundColor: '#3498db',
    borderColor: '#85c1e9',
  },
  sexText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  sexTextActive: {
    color: '#0d1b2a',
  },
  spriteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  spriteChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4a7ab5',
    backgroundColor: '#1e3a5f',
  },
  spriteChipActive: {
    borderColor: '#ffd166',
    backgroundColor: '#2d4a6f',
  },
  spriteChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
