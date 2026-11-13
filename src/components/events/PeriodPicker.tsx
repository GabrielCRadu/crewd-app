import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Period } from '../../types/events';
import { fonts, palette, ui } from '../../theme/eventsTheme';
import {
  getMonthPeriod,
  getNowPeriod,
  getTodayPeriod,
  getUpcomingMonths,
  getWeekendPeriod,
  getWeeksOfMonth,
  isSamePeriod,
} from '../../utils/dates';
import Pill from './Pill';

interface Props {
  value: Period;
  onChange: (period: Period) => void;
}

/**
 * Alegerea perioadei, pe 3 rânduri:
 * 1. scurtături (Acum / Azi / Weekendul ăsta)
 * 2. lunile (comutator ca „Listă / Hartă” din machetă)
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
      <View style={styles.wrapRow}>
        {shortcuts.map((p) => (
          <Pill
            key={p.kind}
            label={p.label}
            icon={p.kind === 'now' ? 'radio-button-on' : undefined}
            active={isSamePeriod(p, value)}
            onPress={() => onChange(p)}
          />
        ))}
      </View>

      {/* 2. Lunile */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsTrack}>
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
              style={[styles.month, active && styles.monthActive]}
            >
              <Text style={[styles.monthText, active && styles.monthTextActive]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 3. Săptămânile din luna aleasă */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {[monthPeriod, ...weeks].map((p) => (
          <Pill
            key={`${p.kind}-${p.start}`}
            label={p.kind === 'month' ? 'Toată luna' : p.label}
            icon={p.kind === 'month' ? 'calendar-outline' : undefined}
            active={isSamePeriod(p, value)}
            onPress={() => onChange(p)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  row: { paddingHorizontal: 20, gap: 8 },
  // Rândul de luni arată ca un comutator: o „șină” cu contur și luna activă umplută cu galben.
  monthsTrack: {
    marginHorizontal: 20,
    padding: 4,
    gap: 4,
    borderRadius: 18,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    backgroundColor: palette.card,
  },
  month: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: ui.outlineWidth,
    borderColor: 'transparent',
  },
  monthActive: { backgroundColor: ui.selected, borderColor: ui.outline },
  monthText: { fontFamily: fonts.extrabold, fontSize: 15, color: palette.muted },
  monthTextActive: { color: palette.ink },
});
