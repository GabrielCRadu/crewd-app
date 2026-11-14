import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Avatar from './Avatar';
import { PhotoPermissionError, pickProfilePhoto } from '../services/photoService';
import type { PhotoSource } from '../services/photoService';
import { colors, onThemeChange } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { tr } from '../i18n';

interface Props {
  photoUrl: string | null;
  /** Numele, pentru inițiala afișată cât timp nu e poză. */
  name: string;
  onChange: (photoUrl: string) => void;
}

/** Poza de profil obligatorie: cameră sau galerie, decupată pătrat; se poate înlocui, nu șterge. */
export default function ProfilePhotoPicker({ photoUrl, name, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  const choose = async (source: PhotoSource) => {
    setBusy(true);
    try {
      const picked = await pickProfilePhoto(source);
      if (picked) onChange(picked);
    } catch (e) {
      const message = e instanceof PhotoPermissionError ? e.message : tr('Nu am putut încărca fotografia.');
      Alert.alert(tr('Fotografia de profil'), tr('{message} Poți da acces din setările telefonului.', { message }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.block}>
      <Avatar name={name || '?'} size={140} square photoUrl={photoUrl} />
      <View style={styles.actions}>
        <PhotoButton icon="camera-outline" label={tr('Cameră')} disabled={busy} onPress={() => choose('camera')} />
        <PhotoButton icon="images-outline" label={tr('Galerie')} disabled={busy} onPress={() => choose('library')} />
      </View>
    </View>
  );
}

function PhotoButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'camera-outline' | 'images-outline';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.dimmed]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={16} color={colors.text} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    block: { alignItems: 'center', gap: 16 },
    actions: { flexDirection: 'row', gap: 10 },
    button: {
      ...glass,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: radii.pill,
    },
    buttonText: { color: colors.text, fontSize: 14, fontWeight: '500' },
    dimmed: { opacity: 0.6 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
