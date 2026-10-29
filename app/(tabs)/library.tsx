import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { NameComposer } from '@/components/Composer';
import { ListRow } from '@/components/ListRow';
import { ConfirmModal, RenameModal, RowMenu } from '@/components/modals';
import { EmptyState, ErrorState, Loading, Pill, Screen } from '@/components/ui';
import { createBook, deleteBook, getBooksWithCounts, renameBook } from '@/data/library';
import { useRefetch } from '@/lib/useRefetch';
import type { BookWithCounts } from '@/lib/types';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';

export default function LibraryScreen() {
  const router = useRouter();
  const { t, plural } = useSettings();
  const toast = useToast();
  const { bump } = useDataVersion();
  const { data: books, error, loading, retry } = useRefetch(getBooksWithCounts);
  const [renaming, setRenaming] = useState<BookWithCounts | null>(null);
  const [deleting, setDeleting] = useState<BookWithCounts | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteBook(deleting.id);
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
      <NameComposer
        placeholder={t('newBookPlaceholder')}
        buttonLabel={t('addBook')}
        onSubmit={async (name) => {
          await createBook(name);
          bump();
        }}
      />

      {loading && !books ? (
        <Loading />
      ) : error && !books ? (
        <ErrorState message={error} onRetry={retry} />
      ) : books && books.length === 0 ? (
        <EmptyState icon="library-outline" title={t('noBooks')} body={t('noBooksSub')} />
      ) : (
        <View style={{ gap: 12 }}>
          {books?.map((b) => (
            <ListRow
              key={b.id}
              icon="book"
              title={b.name}
              subtitle={`${plural('units', b.unitCount)} · ${plural('cards', b.totalCards)}`}
              meta={b.dueToday > 0 ? <Pill tone="warning" label={t('dueCount', { n: b.dueToday })} /> : null}
              onPress={() => router.push({ pathname: '/book/[id]', params: { id: b.id } })}
              trailing={
                <RowMenu
                  items={[
                    { label: t('rename'), icon: 'create-outline', onPress: () => setRenaming(b) },
                    { label: t('delete'), icon: 'trash-outline', destructive: true, onPress: () => setDeleting(b) },
                  ]}
                />
              }
            />
          ))}
        </View>
      )}

      <RenameModal
        visible={!!renaming}
        title={t('renameBook')}
        initialValue={renaming?.name ?? ''}
        onCancel={() => setRenaming(null)}
        onSubmit={async (name) => {
          await renameBook(renaming!.id, name);
          setRenaming(null);
          bump();
        }}
      />
      <ConfirmModal
        visible={!!deleting}
        title={t('deleteBookTitle', { name: deleting?.name ?? '' })}
        body={t('deleteBookBody')}
        confirmLabel={t('delete')}
        destructive
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </Screen>
  );
}
