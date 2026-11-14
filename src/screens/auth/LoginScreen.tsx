import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../../components/Aurora';
import FormMessage from '../../components/FormMessage';
import GradientButton from '../../components/GradientButton';
import LanguageSwitch from '../../components/LanguageSwitch';
import TextField from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/authTypes';
import { isValidEmail, resetPassword, signIn } from '../../services/authService';
import { colors, onThemeChange } from '../../theme/colors';
import { type } from '../../theme/typography';
import { radii } from '../../theme/shape';
import { tr } from '../../i18n';

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
      email: isValidEmail(email) ? undefined : tr('Introdu o adresă de email validă.'),
      password: password ? undefined : tr('Introdu parola.'),
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
      setErrors({ email: tr('Scrie mai întâi emailul contului, apoi apasă din nou.') });
      return;
    }
    setErrors({});
    try {
      await resetPassword(email);
      setMessage({ text: tr('Ți-am trimis un email la {p} cu un link pentru o parolă nouă.', { p: email.trim() }), tone: 'success' });
    } catch (e) {
      setMessage({ text: (e as Error).message, tone: 'error' });
    }
  };

  return (
    <View style={styles.screen}>
      <Aurora style={styles.hero} withScrim />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Limba aplicației: se poate alege de aici și, mai târziu, din Setări */}
            <View style={styles.language}>
              <LanguageSwitch />
            </View>

            <View style={styles.brand}>
              <Text style={styles.logo}>crewd</Text>
              <Text style={styles.tagline}>{tr('Găsește-ți crew-ul pentru diseară.')}</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.title}>{tr('Intră în cont')}</Text>

              <TextField
                label={tr('Email')}
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
                label={tr('Parolă')}
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
                <Text style={styles.link}>{tr('Am uitat parola')}</Text>
              </Pressable>

              {message ? <FormMessage text={message.text} tone={message.tone} /> : null}

              <GradientButton label={loading ? tr('Se conectează…') : tr('Intră')} icon="arrow-forward" loading={loading} onPress={submit} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tr('Nu ai cont?')}</Text>
              <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
                <Text style={styles.footerLink}>{tr('Creează unul')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    hero: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', borderBottomLeftRadius: radii.card, borderBottomRightRadius: radii.card },
    safe: { flex: 1 },
    flex: { flex: 1 },
    content: { flexGrow: 1, padding: 24, gap: 28, justifyContent: 'space-between' },
    language: { alignSelf: 'flex-end', width: 220 },
    brand: { marginTop: 8, gap: 6 },
    logo: { ...type.screenTitle, fontSize: 44 },
    tagline: { fontSize: 17, color: colors.text, opacity: 0.85 },
    form: { gap: 16 },
    title: { ...type.screenTitle, fontSize: 28 },
    forgot: { alignSelf: 'flex-end', marginTop: -6 },
    link: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 8 },
    footerText: { color: colors.muted, fontSize: 15 },
    footerLink: { color: colors.text, fontSize: 15, fontWeight: '600' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
