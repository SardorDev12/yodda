import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/store/settings-context';
import { radius, shadow, spacing } from '@/theme';

/**
 * Cross-platform destructive-confirm dialog — Alert.alert is a documented
 * no-op on web (react-native-web's implementation is literally `static
 * alert() {}`), so every delete confirmation built on it silently did
 * nothing there. A plain Modal works on every platform.
 */
export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const { colors, t } = useSettings();
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    if (confirming) return;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && !confirming && styles.pressedDim]}
              onPress={onCancel}
              disabled={confirming}
            >
              <Text style={[styles.cancelText, { color: colors.muted }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                { backgroundColor: colors.danger },
                pressed && !confirming && styles.pressedDim,
              ]}
              onPress={handleConfirm}
              disabled={confirming}
            >
              {confirming ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
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
    gap: spacing(1),
    ...shadow.raised,
  },
  title: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(1) },
  cancelButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  cancelText: { fontWeight: '600', fontSize: 15 },
  confirmButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
