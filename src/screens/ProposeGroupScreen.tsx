import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Chip from '../components/Chip';
import FormMessage from '../components/FormMessage';
import GlassIconButton from '../components/GlassIconButton';
import GradientButton from '../components/GradientButton';
import TextField from '../components/TextField';
import { allProfileTags, useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { proposeGroup } from '../services/groupsService';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import type { ProposalDraft } from '../types/groups';
import { formatLongDay, formatTime } from '../utils/dates';
import {
  MAX_GROUP_SIZE,
  MIN_GROUP_SIZE,
  MIN_MEMBER_AGE,
  VIBE_MAX_LENGTH,
  defaultProposal,
  profileAge,
  proposalErrors,
} from '../utils/groupRules';

type Props = NativeStackScreenProps<EventsStackParamList, 'ProposeGroup'>;

const SIZES = Array.from({ length: MAX_GROUP_SIZE - MIN_GROUP_SIZE + 1 }, (_, i) => MIN_GROUP_SIZE + i);

/**
 * „Propune un grupuleț” (docs/superpowers/specs/2026-11-13-grupulete-design.md → Propunerea):
 * ora și locul întâlnirii, intervalul de vârstă, mărimea maximă și vibe-ul, cu valori precompletate.
 * Cel care propune devine primul membru; grupulețul se formează la 3.
 */
export default function ProposeGroupScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { profile } = useAuth();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const event = events.find((e) => e.id === eventId) ?? null;

  const myAge = profile ? profileAge(profile, new Date()) : MIN_MEMBER_AGE;
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const current = draft ?? (event ? defaultProposal(event.startsAt, myAge) : null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProposalDraft, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Tag-urile grupului: cele din profil care se potrivesc cu evenimentul (nu se editează).
  const tags = useMemo(() => {
    if (!event || !profile) return [];
    const mine = allProfileTags(profile);
    return event.tags.filter((t) => mine.includes(t));
  }, [event, profile]);

  if (!event || !current || !profile) {
    return <SafeAreaView style={styles.safe} />;
  }

  const update = (patch: Partial<ProposalDraft>) => setDraft({ ...current, ...patch });

  const pickTime = () => {
    DateTimePickerAndroid.open({
      value: current.meetupAt,
      mode: 'time',
      is24Hour: true,
      onChange: (e, date) => {
        if (e.type !== 'set' || !date) return;
        const next = new Date(event.startsAt);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        update({ meetupAt: next });
      },
    });
  };

  const submit = async () => {
    const found = proposalErrors(current, myAge, event.startsAt, new Date());
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setFormError(null);
    setSaving(true);
    try {
      await proposeGroup(eventId, current, tags, profile);
      navigation.goBack();
    } catch (e) {
      setFormError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Propune un grupuleț</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Ora întâlnirii (în ziua evenimentului) */}
          <View style={styles.block}>
            <Text style={styles.label}>Ne vedem la</Text>
            {Platform.OS === 'android' ? (
              <Pressable onPress={pickTime} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
                <Text style={styles.fieldText}>
                  {formatTime(current.meetupAt)} · {formatLongDay(current.meetupAt)}
                </Text>
                <Ionicons name="time-outline" size={18} color={colors.muted} />
              </Pressable>
            ) : (
              <View style={styles.field}>
                <Text style={styles.fieldText}>{formatLongDay(current.meetupAt)}</Text>
                <DateTimePicker
                  value={current.meetupAt}
                  mode="time"
                  display="compact"
                  themeVariant="dark"
                  onChange={(_e, date) => {
                    if (!date) return;
                    const next = new Date(event.startsAt);
                    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                    update({ meetupAt: next });
                  }}
                />
              </View>
            )}
            <Text style={styles.hint}>Evenimentul începe la {formatTime(event.startsAt)}.</Text>
            {errors.meetupAt ? <Text style={styles.error}>{errors.meetupAt}</Text> : null}
          </View>

          <TextField
            label="Unde"
            value={current.meetupPlace}
            onChangeText={(meetupPlace) => update({ meetupPlace })}
            error={errors.meetupPlace}
            maxLength={80}
          />

          {/* Intervalul de vârstă */}
          <View style={styles.block}>
            <Text style={styles.label}>Vârstă</Text>
            <View style={styles.ageRow}>
              <Stepper
                label="de la"
                value={current.minAge}
                onChange={(minAge) => update({ minAge })}
                min={MIN_MEMBER_AGE}
                max={current.maxAge}
              />
              <Stepper
                label="până la"
                value={current.maxAge}
                onChange={(maxAge) => update({ maxAge })}
                min={current.minAge}
                max={99}
              />
            </View>
            {errors.minAge || errors.maxAge ? <Text style={styles.error}>{errors.minAge ?? errors.maxAge}</Text> : null}
          </View>

          {/* Mărimea maximă */}
          <View style={styles.block}>
            <Text style={styles.label}>Câți oameni, maxim</Text>
            <View style={styles.chips}>
              {SIZES.map((n) => (
                <Chip key={n} label={String(n)} active={current.maxSize === n} onPress={() => update({ maxSize: n })} />
              ))}
            </View>
            {errors.maxSize ? <Text style={styles.error}>{errors.maxSize}</Text> : null}
          </View>

          <View style={styles.block}>
            <TextField
              label="Vibe-ul grupului"
              value={current.vibe}
              onChangeText={(vibe) => update({ vibe })}
              error={errors.vibe}
              placeholder="ex. venim pentru muzică, nu pentru băut"
              maxLength={VIBE_MAX_LENGTH}
            />
            <Text style={styles.counter}>
              {current.vibe.length}/{VIBE_MAX_LENGTH}
            </Text>
          </View>

          {tags.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.label}>Tag-urile grupului (din profilul tău)</Text>
              <View style={styles.chips}>
                {tags.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </View>
            </View>
          ) : null}

          <Text style={styles.hint}>
            Devii primul membru. Grupulețul se formează când sunteți cel puțin 3, iar chat-ul se deschide atunci.
          </Text>

          {formError ? <FormMessage text={formError} /> : null}
          <GradientButton label="Propune grupulețul" icon="arrow-forward" loading={saving} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Un număr cu butoane − / +. */
function Stepper({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <GlassIconButton icon="remove" size={36} round onPress={() => value > min && onChange(value - 1)} />
        <Text style={styles.stepperValue}>{value}</Text>
        <GlassIconButton icon="add" size={36} round onPress={() => value < max && onChange(value + 1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerText: { flex: 1 },
  title: { ...type.screenTitle, fontSize: 24 },
  subtitle: { fontSize: 13, color: colors.muted },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 20 },
  block: { gap: 8 },
  label: { ...type.label },
  field: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
  },
  pressed: { backgroundColor: colors.cardStrong },
  fieldText: { color: colors.text, fontSize: 16 },
  hint: { color: colors.faint, fontSize: 12 },
  error: { color: colors.nope, fontSize: 12, marginLeft: 6 },
  counter: { alignSelf: 'flex-end', color: colors.faint, fontSize: 12 },
  ageRow: { flexDirection: 'row', gap: 12 },
  stepper: { ...glass, flex: 1, alignItems: 'center', gap: 6, padding: 12, borderRadius: radii.inner },
  stepperLabel: { color: colors.muted, fontSize: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperValue: { color: colors.text, fontSize: 22, fontWeight: '600', minWidth: 32, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
