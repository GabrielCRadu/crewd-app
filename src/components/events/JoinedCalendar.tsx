import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GlassIconButton from '../GlassIconButton';
import AddToGoogleCalendar from './AddToGoogleCalendar';
import { getCategory } from '../../data/categories';
import { colors, onThemeChange } from '../../theme/colors';
import { type } from '../../theme/typography';
import { glass, radii } from '../../theme/shape';
import type { EventWithDistance } from '../../types/events';
import {
  weekdayInitials,
  addMonths,
  dayKey,
  formatMonthName,
  formatMonthYear,
  groupByDay,
  inMonth,
  initialMonth,
  monthGrid,
  startOfMonth,
} from '../../utils/calendar';
import { formatLongDay, formatTime, formatWeekdayShort, hasEnded, isLive } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import { tr } from '../../i18n';

interface Props {
  /** Evenimentele la care ești înscris (și cele trecute, ca să-ți vezi luna întreagă). */
  events: EventWithDistance[];
  onOpenEvent: (eventId: string) => void;
  /** Din starea goală: du-mă la lista cu toate evenimentele. */
  onBrowse: () => void;
}

/**
 * „Calendarul meu”: luna cu zilele în care ai ceva (punct sub număr) și, dedesubt, programul
 * pe zile, ca în Google Calendar: ziua în stânga, evenimentele cu ora, locul și categoria în dreapta.
 * Apeși pe o zi ca să vezi doar ziua aceea; încă o dată (sau „Toată luna”) revii la toată luna.
 * Evenimentele care urmează au un buton „G” care le adaugă în Google Calendar.
 */
