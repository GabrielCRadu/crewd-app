import { useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import NowCard from './NowCard';
import type { EventWithDistance } from '../../types/events';
import { colors, onThemeChange } from '../../theme/colors';
import { radii } from '../../theme/shape';

interface Props {
  /** Toate evenimentele în desfășurare (cel mai apropiat primul). */
  events: EventWithDistance[];
  onOpen: (eventId: string) => void;
}

/** Spațiul dintre carduri și marginea ecranului. */
const SIDE = 20;
const GAP = 12;

/**
 * Cardurile „ACUM” într-un carusel: dai swipe stânga/dreapta între evenimentele în desfășurare.
 * Sub carusel, punctele arată pe ce card ești (doar dacă sunt mai multe).
 */
export default function NowCarousel({ events, onOpen }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = width - SIDE * 2;
  const [index, setIndex] = useState(0);

  // Calculăm cardul curent din cât s-a derulat lista.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP));
    if (next !== index) setIndex(next);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Se oprește mereu exact pe un card.
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <NowCard event={item} onOpen={() => onOpen(item.id)} />
          </View>
        )}
      />

      {events.length > 1 ? (
        <View style={styles.dots}>
          {events.map((e, i) => (
            <View key={e.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    // Caruselul iese din padding-ul ecranului, ca să poți trage cardurile de la margine la margine.
    container: { marginHorizontal: -SIDE, gap: 10 },
    list: { paddingHorizontal: SIDE },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: radii.pill, backgroundColor: colors.faint },
    dotActive: { width: 18, backgroundColor: colors.text },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
