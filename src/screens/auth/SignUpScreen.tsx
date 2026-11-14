import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import FormMessage from '../../components/FormMessage';
import PasswordChecklist from '../../components/PasswordChecklist';
import GlassIconButton from '../../components/GlassIconButton';
import GradientButton from '../../components/GradientButton';
import ScreenGlow from '../../components/ScreenGlow';
import TextField from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/authTypes';
import { isValidEmail, signUp } from '../../services/authService';
import { colors } from '../../theme/colors';
import { type } from '../../theme/typography';
import { isStrongPassword } from '../../utils/passwordRules';
import { tr } from '../../i18n';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

type Errors = { email?: string; password?: string; confirm?: string };

/** Crearea contului: email, parolă, confirmare. După creare urmează onboarding-ul (automat). */
export default function SignUpScreen({ navigation }: Props) {
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const nextErrors: Errors = {
      email: isValidEmail(email) ? undefined : tr('Introdu o adresă de email validă.'),
      password: isStrongPassword(password) ? undefined : tr('Parola nu îndeplinește cerințele de mai jos.'),
      confirm: confirm === password ? undefined : tr('Parolele nu coincid.'),
    };
    setErrors(nextErrors);
    setMessage(null);
    if (nextErrors.email || nextErrors.password || nextErrors.confirm) return;

    setLoading(true);
    try {
      await signUp(email, password);
      // Contul e creat și ești logat: RootNavigator trece singur la onboarding.
    } catch (e) {
      setMessage((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGlow />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />

          <View style={styles.heading}>
            <Text style={styles.title}>{tr('Creează cont')}</Text>
            <Text style={styles.subtitle}>{tr('Un minut și ești în crew. Apoi îți alegi ce-ți place.')}</Text>
          </View>

          <View style={styles.form}>
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
              placeholder={tr('Minim 8 caractere, literă mică și mare')}
              password
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <PasswordChecklist password={password} />
            <TextField
              ref={confirmRef}
              label={tr('Confirmă parola')}
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              password
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {message ? <FormMessage text={message} /> : null}
          </View>

          <View style={styles.bottom}>
            <GradientButton
              label={loading ? tr('Se creează contul…') : tr('Creează contul')}
              icon="arrow-forward"
              loading={loading}
              onPress={submit}
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>{tr('Ai deja cont?')}</Text>
              <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                <Text style={styles.footerLink}>{tr('Intră')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 24, gap: 24 },
  heading: { gap: 8 },
  title: { ...type.screenTitle, fontSize: 34 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  form: { gap: 16 },
  bottom: { marginTop: 'auto', gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { color: colors.muted, fontSize: 15 },
  footerLink: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