export default function JoinedCalendar({ events, onOpenEvent, onBrowse }: Props) {
  const today = new Date();
  const todayKey = dayKey(today);
  const [month, setMonth] = useState(() => initialMonth(events, today));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const weeks = useMemo(() => monthGrid(month), [month]);
  const allByDay = useMemo(() => groupByDay(events), [events]);
  const monthByDay = useMemo(() => groupByDay(inMonth(events, month)), [events, month]);

  const changeMonth = (delta: number) => {
    setMonth((m) => addMonths(m, delta));
    setSelectedKey(null);
  };
  const goToday = () => {
    setMonth(startOfMonth(today));
    setSelectedKey(todayKey);
  };
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  // Ce arată programul: o singură zi (cea aleasă) sau toată luna.
  const shownDays: [string, EventWithDistance[]][] = selectedKey
    ? [[selectedKey, allByDay.get(selectedKey) ?? []]]
    : [...monthByDay.entries()];

  if (events.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="calendar-outline" size={28} color={colors.text} />
        <Text style={styles.emptyTitle}>{tr('Calendarul tău e gol')}</Text>
        <Text style={styles.emptyText}>{tr('Apasă „Vin și eu” la un eveniment și apare aici, la ziua și ora lui.')}</Text>
        <Pressable onPress={onBrowse} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
          <Text style={styles.emptyButtonText}>{tr('Vezi evenimentele')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Luna: titlu, „Azi” și săgețile */}
      <View style={styles.monthCard}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{formatMonthYear(month)}</Text>
          <View style={styles.monthNav}>
            {!isCurrentMonth || selectedKey !== todayKey ? (
              <Pressable onPress={goToday} hitSlop={6} style={({ pressed }) => [styles.todayPill, pressed && styles.pressed]}>
                <Text style={styles.todayText}>{tr('Azi')}</Text>
              </Pressable>
            ) : null}
            <GlassIconButton icon="chevron-back" size={36} onPress={() => changeMonth(-1)} />
            <GlassIconButton icon="chevron-forward" size={36} onPress={() => changeMonth(1)} />
          </View>
        </View>

        <View style={styles.weekRow}>
          {weekdayInitials().map((d, i) => (
            <Text key={i} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        {weeks.map((week) => (
          <View key={dayKey(week[0]!.date)} style={styles.weekRow}>
            {week.map(({ date, inMonth: thisMonth }) => {
              const key = dayKey(date);
              const dayEvents = allByDay.get(key) ?? [];
              const selected = key === selectedKey;
              const isToday = key === todayKey;
              const allPast = dayEvents.length > 0 && dayEvents.every((e) => hasEnded(e));
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setSelectedKey(selected ? null : key);
                    if (!thisMonth) setMonth(startOfMonth(date));
                  }}
                  style={styles.cell}
                  accessibilityLabel={`${formatLongDay(date)}${dayEvents.length ? `, ${dayEvents.length} evenimente` : ''}`}
                >
                  <View style={[styles.dayCircle, isToday && styles.todayCircle, selected && styles.selectedCircle]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        !thisMonth && styles.dayOutside,
                        selected && styles.dayNumberSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  {/* Câte un punct pentru fiecare eveniment (maxim 3) */}
                  <View style={styles.dots}>
                    {dayEvents.slice(0, 3).map((e) => (
                      <View key={e.id} style={[styles.dot, (allPast || !thisMonth) && styles.dotFaded]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Programul */}
      <View style={styles.agendaHeader}>
        <Text style={styles.sectionTitle}>
          {selectedKey ? formatLongDay(new Date(`${selectedKey}T12:00:00`)).toUpperCase() : tr('TOATĂ LUNA {p}', { p: formatMonthName(month).toUpperCase() })}
        </Text>
        {selectedKey ? (
          <Pressable onPress={() => setSelectedKey(null)} hitSlop={8}>
            <Text style={styles.link}>{tr('Toată luna')}</Text>
          </Pressable>
        ) : null}
      </View>

      {shownDays.length === 0 || shownDays.every(([, list]) => list.length === 0) ? (
        <Text style={styles.nothing}>
          {selectedKey ? tr('Nimic programat în ziua asta.') : tr('Nu ai nimic programat în {p}.', { p: formatMonthName(month) })}
        </Text>
      ) : (
        shownDays.map(([key, list]) => {
          const date = list[0]?.startsAt ?? new Date(`${key}T12:00:00`);
          const isToday = key === todayKey;
          return (
            <View key={key} style={styles.dayGroup}>
              {/* Ziua, în stânga */}
              <View style={styles.dayColumn}>
                <Text style={[styles.dayColWeekday, isToday && styles.dayColToday]}>{formatWeekdayShort(date)}</Text>
                <View style={[styles.dayColCircle, isToday && styles.selectedCircle]}>
                  <Text style={[styles.dayColNumber, isToday && styles.dayNumberSelected]}>{date.getDate()}</Text>
                </View>
              </View>

              {/* Evenimentele zilei */}
              <View style={styles.dayEvents}>
                {list.map((e) => {
                  const ended = hasEnded(e);
                  const live = isLive(e);
                  return (
                      <Pressable
                        key={e.id}
                        onPress={() => onOpenEvent(e.id)}
                        style={({ pressed }) => [styles.eventCard, ended && styles.eventEnded, pressed && styles.pressed]}
                      >
                        <View style={styles.timeColumn}>
                          <Text style={styles.timeStart}>{formatTime(e.startsAt)}</Text>
                          <Text style={styles.timeEnd}>
                            {e.endsAtEstimated ? '' : formatTime(e.endsAt)}
                          </Text>
                        </View>
                        <View style={styles.eventBar} />
                        <View style={styles.eventText}>
                          <Text style={styles.eventTitle} numberOfLines={2}>
                            {e.title}
                          </Text>
                          <Text style={styles.eventMeta} numberOfLines={1}>
                            {e.venueName} · {formatDistance(e.distanceKm)}
                          </Text>
                          <View style={styles.eventTags}>
                            <Text style={styles.eventCategory}>{getCategory(e.category).label}</Text>
                            {live ? <Text style={styles.badgeLive}>{tr('ACUM')}</Text> : null}
                            {ended ? <Text style={styles.badgeEnded}>{tr('Încheiat')}</Text> : null}
                          </View>
                        </View>
                        {/* Evenimentele care urmează se pot pune și în Google Calendar */}
                        {ended ? (
                          <Ionicons name="chevron-forward" size={16} color={colors.faint} />
                        ) : (
                          <AddToGoogleCalendar event={e} compact />
                        )}
                      </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const CELL_CIRCLE = 34;

const makeStyles = () =>
  StyleSheet.create({
    root: { gap: 14 },
    monthCard: { ...glass, borderRadius: radii.card, padding: 14, gap: 4 },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    monthTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    todayPill: { ...glass, borderRadius: radii.pill, paddingHorizontal: 14, height: 36, justifyContent: 'center' },
    todayText: { color: colors.text, fontWeight: '600', fontSize: 13 },
    weekRow: { flexDirection: 'row' },
    weekday: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '600', paddingVertical: 6 },
    cell: { flex: 1, alignItems: 'center', paddingVertical: 3, gap: 3 },
    dayCircle: {
      width: CELL_CIRCLE,
      height: CELL_CIRCLE,
      borderRadius: CELL_CIRCLE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    todayCircle: { borderWidth: 1, borderColor: colors.text },
    selectedCircle: { backgroundColor: colors.text, borderWidth: 0 },
    dayNumber: { color: colors.text, fontSize: 15, fontWeight: '500' },
    dayOutside: { color: colors.faint },
    dayNumberSelected: { color: colors.onLight, fontWeight: '700' },
    dots: { flexDirection: 'row', gap: 3, height: 6 },
    // Roșu, ales intenționat (excepție de la stilul alb-negru): se vede imediat în ce zile ai ceva. Zilele trecute: același roșu, estompat.
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.nope },
    dotFaded: { opacity: 0.35 },
    agendaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    sectionTitle: { ...type.label },
    link: { color: colors.text, fontSize: 13, fontWeight: '600' },
    nothing: { color: colors.muted, fontSize: 14 },
    dayGroup: { flexDirection: 'row', gap: 12 },
    dayColumn: { width: 44, alignItems: 'center', gap: 4, paddingTop: 6 },
    dayColWeekday: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    dayColToday: { color: colors.text },
    dayColCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    dayColNumber: { color: colors.text, fontSize: 20, fontWeight: '700' },
    dayEvents: { flex: 1, gap: 8 },
    eventCard: {
      ...glass,
      borderRadius: radii.inner,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    eventEnded: { opacity: 0.5 },
    pressed: { backgroundColor: colors.cardStrong },
    timeColumn: { width: 42, alignItems: 'flex-start' },
    timeStart: { color: colors.text, fontSize: 14, fontWeight: '700' },
    timeEnd: { color: colors.muted, fontSize: 12, marginTop: 2 },
    eventBar: { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.text },
    eventText: { flex: 1, gap: 3 },
    eventTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    eventMeta: { color: colors.muted, fontSize: 13 },
    eventTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eventCategory: { color: colors.muted, fontSize: 12 },
    badgeLive: {
      color: colors.onLight,
      backgroundColor: colors.text,
      fontSize: 10,
      fontWeight: '800',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
    badgeEnded: { color: colors.faint, fontSize: 12 },
    emptyCard: { ...glass, borderRadius: radii.card, padding: 24, alignItems: 'center', gap: 10 },
    emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    emptyButton: { backgroundColor: colors.text, borderRadius: radii.pill, paddingHorizontal: 20, paddingVertical: 11, marginTop: 6 },
    emptyButtonText: { color: colors.onLight, fontWeight: '600' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
