import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockPerson,
} from '../services/friendsService';
import type { FriendStatus } from '../services/friendsService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

interface Props {
  personId: string;
  name: string;
  status: FriendStatus;
}

/**
 * Butonul de prietenie, după relația cu persoana:
 * „Adaugă prieten” → „Cerere trimisă” (Anulează) → „Prieteni ✓” (apăsat: Elimină prietenul).
 * Dacă ea ți-a trimis cerere: „Acceptă” / „Refuză”. Dacă ai blocat-o: „Deblochează”.
 */
export default function FriendButton({ personId, name, status }: Props) {
  if (status === 'none') {
    // Pastilă albă simplă (fără gradient), ca să rămână un singur ton pe ecran.
    return (
      <Pressable
        onPress={() => sendFriendRequest(personId)}
        style={({ pressed }) => [styles.pill, styles.accept, pressed && styles.pressed]}
      >
        <Ionicons name="person-add" size={18} color={colors.onLight} />
        <Text style={[styles.pillText, styles.acceptText]}>Adaugă prieten</Text>
      </Pressable>
    );
  }

  if (status === 'outgoing') {
    return (
      <View style={styles.row}>
        <View style={[styles.pill, styles.flex]}>
          <Ionicons name="time-outline" size={18} color={colors.text} />
          <Text style={styles.pillText}>Cerere trimisă</Text>
        </View>
        <Pressable onPress={() => cancelFriendRequest(personId)} hitSlop={8}>
          <Text style={styles.link}>Anulează</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'incoming') {
    return (
      <View style={styles.incoming}>
        <Text style={styles.incomingText}>{name} ți-a trimis o cerere de prietenie.</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => acceptFriendRequest(personId)}
            style={({ pressed }) => [styles.pill, styles.accept, styles.flex, pressed && styles.pressed]}
          >
            <Ionicons name="checkmark" size={18} color={colors.onLight} />
            <Text style={[styles.pillText, styles.acceptText]}>Acceptă</Text>
          </Pressable>
          <Pressable
            onPress={() => declineFriendRequest(personId)}
            style={({ pressed }) => [styles.pill, styles.flex, pressed && styles.pressedGlass]}
          >
            <Text style={styles.pillText}>Refuză</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (status === 'friends') {
    const confirmRemove = () =>
      Alert.alert(`Elimini prietenul ${name}?`, 'Nu mai vedeți unul la altul evenimentele la care mergeți.', [
        { text: 'Renunță', style: 'cancel' },
        { text: 'Elimină prietenul', style: 'destructive', onPress: () => void removeFriend(personId) },
      ]);
    return (
      <Pressable onPress={confirmRemove} style={({ pressed }) => [styles.pill, pressed && styles.pressedGlass]}>
        <Ionicons name="people" size={18} color={colors.text} />
        <Text style={styles.pillText}>Prieteni ✓</Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>
    );
  }

  // Blocat
  return (
    <View style={styles.row}>
      <View style={[styles.pill, styles.flex]}>
        <Ionicons name="ban" size={18} color={colors.nope} />
        <Text style={styles.pillText}>Blocat</Text>
      </View>
      <Pressable onPress={() => unblockPerson(personId)} hitSlop={8}>
        <Text style={styles.link}>Deblochează</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pill: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
  },
  pillText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  accept: { backgroundColor: colors.text, borderColor: colors.text },
  acceptText: { color: colors.onLight },
  pressed: { opacity: 0.85 },
  pressedGlass: { backgroundColor: colors.cardStrong },
  link: { color: colors.muted, fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' },
  incoming: { gap: 10 },
  incomingText: { color: colors.text, fontSize: 14 },
});
