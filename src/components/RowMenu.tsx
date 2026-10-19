import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/store/settings-context';
import { radius, shadow, spacing } from '@/theme';

export interface RowMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * "..." menu for a list row or screen header (book/unit/card). A centered,
 * fixed-width card — one tappable row per item plus a separate Cancel row —
 * matching RenameModal's dialog so every modal in the app reads the same.
 */
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const { colors, t } = useSettings();
  const [open, setOpen] = useState(false);

  function handlePress(item: RowMenuItem) {
    setOpen(false);
    item.onPress();
  }

  return (
    <>
      <Pressable hitSlop={8} onPress={() => setOpen(true)}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheetWrap}>
            <View style={[styles.sheet, { backgroundColor: colors.card }]}>
              {items.map((item, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.item,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    pressed && { backgroundColor: colors.bg },
                  ]}
                  onPress={() => handlePress(item)}
                >
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={item.destructive ? colors.danger : colors.text}
                    style={styles.itemIcon}
                  />
                  <Text style={[styles.itemText, { color: item.destructive ? colors.danger : colors.text }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.sheet, styles.cancelSheet, { backgroundColor: colors.card }, pressed && { backgroundColor: colors.bg }]}
              onPress={() => setOpen(false)}
            >
              <Text style={[styles.itemText, styles.cancelText, { color: colors.primary }]}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
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
  sheetWrap: { width: '100%', maxWidth: 380, gap: spacing(1.5) },
  sheet: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.raised },
  cancelSheet: { alignItems: 'center', paddingVertical: spacing(1.75) },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(1.75), paddingHorizontal: spacing(2) },
  itemIcon: { width: 24, marginRight: spacing(1.5) },
  itemText: { fontSize: 16, fontWeight: '600' },
  cancelText: { fontWeight: '700' },
});
