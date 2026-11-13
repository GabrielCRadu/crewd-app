import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BirthDateField from '../../components/BirthDateField';
import GradientButton from '../../components/GradientButton';
import OnboardingHeader from '../../components/OnboardingHeader';
import ScreenGlow from '../../components/ScreenGlow';
import TextField from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import type { OnboardingStackParamList } from '../../navigation/authTypes';
import { colors } from '../../theme/colors';
import { type } from '../../theme/typography';
import { glass, radii } from '../../theme/shape';
import type { Gender } from '../../types/user';
import { MAX_AGE, MIN_AGE, ageFromBirthDate } from '../../utils/birthDate';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIdentity'>;

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Femeie' },
  { value: 'male', label: 'Bărbat' },
  { value: 'other', label: 'Altul' },
];

type Errors = { name?: string; birthDate?: string; city?: string; gender?: string };

/** Mesajul de sub data nașterii și gen: nu se pot schimba după crearea profilului. */
const LOCKED_HINT = 'Nu mai poate fi modificat după crearea profilului.';

/**
 * Onboarding, pasul 1 din 2: „Salut, eu sunt…” (docs/layout-guide.md).
 * Nume pe toată lățimea → Data nașterii + Oraș pe un rând → Gen (3 butoane) → „Continuă” jos.
 * Data nașterii și genul se blochează după crearea profilului (regulile Firestore), așa că o spunem pe ecran.
 */
export default function OnboardingIdentityScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const cityRef = useRef<TextInputInstance>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const next = () => {
    const age = birthDate ? ageFromBirthDate(birthDate) : null;
    const nextErrors: Errors = {
      name: name.trim().length >= 2 ? undefined : 'Scrie-ți numele.',
      birthDate: !birthDate
        ? 'Alege data nașterii.'
        : age !== null && age >= MIN_AGE && age <= MAX_AGE
          ? undefined
          : `Trebuie să ai cel puțin ${MIN_AGE} ani.`,
      city: city.trim().length >= 2 ? undefined : 'Scrie orașul.',
      gender: gender ? undefined : 'Alege o opțiune.',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !gender || !birthDate) return;
    navigation.navigate('OnboardingTags', {
      identity: { name: name.trim(), birthDate, city: city.trim(), gender },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGlow />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <OnboardingHeader step={1} />

          <View style={styles.heading}>
            <Text style={styles.title}>Salut, eu sunt…</Text>
            <Text style={styles.subtitle}>Spune-ne câteva lucruri despre tine ca să îți găsim crew-ul potrivit.</Text>
          </View>

          <TextField
            label="Nume"
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder="Cum te strigă prietenii"
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
          />

          <View style={styles.row}>
            <BirthDateField
              label="Data nașterii"
              value={birthDate}
              onChange={setBirthDate}
              error={errors.birthDate}
              hint={LOCKED_HINT}
              containerStyle={styles.ageField}
            />
            <TextField
              ref={cityRef}
              label="Oraș"
              value={city}
              onChangeText={setCity}
              error={errors.city}
              placeholder="Timișoara"
              autoCapitalize="words"
              returnKeyType="done"
              containerStyle={styles.cityField}
            />
          </View>

          <View style={styles.genderBlock}>
            <Text style={styles.label}>Gen</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const active = gender === g.value;
                return (
                  <Pressable
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[styles.genderOption, active && styles.genderActive]}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>{g.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.gender ? <Text style={styles.error}>{errors.gender}</Text> : null}
            <View style={styles.hintRow}>
              <Ionicons name="lock-closed-outline" size={12} color={colors.faint} />
              <Text style={styles.hint}>{LOCKED_HINT}</Text>
            </View>
          </View>

          <View style={styles.bottom}>
            <GradientButton label="Continuă" icon="arrow-forward" onPress={next} />
            <Pressable onPress={signOut} hitSlop={8} style={styles.signOut}>
              <Text style={styles.signOutText}>Nu e contul tău? Ieși</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24, gap: 22 },
  heading: { gap: 8 },
  title: { ...type.screenTitle, fontSize: 36 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ageField: { flex: 3 },
  cityField: { flex: 2 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 },
  hint: { flex: 1, color: colors.faint, fontSize: 12 },
  genderBlock: { gap: 8 },
  label: { ...type.label },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOption: { ...glass, flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  genderActive: { backgroundColor: colors.text, borderColor: colors.text },
  genderText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  genderTextActive: { color: colors.onLight, fontWeight: '600' },
  error: { color: colors.nope, fontSize: 12, marginLeft: 6 },
  bottom: { marginTop: 'auto', gap: 14 },
  signOut: { alignSelf: 'center' },
  signOutText: { color: colors.faint, fontSize: 13 },
});
