import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createBook, createCard, createSubject, listBooks, listSubjects } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { BookWithCounts, SubjectWithCounts } from '@/types';

export default function AddScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [bookId, setBookId] = useState<string | null>(null);
  const [newBookName, setNewBookName] = useState('');
  const [addingBook, setAddingBook] = useState(false);

  const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listBooks(db).then((list) => {
      setBooks(list);
      if (list.length > 0) setBookId(list[0].id);
    });
  }, [db]);

  useEffect(() => {
    if (!bookId) return;
    listSubjects(db, bookId).then((list) => {
      setSubjects(list);
      setSubjectId(list.length > 0 ? list[0].id : null);
    });
  }, [db, bookId]);

  async function handleCreateBook() {
    const name = newBookName.trim();
    if (!name) return;
    const book = await createBook(db, name);
    setBooks((prev) => [...prev, { ...book, unitCount: 0, totalCards: 0, dueToday: 0 }]);
    setBookId(book.id);
    setNewBookName('');
    setAddingBook(false);
  }

  async function handleCreateSubject() {
    const name = newSubjectName.trim();
    if (!name || !bookId) return;
    const subject = await createSubject(db, bookId, name);
    setSubjects((prev) => [...prev, { ...subject, totalCards: 0, dueToday: 0, newCards: 0 }]);
    setSubjectId(subject.id);
    setNewSubjectName('');
    setAddingSubject(false);
  }

  async function handleSave() {
    if (!subjectId || !question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await createCard(db, { subjectId, question, answer });
      setQuestion('');
      setAnswer('');
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const canSave = Boolean(subjectId) && question.trim().length > 0 && answer.trim().length > 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(4) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t('add.book')}</Text>
        <View style={styles.chipRow}>
          {books.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.chip, bookId === b.id && styles.chipActive]}
              onPress={() => setBookId(b.id)}
            >
              <Text style={[styles.chipText, bookId === b.id && styles.chipTextActive]}>{b.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.chipAdd} onPress={() => setAddingBook((v) => !v)}>
            <Text style={styles.chipAddText}>{t('add.newBook')}</Text>
          </Pressable>
        </View>

        {addingBook && (
          <View style={styles.newRow}>
            <TextInput
              style={styles.newInput}
              placeholder={t('add.bookNamePlaceholder')}
              placeholderTextColor={colors.muted}
              value={newBookName}
              onChangeText={setNewBookName}
              autoFocus
              onSubmitEditing={handleCreateBook}
            />
            <Pressable style={styles.newSave} onPress={handleCreateBook}>
              <Text style={styles.newSaveText}>{t('add.add')}</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.label}>{t('add.subject')}</Text>
        <View style={styles.chipRow}>
          {subjects.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.chip, subjectId === s.id && styles.chipActive]}
              onPress={() => setSubjectId(s.id)}
            >
              <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>{s.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.chipAdd} onPress={() => setAddingSubject((v) => !v)} disabled={!bookId}>
            <Text style={styles.chipAddText}>{t('add.newSubject')}</Text>
          </Pressable>
        </View>

        {addingSubject && (
          <View style={styles.newRow}>
            <TextInput
              style={styles.newInput}
              placeholder={t('add.subjectNamePlaceholder')}
              placeholderTextColor={colors.muted}
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
              onSubmitEditing={handleCreateSubject}
            />
            <Pressable style={styles.newSave} onPress={handleCreateSubject}>
              <Text style={styles.newSaveText}>{t('add.add')}</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.label}>{t('add.question')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('add.questionPlaceholder')}
          placeholderTextColor={colors.muted}
          value={question}
          onChangeText={setQuestion}
          multiline
        />

        <Text style={styles.label}>{t('add.answer')}</Text>
        <TextInput
          style={[styles.input, styles.inputTall]}
          placeholder={t('add.answerPlaceholder')}
          placeholderTextColor={colors.muted}
          value={answer}
          onChangeText={setAnswer}
          multiline
        />

        <Pressable style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} disabled={!canSave || saving} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{saving ? t('add.saving') : t('add.save')}</Text>
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
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), marginTop: spacing(1) },
    chip: {
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.text, fontWeight: '600' },
    chipTextActive: { color: '#fff' },
    chipAdd: {
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
    },
    chipAddText: { color: colors.primary, fontWeight: '600' },
    newRow: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(1) },
    newInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(1.5),
      color: colors.text,
    },
    newSave: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing(2),
      justifyContent: 'center',
    },
    newSaveText: { color: '#fff', fontWeight: '700' },
    saveButton: {
      marginTop: spacing(3),
      backgroundColor: colors.primary,
      paddingVertical: spacing(2),
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveButtonDisabled: { backgroundColor: colors.border },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
