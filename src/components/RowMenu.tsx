import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { useSettings } from '@/store/settings-context';
import { radius, spacing } from '@/theme';

export interface RowMenuItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * Small "..." menu for a list row (book/unit/card). Keeps row actions
 * like delete out of the row's main tap target, which still navigates.
 */
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const { colors } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable hitSlop={8} onPress={() => setOpen(true)}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {items.map((item, index) => (
              <Pressable
                key={index}
                style={[styles.item, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
              >
                <Text style={[styles.itemText, { color: item.destructive ? colors.danger : colors.text }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing(3) },
  sheet: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  item: { paddingVertical: spacing(1.75), paddingHorizontal: spacing(2) },
  itemText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
