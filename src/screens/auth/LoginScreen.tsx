import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../../components/Aurora';
import FormMessage from '../../components/FormMessage';
import GradientButton from '../../components/GradientButton';
import TextField from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/authTypes';
import { isValidEmail, resetPassword, signIn } from '../../services/authService';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/** Ecranul de login: email + parolă, „Am uitat parola”, link spre crearea contului. */
export default function LoginScreen({ navigation }: Props) {
  const passwordRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const nextErrors = {
      email: isValidEmail(email) ? undefined : 'Introdu o adresă de email validă.',
      password: password ? undefined : 'Introdu parola.',
    };
    setErrors(nextErrors);
    setMessage(null);
    if (nextErrors.email || nextErrors.password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigarea mai departe o face RootNavigator, când se schimbă sesiunea.
    } catch (e) {
      setMessage({ text: (e as Error).message, tone: 'error' });
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Scrie mai întâi emailul contului, apoi apasă din nou.' });
      return;
    }
    setErrors({});
    try {
      await resetPassword(email);
      setMessage({ text: `Ți-am trimis un email la ${email.trim()} cu un link pentru o parolă nouă.`, tone: 'success' });
    } catch (e) {
      setMessage({ text: (e as Error).message, tone: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <Aurora style={styles.hero} withScrim />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.brand}>
              <Text style={styles.logo}>crewd</Text>
              <Text style={styles.tagline}>Găsește-ți crew-ul pentru diseară.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.title}>Intră în cont</Text>

              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                placeholder="nume@exemplu.ro"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <TextField
                ref={passwordRef}
                label="Parolă"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                password
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <Pressable onPress={forgotPassword} hitSlop={8} style={styles.forgot}>
                <Text style={styles.link}>Am uitat parola</Text>
              </Pressable>

              {message ? <FormMessage text={message.text} tone={message.tone} /> : null}

              <GradientButton label={loading ? 'Se conectează…' : 'Intră'} icon="arrow-forward" loading={loading} onPress={submit} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Nu ai cont?</Text>
              <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
                <Text style={styles.footerLink}>Creează unul</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', borderBottomLeftRadius: radii.card, borderBottomRightRadius: radii.card },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24, gap: 28, justifyContent: 'space-between' },
  brand: { marginTop: 48, gap: 6 },
  logo: { fontSize: 44, fontWeight: '600', letterSpacing: -1.5, color: colors.text },
  tagline: { fontSize: 17, color: colors.text, opacity: 0.85 },
  form: { gap: 16 },
  title: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  forgot: { alignSelf: 'flex-end', marginTop: -6 },
  link: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 8 },
  footerText: { color: colors.muted, fontSize: 15 },
  footerLink: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
