import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import OnboardingIdentityScreen from '../screens/onboarding/OnboardingIdentityScreen';
import OnboardingPhotoScreen from '../screens/onboarding/OnboardingPhotoScreen';
import OnboardingTagsScreen from '../screens/onboarding/OnboardingTagsScreen';
import { colors } from '../theme/colors';
import type { AuthStackParamList, OnboardingStackParamList } from './authTypes';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

/** Opțiunile ecranelor (calculate la randare, ca fundalul să urmeze tema activă). */
const screenOptions = () => ({ headerShown: false, contentStyle: { backgroundColor: colors.background } }) as const;

/** Înainte de login: Login ↔ Creare cont. */
export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions()}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="Terms" component={TermsScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </AuthStack.Navigator>
  );
}

/** După crearea contului, până la salvarea profilului: pasul 1 → pasul 2. */
export function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={screenOptions()}>
      <OnboardingStack.Screen name="OnboardingIdentity" component={OnboardingIdentityScreen} />
      <OnboardingStack.Screen name="OnboardingPhoto" component={OnboardingPhotoScreen} />
      <OnboardingStack.Screen name="OnboardingTags" component={OnboardingTagsScreen} />
    </OnboardingStack.Navigator>
  );
}
