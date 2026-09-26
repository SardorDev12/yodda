import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(4) }]}
    >
      <Text style={styles.hero}>{t('about.hero')}</Text>
      <Text style={styles.tagline}>{t('about.tagline')}</Text>

      <Section title={t('about.whatTitle')} styles={styles}>
        <Text style={styles.paragraph}>{t('about.whatBody')}</Text>
      </Section>

      <Section title={t('about.howTitle')} styles={styles}>
        <Text style={styles.paragraph}>{t('about.howBody1')}</Text>
        <Text style={styles.paragraph}>{t('about.howBody2')}</Text>
      </Section>

      <Section title={t('about.curveTitle')} styles={styles}>
        <Text style={styles.paragraph}>{t('about.curveBody1')}</Text>
        <Text style={styles.paragraph}>{t('about.curveBody2')}</Text>
      </Section>

      <Section title={t('about.usefulTitle')} styles={styles}>
        <Text style={styles.paragraph}>{t('about.usefulBody')}</Text>
      </Section>

      <Section title={t('about.privacyTitle')} styles={styles}>
        <Text style={styles.paragraph}>{t('about.privacyBody')}</Text>
      </Section>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing(2.5), gap: spacing(2) },
    hero: { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing(1) },
    tagline: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: spacing(1) },
    section: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing(1.25),
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
    paragraph: { fontSize: 14.5, color: colors.text, lineHeight: 21 },
  });
}
