import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { NameComposer } from '@/components/Composer';
import { ListRow } from '@/components/ListRow';
import { ConfirmModal, RenameModal, RowMenu } from '@/components/modals';
import { Button, EmptyState, ErrorState, Loading, Pill, Screen } from '@/components/ui';
import { createSubject, deleteSubject, getBook, getSubjectsWithCounts, renameSubject } from '@/data/library';
import { useRefetch } from '@/lib/useRefetch';
import type { SubjectWithCounts } from '@/lib/types';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, plural } = useSettings();
  const toast = useToast();
  const { bump } = useDataVersion();
  const book = useRefetch(() => getBook(id), [id]);
  const { data: subjects, error, loading, retry } = useRefetch(() => getSubjectsWithCounts(id), [id]);
  const [renaming, setRenaming] = useState<SubjectWithCounts | null>(null);
  const [deleting, setDeleting] = useState<SubjectWithCounts | null>(null);
  const [busy, setBusy] = useState(false);

  const totalCards = subjects?.reduce((n, s) => n + s.totalCards, 0) ?? 0;

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteSubject(deleting.id);
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
      <Stack.Screen options={{ title: book.data?.name ?? t('books') }} />
      <NameComposer
        placeholder={t('newSubjectPlaceholder')}
        buttonLabel={t('addSubject')}
        onSubmit={async (name) => {
          await createSubject(id, name);
          bump();
        }}
      />

      <Button
        label={t('reviseBook')}
        icon="shuffle"
        variant="secondary"
        disabled={totalCards === 0}
        onPress={() => router.push({ pathname: '/review', params: { mode: 'revise', bookId: id } })}
      />

      {loading && !subjects ? (
        <Loading />
      ) : error && !subjects ? (
        <ErrorState message={error} onRetry={retry} />
      ) : subjects && subjects.length === 0 ? (
        <EmptyState icon="layers-outline" title={t('noSubjects')} body={t('noSubjectsSub')} />
      ) : (
        <View style={{ gap: 12 }}>
          {subjects?.map((s) => (
            <ListRow
              key={s.id}
              icon="layers"
              title={s.name}
              subtitle={plural('cards', s.totalCards)}
              meta={
                <>
                  {s.dueToday > 0 ? <Pill tone="warning" label={t('dueCount', { n: s.dueToday })} /> : null}
                  {s.newCards > 0 ? <Pill tone="primary" label={t('newCount', { n: s.newCards })} /> : null}
                </>
              }
              onPress={() => router.push({ pathname: '/subject/[id]', params: { id: s.id } })}
              trailing={
                <RowMenu
                  items={[
                    { label: t('rename'), icon: 'create-outline', onPress: () => setRenaming(s) },
                    { label: t('delete'), icon: 'trash-outline', destructive: true, onPress: () => setDeleting(s) },
                  ]}
                />
              }
            />
          ))}
        </View>
      )}

      <RenameModal
        visible={!!renaming}
        title={t('renameSubject')}
        initialValue={renaming?.name ?? ''}
        onCancel={() => setRenaming(null)}
        onSubmit={async (name) => {
          await renameSubject(renaming!.id, name);
          setRenaming(null);
          bump();
        }}
      />
      <ConfirmModal
        visible={!!deleting}
        title={t('deleteSubjectTitle', { name: deleting?.name ?? '' })}
        body={t('deleteSubjectBody')}
        confirmLabel={t('delete')}
        destructive
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </Screen>
  );
}
