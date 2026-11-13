import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import FormMessage from '../components/FormMessage';
import GlassIconButton from '../components/GlassIconButton';
import GradientButton from '../components/GradientButton';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { TAG_GROUP_STYLE } from '../data/tagGroupStyle';
import { TAG_GROUPS } from '../data/tags';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import { PhotoPermissionError, pickProfilePhoto } from '../services/photoService';
import type { PhotoSource } from '../services/photoService';
import { colors, tagTints } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { TagGroup } from '../types/social';
import type { Gender, UserProfile } from '../types/user';
import { formatBirthDate } from '../utils/birthDate';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const MAX_BIO = 200;
/** La fel ca la onboarding: câteva tag-uri, ca recomandările să aibă de unde porni. */
const MIN_TAGS = 3;

type Selection = Record<TagGroup['id'], string[]>;
type Errors = { name?: string; city?: string };

const GENDER_LABELS: Record<Gender, string> = { female: 'Femeie', male: 'Bărbat', other: 'Altul' };

/**
 * „Editează profilul”: fotografia, numele, orașul, descrierea și preferințele.
 * Data nașterii și genul se aleg doar la onboarding și nu se mai pot schimba (regulile Firestore): aici apar doar pentru citire.
 * Nimic nu se salvează până la „Salvează”; „înapoi” cu modificări nesalvate cere confirmare.
 */
