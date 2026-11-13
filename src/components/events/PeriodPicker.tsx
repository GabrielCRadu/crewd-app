import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Period } from '../../types/events';
import { colors } from '../../theme/colors';
import {
  getMonthPeriod,
  getNowPeriod,
  getTodayPeriod,
  getUpcomingMonths,
  getWeekendPeriod,
  getWeeksOfMonth,
  isSamePeriod,
} from '../../utils/dates';

interface Props {
  value: Period;
  onChange: (period: Period) => void;
}

/**
 * Alegerea perioadei, pe 3 rânduri:
 * 1. scurtături (Acum / Azi / Weekendul ăsta)
 * 2. lunile
 * 3. săptămânile din luna aleasă (+ „Toată luna”)
 */
export default function PeriodPicker({ value, onChange }: Props) {
  const months = useMemo(() => getUpcomingMonths(), []);

  // Luna afișată în rândul 3. Pornim de la luna perioadei primite.
  const [month, setMonth] = useState(() => {
    const d = new Date(value.start);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const weeks = useMemo(() => getWeeksOfMonth(month.year, month.month), [month]);
  const monthPeriod = getMonthPeriod(month.year, month.month);
  const usesMonthRows = value.kind === 'week' || value.kind === 'month';

  const shortcuts = [getNowPeriod(), getTodayPeriod(), getWeekendPeriod()];

  return (
    <View style={styles.container}>
      {/* 1. Scurtături */}
      <View style={styles.shortcuts}>
        {shortcuts.map((p) => {
          const active = isSamePeriod(p, value);
          return (
            <Pressable
              key={p.kind}
              onPress={() => onChange(p)}
              style={[styles.shortcut, active && styles.shortcutActive]}
            >
              {p.kind === 'now' ? <View style={[styles.liveDot, active && styles.liveDotActive]} /> : null}
              <Text style={[styles.shortcutText, active && styles.textOnPrimary]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 2. Lunile */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {months.map((m) => {
          const active = usesMonthRows && m.year === month.year && m.month === month.month;
          return (
            <Pressable
              key={`${m.year}-${m.month}`}
              onPress={() => {
                // Alegi luna => se selectează toată luna; apoi poți restrânge la o săptămână.
                setMonth({ year: m.year, month: m.month });
                onChange(getMonthPeriod(m.year, m.month));
              }}
              style={styles.monthItem}
            >
              <Text style={[styles.monthText, active && styles.monthTextActive]}>{m.label}</Text>
              <View style={[styles.monthUnderline, active && styles.monthUnderlineActive]} />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 3. Săptămânile din luna aleasă */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {[monthPeriod, ...weeks].map((p) => {
          const active = isSamePeriod(p, value);
          return (
            <Pressable
              key={`${p.kind}-${p.start}`}
              onPress={() => onChange(p)}
              style={[styles.week, active && styles.weekActive]}
            >
              {p.kind === 'month' ? (
                <Ionicons name="calendar-outline" size={14} color={active ? colors.primary : colors.muted} />
              ) : null}
              <Text style={[styles.weekText, active && styles.weekTextActive]}>
                {p.kind === 'month' ? 'Toată luna' : p.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  shortcuts: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, flexWrap: 'wrap' },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  shortcutText: { fontWeight: '600', color: colors.text },
  textOnPrimary: { color: '#fff' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.nope },
  liveDotActive: { backgroundColor: '#fff' },
  row: { paddingHorizontal: 20, gap: 8 },
  monthItem: { paddingHorizontal: 6, paddingVertical: 4, alignItems: 'center' },
  monthText: { fontSize: 16, fontWeight: '600', color: colors.muted },
  monthTextActive: { color: colors.text, fontWeight: '800' },
  monthUnderline: { height: 3, width: 20, borderRadius: 2, marginTop: 4, backgroundColor: 'transparent' },
  monthUnderlineActive: { backgroundColor: colors.primary },
  week: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  weekActive: { backgroundColor: `${colors.primary}1F`, borderWidth: 1, borderColor: colors.primary },
  weekText: { fontWeight: '600', color: colors.muted },
  weekTextActive: { color: colors.primary },
});
