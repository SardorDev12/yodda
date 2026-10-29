import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ConfirmModal } from '@/components/modals';
import { Button, EmptyState, ErrorState, Loading, Screen, TextField } from '@/components/ui';
import { deleteCard, getCard, updateCardText } from '@/data/library';
import { useRefetch } from '@/lib/useRefetch';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useSettings();
  const toast = useToast();
  const { bump } = useDataVersion();
  const { data: card, error, loading, retry } = useRefetch(() => getCard(id), [id]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Fill the form once; later realtime refetches must not clobber what the user is typing.
  useEffect(() => {
    if (card && !hydrated) {
      setQuestion(card.question);
      setAnswer(card.answer);
      setHydrated(true);
    }
  }, [card, hydrated]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/library'));

  const save = async () => {
    if (!question.trim() || !answer.trim()) return setFormError(t('fillBothSides'));
    setSaving(true);
    try {
      await updateCardText(id, question, answer);
      bump();
      toast(t('cardSaved'));
      goBack();
    } catch {
      setFormError(t('genericError'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteCard(id);
      setConfirmingDelete(false);
      bump();
      goBack();
    } catch {
      toast(t('genericError'), 'error');
    }
  };

  if (loading && !card) return <Loading />;
  if (error && !card) return <ErrorState message={error} onRetry={retry} />;
  if (!card) return <EmptyState icon="albums-outline" title={t('noCards')} body={t('genericError')} />;

  return (
    <Screen>
      <TextField
        label={t('question')}
        value={question}
        onChangeText={(v) => {
          setQuestion(v);
          setFormError(null);
        }}
        multiline
        style={{ minHeight: 96, textAlignVertical: 'top' }}
      />
      <TextField
        label={t('answer')}
        value={answer}
        onChangeText={(v) => {
          setAnswer(v);
          setFormError(null);
        }}
        multiline
        style={{ minHeight: 140, textAlignVertical: 'top' }}
        error={formError}
      />
      <View style={{ gap: 12 }}>
        <Button label={t('save')} icon="checkmark" onPress={save} loading={saving} />
        <Button label={t('deleteCard')} icon="trash-outline" variant="ghost" onPress={() => setConfirmingDelete(true)} />
      </View>
      <ConfirmModal
        visible={confirmingDelete}
        title={t('deleteCard')}
        body={t('deleteCardConfirm')}
        confirmLabel={t('delete')}
        destructive
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={remove}
      />
    </Screen>
  );
}
