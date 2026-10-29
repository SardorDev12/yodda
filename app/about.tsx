import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { installedVersion } from '@/components/VersionGate';
import { AppText, Screen, Surface, type IconName } from '@/components/ui';
import { useSettings } from '@/providers/SettingsProvider';
import type { TranslationKey } from '@/i18n/translations';

const SECTIONS: { icon: IconName; title: TranslationKey; body: TranslationKey }[] = [
  { icon: 'heart-outline', title: 'aboutStoryTitle', body: 'aboutStory' },
  { icon: 'repeat-outline', title: 'aboutHowTitle', body: 'aboutHow' },
  { icon: 'trending-down-outline', title: 'aboutCurveTitle', body: 'aboutCurve' },
  { icon: 'shield-checkmark-outline', title: 'aboutPrivacyTitle', body: 'aboutPrivacy' },
];

export default function AboutScreen() {
  const { t, colors } = useSettings();
  return (
    <Screen>
      {SECTIONS.map((s) => (
        <Surface key={s.title}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={s.icon} size={22} color={colors.primary} />
            <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
              {t(s.title)}
            </AppText>
          </View>
          <AppText muted>{t(s.body)}</AppText>
        </Surface>
      ))}
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        {t('version', { v: installedVersion })}
      </AppText>
    </Screen>
  );
}
