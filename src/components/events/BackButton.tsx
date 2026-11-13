import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import Raised from './Raised';

/** Butonul pătrat „înapoi” din machetă. */
export default function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Înapoi">
      <Raised radius={16} contentStyle={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Raised>
    </Pressable>
  );
}
