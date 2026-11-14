import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import type { CategoryId } from '../../types/events';

interface Props {
  imageUrl: string;
  category: CategoryId;
  style?: StyleProp<ViewStyle>;
  /** Mărimea iconiței de rezervă (când nu există afiș). */
  iconSize?: number;
  /** Apelat când afișul s-a terminat de încărcat (reușit sau nu). */
  onLoadEnd?: () => void;
}

/**
 * Afișul unui eveniment. Dacă lipsește sau nu se încarcă, rămâne o suprafață gri închis
 * cu iconița categoriei, ca să nu apară un gol.
 */
export default function EventPoster({ imageUrl, category, style, iconSize = 28, onLoadEnd }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl.length > 0 && !failed;

  return (
    <View style={[styles.base, style]}>
      {showImage ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} onLoadEnd={onLoadEnd} />
      ) : (
        <Ionicons name={getCategory(category).icon} size={iconSize} color={colors.faint} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, overflow: 'hidden' },
});
