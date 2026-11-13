import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import GlassIconButton from './GlassIconButton';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

interface Props {
  bio: string;
  onSave: (bio: string) => void;
}

const MAX_LENGTH = 200;

/** Cardul „Despre mine”: descrierea ta, editabilă direct din profil (creionul din dreapta sus). */
export default function AboutCard({ bio, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);

  const startEditing = () => {
    setDraft(bio);
    setEditing(true);
  };
  const save = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Despre mine</Text>
        {editing ? null : <GlassIconButton icon="pencil" size={34} round onPress={startEditing} />}
      </View>

      {editing ? (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ce îți place, cum îți petreci serile, ce cauți la evenimente…"
            placeholderTextColor={colors.faint}
            selectionColor={colors.primary}
            multiline
            maxLength={MAX_LENGTH}
            autoFocus
            style={styles.input}
          />
          <View style={styles.actions}>
            <Text style={styles.counter}>
              {draft.length}/{MAX_LENGTH}
            </Text>
            <Pressable onPress={() => setEditing(false)} hitSlop={8}>
              <Text style={styles.cancel}>Renunță</Text>
            </Pressable>
            <Pressable onPress={save} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
              <Text style={styles.saveText}>Salvează</Text>
            </Pressable>
          </View>
        </>
      ) : bio ? (
        <Text style={styles.bio}>{bio}</Text>
      ) : (
        <Pressable onPress={startEditing}>
          <Text style={styles.placeholder}>Scrie câteva cuvinte despre tine, ca oamenii să știe cu cine merg.</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...glass, gap: 10, padding: 18, borderRadius: radii.card },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  bio: { fontSize: 15, lineHeight: 22, color: colors.text },
  placeholder: { fontSize: 14, lineHeight: 20, color: colors.muted },
  input: {
    ...glass,
    minHeight: 96,
    padding: 12,
    borderRadius: radii.inner,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counter: { flex: 1, fontSize: 12, color: colors.faint },
  cancel: { fontSize: 14, color: colors.muted },
  saveButton: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: colors.text },
  saveText: { color: colors.onLight, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
