import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import Logo from './Logo';
import { colors, onThemeChange } from '../theme/colors';

/**
 * Ecranul de încărcare de la pornire: logo-ul apare (fade + mărire ușoară), apoi „respiră”
 * cât timp aplicația citește setările și contul.
 */
export default function LogoSplash() {
  const appear = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    Animated.timing(appear, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() =>
      breathing.start(),
    );
    return () => breathing.stop();
  }, [appear, pulse]);

  const scale = Animated.add(
    appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
    pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.05] }),
  );
  const opacity = Animated.multiply(appear, pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] }));

  return (
    <View style={styles.screen}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Logo height={56} />
      </Animated.View>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  });

let styles = makeStyles();
// Tema se poate schimba din mers (Setări → Temă): stilurile se refac din noile culori.
onThemeChange(() => {
  styles = makeStyles();
});
