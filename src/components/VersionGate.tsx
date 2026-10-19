import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAppConfig } from '@/db/queries';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isVersionBelow } from '@/lib/version';
import { useSettings } from '@/store/settings-context';
import { radius, shadow, spacing } from '@/theme';
import type { AppConfig } from '@/types';

/**
 * Store-release gate, separate from UpdatePrompt's OTA check: it reads
 * app_config from Supabase (see schema.sql) and compares it against this
 * build's version to catch the cases an OTA update can't fix — a native
 * dependency bump, a breaking API change server-side, anything that needs
 * a real store release. Below minVersion blocks with no dismiss; below
 * latestVersion shows a dismissible "update available" nudge instead.
 *
 * No-ops on web (no app store concept) and when Supabase isn't configured.
 */
export function VersionGate() {
  const { colors, t } = useSettings();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !isSupabaseConfigured) return;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    getAppConfig(platform)
      .then(setConfig)
      .catch(() => {
        // Non-critical background check — ignore network/config errors.
      });
  }, []);

  const currentVersion = Constants.expoConfig?.version;
  if (!config || !currentVersion) return null;

  const required = isVersionBelow(currentVersion, config.minVersion);
  const recommended = !required && isVersionBelow(currentVersion, config.latestVersion);
  if ((!required && !recommended) || (recommended && dismissed)) return null;

  function handleUpdate() {
    if (config?.updateUrl) Linking.openURL(config.updateUrl);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => !required && setDismissed(true)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {required ? t('versionGate.requiredTitle') : t('versionGate.recommendedTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {config.message || (required ? t('versionGate.requiredBody') : t('versionGate.recommendedBody'))}
          </Text>
          <View style={styles.actionsRow}>
            {!required && (
              <Pressable
                style={({ pressed }) => [styles.notNowButton, pressed && styles.pressedDim]}
                onPress={() => setDismissed(true)}
              >
                <Text style={[styles.notNowText, { color: colors.muted }]}>{t('versionGate.notNow')}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.updateButton, { backgroundColor: colors.primary }, pressed && styles.pressedDim]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateText}>{t('versionGate.update')}</Text>
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
  notNowButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  notNowText: { fontWeight: '600', fontSize: 15 },
  updateButton: { flex: 1, paddingVertical: spacing(1.25), borderRadius: radius.md, alignItems: 'center' },
  updateText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
