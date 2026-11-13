import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import GradientButton from '../../components/GradientButton';
import OnboardingHeader from '../../components/OnboardingHeader';
import ScreenGlow from '../../components/ScreenGlow';
import TextField from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import type { OnboardingStackParamList } from '../../navigation/authTypes';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { Gender } from '../../types/user';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingIdentity'>;

/** Aplicația pune oameni necunoscuți în legătură, așa că cerem vârsta minimă de 18 ani. */
export const MIN_AGE = 18;
const MAX_AGE = 99;

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Femeie' },
  { value: 'male', label: 'Bărbat' },
  { value: 'other', label: 'Altul' },
];

type Errors = { name?: string; age?: string; city?: string; gender?: string };

/**
 * Onboarding, pasul 1 din 2: „Salut, eu sunt…” (docs/layout-guide.md).
 * Nume pe toată lățimea → Vârstă (1/3) + Oraș pe un rând → Gen (3 butoane) → „Continuă” jos.
 */
export default function OnboardingIdentityScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const ageRef = useRef<TextInputInstance>(null);
  const cityRef = useRef<TextInputInstance>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const next = () => {
    const ageNumber = Number(age);
    const nextErrors: Errors = {
      name: name.trim().length >= 2 ? undefined : 'Scrie-ți numele.',
      age:
        Number.isInteger(ageNumber) && ageNumber >= MIN_AGE && ageNumber <= MAX_AGE
          ? undefined
          : `Trebuie să ai cel puțin ${MIN_AGE} ani.`,
      city: city.trim().length >= 2 ? undefined : 'Scrie orașul.',
      gender: gender ? undefined : 'Alege o opțiune.',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean) || !gender) return;
    navigation.navigate('OnboardingTags', {
      identity: { name: name.trim(), age: ageNumber, city: city.trim(), gender },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGlow />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            onSubmitEditing={() => ageRef.current?.focus()}
          />

          <View style={styles.row}>
            <TextField
              ref={ageRef}
              label="Vârstă"
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, '').slice(0, 2))}
              error={errors.age}
              placeholder="21"
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => cityRef.current?.focus()}
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
  title: { fontSize: 36, fontWeight: '600', letterSpacing: -0.8, color: colors.text },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ageField: { flex: 1 },
  cityField: { flex: 2 },
  genderBlock: { gap: 8 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '500' },
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
