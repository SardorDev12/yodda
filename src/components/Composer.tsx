import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { space } from '@/theme/tokens';
import { Button, Surface, TextField } from './ui';

/** Inline "add a named thing" form used for books and subjects. */
export function NameComposer({
  placeholder,
  buttonLabel,
  onSubmit,
}: {
  placeholder: string;
  buttonLabel: string;
  onSubmit: (name: string) => Promise<void>;
}) {
  const { t } = useSettings();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError(t('nameRequired'));
    setBusy(true);
    try {
      await onSubmit(name.trim());
      setName('');
      setError(null);
    } catch {
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Surface>
      <View style={styles.row}>
        <View style={styles.input}>
          <TextField
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            placeholder={placeholder}
            error={error}
            returnKeyType="done"
            onSubmitEditing={submit}
            maxLength={120}
          />
        </View>
        <Button label={buttonLabel} icon="add" onPress={submit} loading={busy} style={styles.btn} />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 200 },
  btn: { alignSelf: 'flex-start', paddingHorizontal: space.lg },
});