export default function EditProfileScreen({ navigation }: Props) {
  const { profile, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const cityRef = useRef<TextInputInstance>(null);

  // Ciorna pornește de la profilul curent (ecranul se deschide doar cu profil încărcat).
  const initial = profile as UserProfile;
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [tags, setTags] = useState<Selection>(initial.chosenTags);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const totalTags = tags.events.length + tags.music.length + tags.hobbies.length;
  const dirty =
    photoUrl !== initial.photoUrl ||
    name !== initial.name ||
    city !== initial.city ||
    bio !== initial.bio ||
    JSON.stringify(tags) !== JSON.stringify(initial.chosenTags);

  const choosePhoto = async (source: PhotoSource) => {
    setPhotoBusy(true);
    try {
      const picked = await pickProfilePhoto(source);
      if (picked) setPhotoUrl(picked);
    } catch (e) {
      const message = e instanceof PhotoPermissionError ? e.message : 'Nu am putut încărca fotografia.';
      Alert.alert('Fotografia de profil', `${message} Poți da acces din setările telefonului.`);
    } finally {
      setPhotoBusy(false);
    }
  };

  const toggleTag = (group: TagGroup['id'], tag: string) => {
    setTags((prev) => ({
      ...prev,
      [group]: prev[group].includes(tag) ? prev[group].filter((t) => t !== tag) : [...prev[group], tag],
    }));
  };

  const goBack = () => {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    Alert.alert('Renunți la modificări?', 'Ce ai schimbat nu se salvează.', [
      { text: 'Rămân aici', style: 'cancel' },
      { text: 'Renunță', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const save = async () => {
    const nextErrors: Errors = {
      name: name.trim().length >= 2 ? undefined : 'Scrie-ți numele.',
      city: city.trim().length >= 2 ? undefined : 'Scrie orașul.',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setFormError(null);
      return;
    }
    if (totalTags < MIN_TAGS) {
      setFormError(`Alege cel puțin ${MIN_TAGS} preferințe, ca să-ți putem recomanda evenimente și oameni.`);
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      await updateProfile({
        photoUrl,
        name: name.trim(),
        city: city.trim(),
        bio: bio.trim(),
        chosenTags: tags,
      });
      navigation.goBack();
    } catch (e) {
      console.warn('Nu am putut salva profilul:', e);
      setFormError('Nu am putut salva profilul. Verifică conexiunea și încearcă din nou.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={goBack} />
        <Text style={styles.title}>Editează profilul</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Fotografia */}
          <View style={styles.photoBlock}>
            <Avatar name={name || initial.name} size={112} square photoUrl={photoUrl} />
            <View style={styles.photoActions}>
              <PhotoButton icon="camera-outline" label="Cameră" disabled={photoBusy} onPress={() => choosePhoto('camera')} />
              <PhotoButton icon="images-outline" label="Galerie" disabled={photoBusy} onPress={() => choosePhoto('library')} />
            </View>
            {photoUrl ? (
              <Pressable onPress={() => setPhotoUrl(null)} hitSlop={8}>
                <Text style={styles.removePhoto}>Șterge fotografia</Text>
              </Pressable>
            ) : (
              <Text style={styles.hint}>Fără poză, apare inițiala numelui.</Text>
            )}
          </View>

          {/* Nume, vârstă, oraș */}
          <TextField
            label="Nume"
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder="Cum te strigă prietenii"
            autoCapitalize="words"
            maxLength={50}
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
          />
          <View style={styles.row}>
            <TextField
              ref={cityRef}
              label="Locație"
              value={city}
              onChangeText={setCity}
              error={errors.city}
              placeholder="Orașul tău"
              autoCapitalize="words"
              containerStyle={styles.cityField}
            />
          </View>

          {/* Data nașterii și genul: doar pentru citire */}
          <View style={styles.lockedCard}>
            <View style={styles.lockedRow}>
              <Text style={styles.label}>Data nașterii</Text>
              <Text style={styles.lockedValue}>
                {initial.birthDate ? formatBirthDate(initial.birthDate) : `${initial.age} ani`}
              </Text>
            </View>
            <View style={styles.lockedRow}>
              <Text style={styles.label}>Gen</Text>
              <Text style={styles.lockedValue}>{GENDER_LABELS[initial.gender]}</Text>
            </View>
            <View style={styles.lockedHintRow}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.faint} />
              <Text style={styles.lockedHint}>Data nașterii și genul nu mai pot fi modificate după crearea profilului.</Text>
            </View>
          </View>

          {/* Descrierea */}
          <View style={styles.block}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Despre mine</Text>
              <Text style={styles.counter}>
                {bio.length}/{MAX_BIO}
              </Text>
            </View>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Ce îți place, cum îți petreci serile, ce cauți la evenimente…"
              placeholderTextColor={colors.faint}
              selectionColor={colors.primary}
              multiline
              maxLength={MAX_BIO}
              style={styles.bioInput}
            />
          </View>

          {/* Preferințele: aceleași culori ca în cardul „Ce îți place” */}
          <View style={styles.block}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionTitle}>Preferințe</Text>
              <Text style={styles.counter}>{totalTags} alese</Text>
            </View>
            {TAG_GROUPS.map((group) => {
              const style = TAG_GROUP_STYLE[group.id];
              return (
                <View key={group.id} style={styles.tagGroup}>
                  <View style={styles.tagGroupHeader}>
                    <Ionicons name={style.icon} size={16} color={colors.text} />
                    <Text style={styles.tagGroupLabel}>{group.label}</Text>
                  </View>
                  <View style={styles.tags}>
                    {group.tags.map((tag) => {
                      const selected = tags[group.id].includes(tag);
                      return (
                        <Chip
                          key={tag}
                          label={tag}
                          tint={selected ? tagTints[style.tint] : undefined}
                          onPress={() => toggleTag(group.id, tag)}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          {formError ? <FormMessage text={formError} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <GradientButton
          label={saving ? 'Se salvează…' : 'Salvează'}
          icon="checkmark"
          loading={saving}
          disabled={!dirty}
          onPress={save}
        />
      </View>
    </SafeAreaView>
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
      style={({ pressed }) => [styles.photoButton, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={16} color={colors.text} />
      <Text style={styles.photoButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { flex: 1, fontSize: 26, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 20 },
  photoBlock: { alignItems: 'center', gap: 12 },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoButton: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  photoButtonText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  pressed: { backgroundColor: colors.cardStrong },
  disabled: { opacity: 0.5 },
  removePhoto: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  hint: { color: colors.faint, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cityField: { flex: 1 },
  lockedCard: { ...glass, gap: 10, padding: 16, borderRadius: radii.inner },
  lockedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockedValue: { color: colors.text, fontSize: 15, fontWeight: '500' },
  lockedHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedHint: { flex: 1, color: colors.faint, fontSize: 12 },
  block: { gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  counter: { color: colors.faint, fontSize: 12 },
  bioInput: {
    ...glass,
    minHeight: 110,
    padding: 16,
    borderRadius: radii.inner,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    textAlignVertical: 'top',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  tagGroup: { gap: 10, marginTop: 4 },
  tagGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagGroupLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
