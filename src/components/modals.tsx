import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { MIN_TOUCH, radius, space } from '@/theme/tokens';
import { AppText, Button, IconButton, TextField, type IconName, type TextInputRef } from './ui';

/*
 * Custom modals: Alert.alert / Alert.prompt are no-ops (or unreliable) on web,
 * so all prompts and confirmations go through these.
 */

function Dialog({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors } = useSettings();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          {/* Inner pressable swallows taps so only the backdrop dismisses. */}
          <Pressable
            accessible={false}
            style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => undefined}
          >
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useSettings();
  return (
    <Dialog visible={visible} onClose={onCancel}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {body ? <AppText muted>{body}</AppText> : null}
      <View style={styles.actions}>
        <Button label={t('cancel')} variant="secondary" onPress={onCancel} style={styles.actionBtn} />
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          loading={loading}
          onPress={onConfirm}
          style={styles.actionBtn}
        />
      </View>
    </Dialog>
  );
}

export function RenameModal({
  visible,
  title,
  initialValue,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  title: string;
  initialValue: string;
  onSubmit: (name: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const { t } = useSettings();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<TextInputRef>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(null);
      setTimeout(() => input.current?.focus(), 100);
    }
  }, [visible, initialValue]);

  const submit = async () => {
    if (!value.trim()) return setError(t('nameRequired'));
    setBusy(true);
    try {
      await onSubmit(value.trim());
    } catch {
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog visible={visible} onClose={onCancel}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      <TextField
        ref={input}
        label={t('name')}
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setError(null);
        }}
        error={error}
        returnKeyType="done"
        onSubmitEditing={submit}
        selectTextOnFocus
        maxLength={120}
      />
      <View style={styles.actions}>
        <Button label={t('cancel')} variant="secondary" onPress={onCancel} style={styles.actionBtn} />
        <Button label={t('save')} loading={busy} onPress={submit} style={styles.actionBtn} />
      </View>
    </Dialog>
  );
}

export interface MenuItem {
  label: string;
  icon: IconName;
  destructive?: boolean;
  onPress: () => void;
}

/** "⋯" button on a list row that opens a small action menu. */
export function RowMenu({ items, label }: { items: MenuItem[]; label?: string }) {
  const { colors, t } = useSettings();
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton icon="ellipsis-horizontal" label={label ?? t('moreActions')} onPress={() => setOpen(true)} />
      <Dialog visible={open} onClose={() => setOpen(false)}>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="menuitem"
            onPress={() => {
              setOpen(false);
              // Let the menu close before opening the next modal (iOS can't stack two).
              setTimeout(item.onPress, 220);
            }}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.menuItem,
              { backgroundColor: pressed || hovered ? colors.surfaceAlt : 'transparent' },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={item.destructive ? colors.danger : colors.text} />
            <AppText variant="bodyStrong" color={item.destructive ? colors.danger : colors.text}>
              {item.label}
            </AppText>
          </Pressable>
        ))}
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xl,
    gap: space.lg,
  },
  actions: { flexDirection: 'row', gap: space.md, justifyContent: 'flex-end' },
  actionBtn: { flex: 1 },
  menuItem: {
    minHeight: MIN_TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
});
