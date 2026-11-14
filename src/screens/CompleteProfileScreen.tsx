import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormMessage from '../components/FormMessage';
import GradientButton from '../components/GradientButton';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
import ScreenGlow from '../components/ScreenGlow';
import UsernameField from '../components/UsernameField';
import { useAuth } from '../context/AuthContext';
import { useUsernameAvailability } from '../hooks/useUsernameAvailability';
import { UsernameTakenError } from '../services/usernamesService';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { missingProfileParts } from '../utils/profileCompleteness';

/**
 * Conturile create înainte de username-uri și de poza obligatorie: aleg ce le lipsește
 * (username și/sau poză) înainte să ajungă la tab-uri. Nu se poate trece peste.
 */
export default function CompleteProfileScreen() {
  const { profile, completeProfile, signOut } = useAuth();
  const missing = missingProfileParts(profile ?? { username: null, photoUrl: null });
  const [username, setUsername] = useState('');
  const usernameStatus = useUsernameAvailability(username);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ready = (!missing.username || usernameStatus === 'available') && (!missing.photo || !!photoUrl);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await completeProfile({
        ...(missing.username ? { username } : {}),
        ...(missing.photo && photoUrl ? { photoUrl } : {}),
      });
      // Profilul e complet: RootNavigator trece singur la tab-uri.
    } catch (e) {
      setSaving(false);
      if (e instanceof UsernameTakenError) {
        setMessage('Între timp altcineva a ales acest username. Alege altul.');
        return;
      }
      console.warn('Nu am putut completa profilul:', e);
      setMessage('Nu am putut salva. Verifică conexiunea și încearcă din nou.');
    }
  };

  // Username-ul nu se mai poate schimba: îl confirmăm înainte de salvare.
  const finish = () => {
    if (!missing.username) {
      void save();
      return;
    }
    Alert.alert('Username-ul tău', `Așa te vor găsi ceilalți: @${username}. Nu se mai poate schimba.`, [
      { text: 'Schimb', style: 'cancel' },
      { text: 'Confirm', onPress: () => void save() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGlow />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <Text style={styles.title}>Completează-ți profilul</Text>
            <Text style={styles.subtitle}>
              {missing.username && missing.photo
                ? 'Avem nevoie de un username și de o poză cu tine.'
                : missing.username
                  ? 'Avem nevoie de un username: apare în codul tău QR.'
                  : 'Avem nevoie de o poză cu tine: ceilalți te recunosc după ea la întâlnire.'}
            </Text>
          </View>

          {missing.photo ? <ProfilePhotoPicker photoUrl={photoUrl} name={profile?.name ?? ''} onChange={setPhotoUrl} /> : null}
          {missing.username ? <UsernameField value={username} onChange={setUsername} status={usernameStatus} /> : null}

          {message ? <FormMessage text={message} /> : null}

          <View style={styles.bottom}>
            <GradientButton label="Gata" icon="checkmark" disabled={!ready} loading={saving} onPress={finish} />
            <Pressable onPress={() => void signOut()} hitSlop={8} style={styles.signOut}>
              <Text style={styles.signOutText}>Ieși din cont</Text>
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
  content: { flexGrow: 1, padding: 24, gap: 24 },
  heading: { gap: 8, marginTop: 12 },
  title: { ...type.screenTitle, fontSize: 34 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  bottom: { marginTop: 'auto', gap: 16 },
  signOut: { alignSelf: 'center', padding: 4 },
  signOutText: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
});
