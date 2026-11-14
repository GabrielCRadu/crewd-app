import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { colors, onThemeChange } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import {
  earliestAllowedBirthDate,
  formatBirthDate,
  fromBirthDateString,
  latestAllowedBirthDate,
  toBirthDateString,
} from '../utils/birthDate';
import { tr } from '../i18n';

interface Props {
  label: string;
  /** „AAAA-LL-ZZ” sau null dacă nu a ales încă. */
  value: string | null;
  onChange: (value: string) => void;
  error?: string | null;
  /** Text mic sub câmp (ex. că nu se mai poate modifica). */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Câmp pentru data nașterii, cu selectorul nativ de dată (@react-native-community/datetimepicker, inclus în Expo Go):
 * pe Android dialogul sistemului, pe iOS un selector într-o fereastră de jos.
 * Nu se pot alege date care ar da sub 18 ani.
 */
export default function BirthDateField({ label, value, onChange, error, hint, containerStyle }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(value ? fromBirthDateString(value) : latestAllowedBirthDate());

  const maximumDate = latestAllowedBirthDate();
  const minimumDate = earliestAllowedBirthDate();
  const current = value ? fromBirthDateString(value) : maximumDate;

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(toBirthDateString(date));
        },
      });
    } else {
      setIosDraft(current);
      setIosOpen(true);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatBirthDate(value) : tr('neselectată')}`}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed, error ? styles.fieldError : null]}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatBirthDate(value) : tr('Alege data')}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint ? (
        <View style={styles.hintRow}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.faint} />
          <Text style={styles.hint}>{hint}</Text>
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setIosOpen(false)} hitSlop={8}>
                <Text style={styles.sheetCancel}>{tr('Anulează')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(toBirthDateString(iosDraft));
                  setIosOpen(false);
                }}
                hitSlop={8}
              >
                <Text style={styles.sheetDone}>{tr('Gata')}</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={iosDraft}
              mode="date"
              display="spinner"
              themeVariant="dark"
              locale="ro-RO"
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={(_e, date) => date && setIosDraft(date)}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    container: { gap: 8 },
    label: { ...type.label },
    field: {
      ...glass,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 54,
      paddingHorizontal: 18,
      borderRadius: radii.pill,
    },
    fieldPressed: { backgroundColor: colors.cardStrong },
    fieldError: { borderColor: colors.nope },
    value: { flex: 1, color: colors.text, fontSize: 16 },
    placeholder: { color: colors.faint },
    error: { color: colors.nope, fontSize: 12, marginLeft: 6 },
    hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 },
    hint: { flex: 1, color: colors.faint, fontSize: 12 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { backgroundColor: colors.surface, paddingBottom: 32, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 18 },
    sheetCancel: { color: colors.muted, fontSize: 16 },
    sheetDone: { color: colors.text, fontSize: 16, fontWeight: '600' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
