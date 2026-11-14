import { StyleSheet, Text } from 'react-native';

import TextField from './TextField';
import type { UsernameStatus } from '../hooks/useUsernameAvailability';
import { colors } from '../theme/colors';
import { normalizeUsernameInput, usernameError } from '../utils/usernameRules';
import { tr } from '../i18n';

interface Props {
  value: string;
  onChange: (username: string) => void;
  status: UsernameStatus;
  /** Eroarea de la trimitere (ex. „Alege un username disponibil.”), peste starea curentă. */
  error?: string | null;
}

/**
 * Câmpul de username: strict litere mici (orice majusculă devine literă mică pe loc),
 * cu „disponibil / ocupat / format invalid” sub el.
 */
export default function UsernameField({ value, onChange, status, error }: Props) {
  const problem =
    error ?? (status === 'invalid' ? usernameError(value) : status === 'taken' ? tr('Username-ul e deja luat.') : null);

  return (
    <>
      <TextField
        label={tr('Username')}
        value={value}
        onChangeText={(text) => onChange(normalizeUsernameInput(text))}
        error={problem}
        placeholder={tr('ex. nume.prenume')}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        maxLength={20}
      />
      {!problem ? (
        <Text style={[styles.status, status === 'available' && styles.available]}>
          {status === 'available'
            ? tr('@{username} e disponibil', { username: value })
            : status === 'checking'
              ? tr('Se verifică…')
              : tr('Doar litere mici, cifre, punct și underscore. Apare în codul tău QR.')}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.faint, fontSize: 12, marginTop: -8, marginLeft: 6 },
  available: { color: colors.like },
});
