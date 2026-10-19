import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

import { useSettings } from '@/store/settings-context';
import { radius, shadow, spacing } from '@/theme';

/**
 * expo-updates checks for a new OTA update on cold start by default, but
 * won't apply it until the *next* launch unless something calls
 * reloadAsync(). This surfaces that as an in-app prompt instead of making
 * users force-quit and relaunch to get a fix — checks again whenever the
 * app returns to the foreground, not just at cold start.
 *
 * No-ops on web and in development, where expo-updates is disabled.
 */
export function UpdatePrompt() {
  const { colors, t } = useSettings();
  const [visible, setVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !Updates.isEnabled) return;

    async function check() {
      if (dismissed.current) return;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) setVisible(true);
      } catch {
        // Background check — a network hiccup here isn't worth surfacing.
      }
    }

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);

  async function handleApply() {
    setApplying(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setApplying(false);
      setVisible(false);
    }
  }

  function handleLater() {
    dismissed.current = true;
    setVisible(false);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleLater}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('update.title')}</Text>
          <Text style={[styles.body, { color: colors.muted }]}>{t('update.body')}</Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.laterButton, pressed && !applying && styles.pressedDim]}
              onPress={handleLater}
              disabled={applying}
            >
              <Text style={[styles.laterText, { color: colors.muted }]}>{t('update.later')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.applyButton, { backgroundColor: colors.primary }, pressed && !applying && styles.pressedDim]}
              onPress={handleApply}
              disabled={applying}
            >
              {applying ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyText}>{t('update.now')}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing(3) },
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
  laterButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  laterText: { fontWeight: '600', fontSize: 15 },
  applyButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
