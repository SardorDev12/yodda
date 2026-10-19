import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSettings } from '@/store/settings-context';
import { radius, shadow, spacing } from '@/theme';

/**
 * Cross-platform rename dialog — Alert.prompt only exists on iOS, so a
 * plain text-input modal is the only way to get this on Android/web too.
 */
export function RenameModal({
  visible,
  title,
  initialValue,
  placeholder,
  onCancel,
  onSave,
}: {
  visible: boolean;
  title: string;
  initialValue: string;
  placeholder?: string;
  onCancel: () => void;
  onSave: (name: string) => Promise<void> | void;
}) {
  const { colors, t } = useSettings();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible && !wasVisible) {
    setWasVisible(true);
    setValue(initialValue);
  } else if (!visible && wasVisible) {
    setWasVisible(false);
  }

  const trimmed = value.trim();
  const dirty = trimmed.length > 0 && trimmed !== initialValue.trim();

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <View style={styles.actionsRow}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressedDim]} onPress={onCancel}>
              <Text style={[styles.cancelText, { color: colors.muted }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: dirty ? colors.primary : colors.border },
                pressed && dirty && styles.pressedDim,
              ]}
              onPress={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>{t('common.save')}</Text>}
            </Pressable>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  pressedDim: { opacity: 0.7 },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing(2.5),
    gap: spacing(1.5),
    ...shadow.raised,
  },
  title: { fontSize: 17, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing(1.5),
    fontSize: 16,
  },
  actionsRow: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(0.5) },
  cancelButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  cancelText: { fontWeight: '600', fontSize: 15 },
  saveButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
