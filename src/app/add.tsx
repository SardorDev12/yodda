import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createCard, createSubject, listSubjects } from '@/db/queries';
import { pushCard, pushNewSubject } from '@/lib/sync';
import { useAuth } from '@/store/auth-context';
import { colors, radius, spacing } from '@/theme';
import type { SubjectWithCounts } from '@/types';

export default function AddScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSubjects(db).then((list) => {
      setSubjects(list);
      if (list.length > 0) setSubjectId(list[0].id);
    });
  }, [db]);

  async function handleCreateSubject() {
    const name = newSubjectName.trim();
    if (!name) return;
    const subject = await createSubject(db, name);
    if (user) pushNewSubject(subject, user.id).catch(() => {});
    setSubjects((prev) => [...prev, { ...subject, totalCards: 0, dueToday: 0, newCards: 0 }]);
    setSubjectId(subject.id);
    setNewSubjectName('');
    setAddingSubject(false);
  }

  async function handleSave() {
    if (!subjectId || !question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      const card = await createCard(db, { subjectId, question, answer });
      if (user) pushCard(card, user.id).catch(() => {});
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.input}
          placeholder="What is encapsulation?"
          placeholderTextColor={colors.muted}
          value={question}
          onChangeText={setQuestion}
          multiline
        />

        <Text style={styles.label}>Answer</Text>
        <TextInput
          style={[styles.input, styles.inputTall]}
          placeholder="Bundling data and methods while controlling access to internal state."
          placeholderTextColor={colors.muted}
          value={answer}
          onChangeText={setAnswer}
          multiline
        />

        <Text style={styles.label}>Subject</Text>
        <View style={styles.subjectRow}>
          {subjects.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.subjectChip, subjectId === s.id && styles.subjectChipActive]}
              onPress={() => setSubjectId(s.id)}
            >
              <Text style={[styles.subjectChipText, subjectId === s.id && styles.subjectChipTextActive]}>{s.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.subjectChipAdd} onPress={() => setAddingSubject((v) => !v)}>
            <Text style={styles.subjectChipAddText}>+ New</Text>
          </Pressable>
        </View>

        {addingSubject && (
          <View style={styles.newSubjectRow}>
            <TextInput
              style={styles.newSubjectInput}
              placeholder="Subject name"
              placeholderTextColor={colors.muted}
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              autoFocus
              onSubmitEditing={handleCreateSubject}
            />
            <Pressable style={styles.newSubjectSave} onPress={handleCreateSubject}>
              <Text style={styles.newSubjectSaveText}>Add</Text>
            </Pressable>
          </View>
        )}

        <Pressable style={[styles.saveButton, !canSave && styles.saveButtonDisabled]} disabled={!canSave || saving} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), marginTop: spacing(1) },
  subjectChip: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subjectChipText: { color: colors.text, fontWeight: '600' },
  subjectChipTextActive: { color: '#fff' },
  subjectChipAdd: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  subjectChipAddText: { color: colors.primary, fontWeight: '600' },
  newSubjectRow: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(1) },
  newSubjectInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(1.5),
    color: colors.text,
  },
  newSubjectSave: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    justifyContent: 'center',
  },
  newSubjectSaveText: { color: '#fff', fontWeight: '700' },
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
