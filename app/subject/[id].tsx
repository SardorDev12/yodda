import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { ListRow } from '@/components/ListRow';
import { ConfirmModal, RowMenu } from '@/components/modals';
import { Button, EmptyState, ErrorState, Loading, Pill, Screen, SectionTitle, Surface, TextField, type TextInputRef } from '@/components/ui';
import { createCard, deleteCard, getCards, getSubject } from '@/data/library';
import { useRefetch } from '@/lib/useRefetch';
import type { Card } from '@/lib/types';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';

const statusTone = { new: 'primary', learning: 'warning', review: 'neutral', mature: 'success' } as const;

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, plural } = useSettings();
  const toast = useToast();
  const { bump } = useDataVersion();
  const subject = useRefetch(() => getSubject(id), [id]);
  const { data: cards, error, loading, retry } = useRefetch(() => getCards(id), [id]);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const [busy, setBusy] = useState(false);
  const questionRef = useRef<TextInputRef>(null);
  const answerRef = useRef<TextInputRef>(null);

  const add = async () => {
    if (!question.trim() || !answer.trim()) return setFormError(t('fillBothSides'));
    setAdding(true);
    try {
      await createCard(id, question, answer);
      setQuestion('');
      setAnswer('');
      setFormError(null);
      bump();
      toast(t('cardAdded'));
      // Ready for rapid entry of the next card.
      questionRef.current?.focus();
    } catch {
      setFormError(t('genericError'));
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteCard(deleting.id);
      setDeleting(null);
      bump();
    } catch {
      toast(t('genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: subject.data?.name ?? t('library') }} />

      <Surface>
        <SectionTitle>{t('newCard')}</SectionTitle>
        <TextField
          ref={questionRef}
          label={t('question')}
          value={question}
          onChangeText={(v) => {
            setQuestion(v);
            setFormError(null);
          }}
          multiline
          numberOfLines={2}
          style={{ minHeight: 56, textAlignVertical: 'top' }}
          blurOnSubmit
          returnKeyType="next"
          onSubmitEditing={() => answerRef.current?.focus()}
        />
        <TextField
          ref={answerRef}
          label={t('answer')}
          value={answer}
          onChangeText={(v) => {
            setAnswer(v);
            setFormError(null);
          }}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
          error={formError}
        />
        <Button label={t('addCard')} icon="add" onPress={add} loading={adding} />
      </Surface>

      <Button
        label={t('reviseSubject')}
        icon="shuffle"
        variant="secondary"
        disabled={!cards?.length}
        onPress={() => router.push({ pathname: '/review', params: { mode: 'revise', subjectId: id } })}
      />

      {loading && !cards ? (
        <Loading />
      ) : error && !cards ? (
        <ErrorState message={error} onRetry={retry} />
      ) : cards && cards.length === 0 ? (
        <EmptyState icon="albums-outline" title={t('noCards')} body={t('noCardsSub')} />
      ) : (
        <View style={{ gap: 12 }}>
          <SectionTitle>{plural('cards', cards?.length ?? 0)}</SectionTitle>
          {cards?.map((c) => (
            <ListRow
              key={c.id}
              title={c.question}
              titleLines={2}
              subtitle={c.answer}
              meta={<Pill tone={statusTone[c.status]} label={c.status} />}
              onPress={() => router.push({ pathname: '/edit-card/[id]', params: { id: c.id } })}
              trailing={
                <RowMenu
                  items={[
                    {
                      label: t('edit'),
                      icon: 'create-outline',
                      onPress: () => router.push({ pathname: '/edit-card/[id]', params: { id: c.id } }),
                    },
                    { label: t('delete'), icon: 'trash-outline', destructive: true, onPress: () => setDeleting(c) },
                  ]}
                />
              }
            />
          ))}
        </View>
      )}

      <ConfirmModal
        visible={!!deleting}
        title={t('deleteCard')}
        body={t('deleteCardConfirm')}
        confirmLabel={t('delete')}
        destructive
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </Screen>
  );
}
