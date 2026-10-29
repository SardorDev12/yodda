import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Modal, Platform, StyleSheet, View } from 'react-native';
import { fetchAppConfig, type AppConfig } from '@/data/appConfig';
import { isVersionBelow } from '@/lib/version';
import { useSettings } from '@/providers/SettingsProvider';
import { radius, space } from '@/theme/tokens';
import { AppText, Button } from './ui';

export const installedVersion = Constants.expoConfig?.version ?? '1.0.0';

function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  useEffect(() => {
    // The web app always serves the latest build, so there is nothing to gate.
    if (Platform.OS === 'web') return;
    fetchAppConfig().then(setConfig).catch(() => undefined);
  }, []);
  return config;
}

const openUpdate = (config: AppConfig) => {
  if (config.updateUrl) Linking.openURL(config.updateUrl).catch(() => undefined);
};

/** Blocks the app with a non-dismissible modal when the installed build is below min_version. */
export function VersionGate({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const { t, colors } = useSettings();
  const blocked = !!config && isVersionBelow(installedVersion, config.minVersion);
  return (
    <>
      {children}
      <Modal visible={blocked} animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
        <View style={[styles.full, { backgroundColor: colors.bg }]}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="cloud-download-outline" size={36} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.center} accessibilityRole="header">
            {t('updateRequired')}
          </AppText>
          <AppText muted style={styles.center}>
            {config?.message || t('updateRequiredBody')}
          </AppText>
          {config?.updateUrl ? (
            <Button label={t('update')} icon="download-outline" onPress={() => openUpdate(config)} />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

/** Dismissible notice when a newer build exists but the installed one is still supported. */
export function UpdatePrompt() {
  const config = useAppConfig();
  const { t, colors } = useSettings();
  const [dismissed, setDismissed] = useState(false);
  const show =
    !!config &&
    !dismissed &&
    isVersionBelow(installedVersion, config.latestVersion) &&
    !isVersionBelow(installedVersion, config.minVersion);
  if (!show || !config) return null;
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
      accessibilityRole="alert"
    >
      <View style={styles.bannerText}>
        <AppText variant="bodyStrong" color={colors.primary}>
          {t('updateAvailable')}
        </AppText>
        <AppText variant="caption" muted>
          {config.message || t('updateAvailableBody')}
        </AppText>
      </View>
      {config.updateUrl ? <Button label={t('update')} onPress={() => openUpdate(config)} style={styles.small} /> : null}
      <Button label={t('later')} variant="ghost" onPress={() => setDismissed(true)} style={styles.small} />
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.lg },
  icon: { width: 80, height: 80, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bannerText: { flex: 1, minWidth: 180 },
  small: { minHeight: 40, paddingHorizontal: space.md },
});
