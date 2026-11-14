import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputInstance, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, onThemeChange } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import { tr } from '../i18n';

interface Props extends TextInputProps {
  label: string;
  /** Mesaj afișat sub câmp (și conturul devine roșu). */
  error?: string | null;
  /** Câmp de parolă, cu buton de afișare. */
  password?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Câmp de text de sticlă, cu etichetă deasupra (vezi docs/design-language.md). */
const TextField = forwardRef<TextInputInstance, Props>(function TextField(
  { label, error, password = false, containerStyle, style, ...inputProps },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          secureTextEntry={password && hidden}
          autoCapitalize={password ? 'none' : inputProps.autoCapitalize}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...inputProps}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? tr('Arată parola') : tr('Ascunde parola')}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default TextField;

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
    fieldFocused: { borderColor: colors.muted, backgroundColor: colors.cardStrong },
    fieldError: { borderColor: colors.nope },
    input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 14 },
    error: { color: colors.nope, fontSize: 12, marginLeft: 6 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
