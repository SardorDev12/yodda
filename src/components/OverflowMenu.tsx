import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LANGUAGES, type Language } from '@/i18n';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type Scheme } from '@/theme';

const LANGUAGE_LABEL_KEY: Record<Language, string> = {
  uz: 'menu.uzbek',
  ru: 'menu.russian',
  en: 'menu.english',
};

export function OverflowMenu() {
  const { colors, language, scheme, setLanguage, setScheme, t } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        hitSlop={12}
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityLabel={t('menu.language')}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t('menu.language')}</Text>
              <View style={styles.optionRow}>
                {LANGUAGES.map((lng) => (
                  <Pressable
                    key={lng}
                    style={[
                      styles.option,
                      { borderColor: colors.border },
                      language === lng && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setLanguage(lng)}
                  >
                    <Text style={[styles.optionText, { color: language === lng ? '#fff' : colors.text }]}>
                      {t(LANGUAGE_LABEL_KEY[lng])}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: spacing(1.5) }]}>
                {t('menu.appearance')}
              </Text>
              <View style={styles.optionRow}>
                {(['light', 'dark'] as Scheme[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[
                      styles.option,
                      { borderColor: colors.border },
                      scheme === s && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setScheme(s)}
                  >
                    <Text style={[styles.optionText, { color: scheme === s ? '#fff' : colors.text }]}>
                      {t(s === 'light' ? 'menu.light' : 'menu.dark')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={[styles.doneButton, { backgroundColor: colors.primarySoft }]} onPress={() => setOpen(false)}>
                <Text style={[styles.doneText, { color: colors.primary }]}>{t('menu.done')}</Text>
              </Pressable>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { paddingHorizontal: spacing(1), paddingVertical: spacing(0.5) },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%' },
  sheet: {
    margin: spacing(1.5),
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing(2.5),
    gap: spacing(1),
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  option: { paddingHorizontal: spacing(1.75), paddingVertical: spacing(1), borderRadius: 999, borderWidth: 1 },
  optionText: { fontWeight: '600', fontSize: 14 },
  doneButton: {
    marginTop: spacing(2),
    paddingVertical: spacing(1.5),
    borderRadius: radius.md,
    alignItems: 'center',
  },
  doneText: { fontWeight: '700', fontSize: 15 },
});
