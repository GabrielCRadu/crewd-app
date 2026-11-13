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
  /**
   * Butonul stă pe un fundal portocaliu plin (cardul de sus din profilul unei persoane):
   * acțiunea principală devine neagră, iar pastilele secundare, sticlă închisă.
   */
  onEmber?: boolean;
}

/**
 * Butonul de prietenie, după relația cu persoana:
 * „Adaugă prieten” → „Cerere trimisă” (Anulează) → „Prieteni ✓” (apăsat: Elimină prietenul).
 * Dacă ea ți-a trimis cerere: „Acceptă” / „Refuză”. Dacă ai blocat-o: „Deblochează”.
 */
export default function FriendButton({ personId, name, status, onEmber = false }: Props) {
  // Acțiunea principală: albă pe fundal închis, neagră pe portocaliu.
  const primary = onEmber ? styles.primaryOnEmber : styles.primary;
  const primaryColor = onEmber ? colors.text : colors.onLight;
  // Pastilele secundare: sticlă deschisă pe negru, sticlă închisă pe portocaliu.
  const secondary = onEmber ? styles.secondaryOnEmber : styles.secondary;
  const linkStyle = [styles.link, onEmber && styles.linkOnEmber];

  if (status === 'none') {
    return (
      <Pressable
        onPress={() => sendFriendRequest(personId)}
        style={({ pressed }) => [styles.pill, primary, pressed && styles.pressed]}
      >
        <Ionicons name="person-add" size={18} color={primaryColor} />
        <Text style={[styles.pillText, { color: primaryColor }]}>Adaugă prieten</Text>
      </Pressable>
    );
  }

  if (status === 'outgoing') {
    return (
      <View style={styles.row}>
        <View style={[styles.pill, secondary, styles.flex]}>
          <Ionicons name="time-outline" size={18} color={colors.text} />
          <Text style={styles.pillText}>Cerere trimisă</Text>
        </View>
        <Pressable onPress={() => cancelFriendRequest(personId)} hitSlop={8}>
          <Text style={linkStyle}>Anulează</Text>
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
            style={({ pressed }) => [styles.pill, primary, styles.flex, pressed && styles.pressed]}
          >
            <Ionicons name="checkmark" size={18} color={primaryColor} />
            <Text style={[styles.pillText, { color: primaryColor }]}>Acceptă</Text>
          </Pressable>
          <Pressable
            onPress={() => declineFriendRequest(personId)}
            style={({ pressed }) => [styles.pill, secondary, styles.flex, pressed && styles.pressed]}
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
      <Pressable onPress={confirmRemove} style={({ pressed }) => [styles.pill, secondary, pressed && styles.pressed]}>
        <Ionicons name="people" size={18} color={colors.text} />
        <Text style={styles.pillText}>Prieteni ✓</Text>
        <Ionicons name="chevron-down" size={16} color={onEmber ? colors.text : colors.muted} />
      </Pressable>
    );
  }

  // Blocat
  return (
    <View style={styles.row}>
      <View style={[styles.pill, secondary, styles.flex]}>
        <Ionicons name="ban" size={18} color={onEmber ? colors.text : colors.nope} />
        <Text style={styles.pillText}>Blocat</Text>
      </View>
      <Pressable onPress={() => unblockPerson(personId)} hitSlop={8}>
        <Text style={linkStyle}>Deblochează</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  pillText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  primary: { backgroundColor: colors.text, borderColor: colors.text },
  primaryOnEmber: { backgroundColor: colors.background, borderColor: colors.background },
  secondary: { ...glass },
  secondaryOnEmber: { backgroundColor: colors.heroGlass, borderColor: colors.heroBorder },
  pressed: { opacity: 0.8 },
  link: { color: colors.muted, fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' },
  linkOnEmber: { color: colors.text },
  incoming: { gap: 10 },
  incomingText: { color: colors.text, fontSize: 14, fontWeight: '500' },
});
