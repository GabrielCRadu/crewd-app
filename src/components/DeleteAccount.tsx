import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FormMessage from './FormMessage';
import TextField from './TextField';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { type } from '../theme/typography';
import { tr } from '../i18n';

/**
 * „Șterge contul” din Profil: un link discret care deschide o confirmare cu parola.
 * Ștergerea e definitivă: ieși din grupulețe, se șterg profilul și contul (AuthContext.deleteAccount).
 */
export default function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setPassword('');
    setError(null);
  };

  const confirm = async () => {
    if (!password) {
      setError(tr('Introdu parola ca să confirmi.'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await deleteAccount(password);
      // Sesiunea se închide singură și apare ecranul de login.
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} accessibilityRole="button">
        <Text style={styles.link}>{tr('Șterge contul')}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.sheet}>
            <View style={styles.titleRow}>
              <Ionicons name="warning-outline" size={20} color={colors.nope} />
              <Text style={styles.title}>{tr('Ștergi contul definitiv?')}</Text>
            </View>
            <Text style={styles.text}>{tr('Se șterg profilul tău, înscrierile la evenimente și locul tău în grupuri. Nu se poate anula.')}</Text>
            <TextField
              label={tr('Confirmă cu parola')}
              value={password}
              onChangeText={setPassword}
              password
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={confirm}
            />
            {error ? <FormMessage text={error} /> : null}
            <View style={styles.actions}>
              <Pressable onPress={close} disabled={busy} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>{tr('Anulează')}</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                disabled={busy}
                style={({ pressed }) => [styles.delete, (pressed || busy) && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.deleteText}>{busy ? tr('Se șterge…') : tr('Șterge definitiv')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.nope, fontSize: 13, textDecorationLine: 'underline' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    gap: 14,
    padding: 22,
    paddingBottom: 34,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...type.screenTitle, fontSize: 20 },
  text: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancel: { ...glass, flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  cancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  delete: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.nope },
  deleteText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
