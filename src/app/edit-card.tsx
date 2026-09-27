import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteCard, getCard, updateCard } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCard(db, id).then((card) => {
      if (card) {
        setQuestion(card.question);
        setAnswer(card.answer);
      }
    });
  }, [db, id]);

  async function handleSave() {
    if (!id || !question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await updateCard(db, id, { question, answer });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert(t('edit.deleteConfirmTitle'), t('edit.deleteConfirmBody'), [
      { text: t('edit.cancel'), style: 'cancel' },
      {
        text: t('edit.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCard(db, id);
          router.back();
        },
      },
    ]);
  }

  const canSave = question.trim().length > 0 && answer.trim().length > 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(4) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('add.question')}</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          value={question}
          onChangeText={setQuestion}
          multiline
        />

        <Text style={styles.label}>{t('add.answer')}</Text>
        <TextInput
          style={[styles.input, styles.inputTall]}
          placeholderTextColor={colors.muted}
          value={answer}
          onChangeText={setAnswer}
          multiline
        />

        <Pressable style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} disabled={!canSave || saving} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{saving ? t('edit.saving') : t('edit.save')}</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>{t('edit.delete')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing(2.5), gap: spacing(1) },
    label: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: spacing(2) },
    input: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(1.5),
      fontSize: 16,
      color: colors.text,
      marginTop: spacing(1),
    },
    inputTall: { minHeight: 96, textAlignVertical: 'top' },
    saveButton: {
      marginTop: spacing(3),
      backgroundColor: colors.primary,
      paddingVertical: spacing(2),
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveButtonDisabled: { backgroundColor: colors.border },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    deleteButton: {
      marginTop: spacing(1.5),
      paddingVertical: spacing(1.5),
      borderRadius: radius.md,
      alignItems: 'center',
    },
    deleteButtonText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  });
}
