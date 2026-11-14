import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Chip from '../Chip';
import GlassIconButton from '../GlassIconButton';
import PhotoViewer from '../PhotoViewer';
import { useAuth } from '../../context/AuthContext';
import { usePublicProfile } from '../../hooks/usePublicProfile';
import { tr } from '../../i18n';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';
import { allProfileTags } from '../../utils/profileTags';

/** Ce se știe deja despre persoană (din grup sau din fișa username-ului), arătat până vine profilul public. */
export interface ProfileFallback {
  name: string;
  age?: number | null;
  photoUrl: string | null;
  username?: string | null;
  tags?: string[];
}

interface Props {
  /** Contul a cărui pagină se arată (profiles/{uid}); null = doar ce e în `fallback`. */
  uid: string | null;
  fallback: ProfileFallback | null;
  onBack: () => void;
  /** Note sub identitate (ex. „A propus grupul”, „În grupul tău pentru …”). */
  children?: ReactNode;
}

/**
 * Profilul complet al unui cont real (spec 2026-11-14-profil-membru-tema-design.md): poza mare
 * (se mărește la apăsare), numele, vârsta și orașul, @username, „Despre” și tag-urile, cu cele comune
 * cu tine evidențiate. Arată la fel ca profilul persoanelor de test, fără secțiunile care nu există încă
 * pentru conturile reale (prieteni, badge-uri, amintiri).
 */
export default function UserProfileView({ uid, fallback, onBack, children }: Props) {
  const insets = useSafeAreaInsets();
  const { profile: me } = useAuth();
  const { profile: pub, loading } = usePublicProfile(uid);
  const [photoOpen, setPhotoOpen] = useState(false);
  const myTags = useMemo(() => allProfileTags(me), [me]);

  const name = pub?.name ?? fallback?.name ?? '';
  const age = pub?.age ?? fallback?.age ?? null;
  const city = pub?.city ?? '';
  const bio = pub?.bio ?? '';
  const photoUrl = pub?.photoUrl ?? fallback?.photoUrl ?? null;
  // Username-ul vine din profilul public (verificat de reguli) sau, fără el, din fișa username-ului (codul QR).
  const username = pub ? pub.username : (fallback?.username ?? null);
  const tags = pub?.tags ?? fallback?.tags ?? [];
  const shared = tags.filter((t) => myTags.includes(t));
  const others = tags.filter((t) => !myTags.includes(t));
  const meta = [age ? tr('{age} ani', { age }) : '', city].filter(Boolean).join(' · ');

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <GlassIconButton icon="chevron-back" onPress={onBack} />
    </View>
  );

  if (!pub && !fallback) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Text style={styles.muted}>{tr('Profilul nu e disponibil.')}</Text>
              <Pressable onPress={onBack} style={styles.pill}>
                <Text style={styles.pillText}>{tr('Înapoi')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {header}

        <View style={styles.identity}>
          {photoUrl ? (
            <Pressable onPress={() => setPhotoOpen(true)} accessibilityLabel={tr('Mărește poza')}>
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            </Pressable>
          ) : (
            <View style={styles.photo}>
              <Text style={styles.photoInitial}>{(name || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          {meta ? (
            <View style={styles.metaRow}>
              {city ? <Ionicons name="location-outline" size={15} color={colors.text} /> : null}
              <Text style={styles.meta}>{meta}</Text>
            </View>
          ) : null}
          {username ? <Text style={styles.username}>@{username}</Text> : null}
          {children}
        </View>

        <View style={styles.content}>
          {bio ? (
            <View style={styles.section}>
              <Text style={styles.label}>{tr('DESPRE')}</Text>
              <View style={styles.card}>
                <Text style={styles.bio}>{bio}</Text>
              </View>
            </View>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.label}>
                {tr('ÎN COMUN ·')}{' '}
                {shared.length === 0 ? tr('NICIUN TAG') : shared.length === 1 ? tr('1 TAG') : tr('{count} TAG-URI', { count: shared.length })}
              </Text>
              <View style={styles.tags}>
                {shared.map((t) => (
                  <Chip key={t} label={t} active />
                ))}
                {others.map((t) => (
                  <View key={t} style={styles.faded}>
                    <Chip label={t} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {loading ? <ActivityIndicator color={colors.muted} /> : null}
        </View>
      </ScrollView>

      <PhotoViewer photoUrl={photoOpen ? photoUrl : null} caption={name} onClose={() => setPhotoOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, flexDirection: 'row' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  identity: { paddingHorizontal: 20, paddingTop: 20, gap: 10 },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoInitial: { fontSize: 40, fontWeight: '700', color: colors.text },
  name: { fontSize: 46, lineHeight: 50, fontWeight: '800', letterSpacing: -1.5, color: colors.text, marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 15, fontWeight: '500', color: colors.text },
  username: { fontSize: 15, color: colors.muted },
  content: { padding: 20, paddingTop: 28, gap: 28 },
  section: { gap: 12 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6, color: colors.muted },
  card: {
    padding: 18,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  bio: { fontSize: 16, lineHeight: 24, color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faded: { opacity: 0.4 },
  muted: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.text },
  pillText: { color: colors.onLight, fontWeight: '600' },
});
