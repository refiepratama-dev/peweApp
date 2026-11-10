import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { FilePlus, FileText, MoreVertical, Share2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import {
  deleteDocument,
  formatSize,
  listDocuments,
  MAX_DOCUMENT_BYTES,
  openDocumentFile,
  renameDocument,
  uploadDocument,
  type VaultDocument,
} from './documents-api';

function RowAction({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.border }]}
    >
      {children}
    </Pressable>
  );
}

/** Seksi Dokumen di detail entry: import PDF, buka/preview, bagikan ke klien, ganti nama, hapus */
export function DocumentsSection({ entryId }: { entryId: string }) {
  const { workspace, dataKey } = useVault();
  const [docs, setDocs] = useState<VaultDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<VaultDocument | null>(null);

  const load = useCallback(async () => {
    try {
      setDocs(await listDocuments(entryId));
    } catch (e) {
      Alert.alert('Gagal memuat dokumen', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setLoaded(true);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleImport() {
    if (!workspace || !dataKey) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const assets = result.assets;
    setUploading({ done: 0, total: assets.length });
    const failures: string[] = [];
    for (const [i, asset] of assets.entries()) {
      try {
        if (asset.size && asset.size > MAX_DOCUMENT_BYTES) {
          throw new Error(`lebih dari ${formatSize(MAX_DOCUMENT_BYTES)}`);
        }
        const saved = await uploadDocument({
          workspaceId: workspace.id,
          entryId,
          key: dataKey,
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/pdf',
          orderIndex: docs.length + i,
        });
        setDocs((list) => [...list, saved]);
      } catch (e) {
        failures.push(`${asset.name}: ${e instanceof Error ? e.message : 'gagal'}`);
      } finally {
        // Salinan dari picker sudah tidak dibutuhkan
        try {
          new File(asset.uri).delete();
        } catch {}
      }
      setUploading({ done: i + 1, total: assets.length });
    }
    setUploading(null);
    if (failures.length) Alert.alert('Sebagian gagal diunggah', failures.join('\n'));
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function withFile(doc: VaultDocument, action: (file: File) => Promise<void>) {
    if (!dataKey) return;
    setBusyId(doc.id);
    try {
      const file = await openDocumentFile(doc, dataKey);
      await action(file);
    } catch (e) {
      Alert.alert('Gagal membuka dokumen', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setBusyId(null);
    }
  }

  const share = (doc: VaultDocument) =>
    withFile(doc, async (file) => {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Fitur bagikan tidak tersedia di perangkat ini');
      await Sharing.shareAsync(file.uri, {
        mimeType: doc.mime_type,
        UTI: doc.mime_type === 'application/pdf' ? 'com.adobe.pdf' : undefined,
        dialogTitle: `Bagikan ${doc.name}`,
      });
    });

  const open = (doc: VaultDocument) =>
    withFile(doc, async (file) => {
      if (await File.canPreview(file)) await File.preview(file, { title: doc.name });
      else
        await Sharing.shareAsync(file.uri, { mimeType: doc.mime_type, UTI: 'com.adobe.pdf', dialogTitle: doc.name });
    });

  function confirmDelete(doc: VaultDocument) {
    Alert.alert(`Hapus "${doc.name}"?`, 'Dokumen akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc);
            setDocs((list) => list.filter((d) => d.id !== doc.id));
          } catch (e) {
            Alert.alert('Gagal menghapus', e instanceof Error ? e.message : 'Coba lagi');
          }
        },
      },
    ]);
  }

  function openActions(doc: VaultDocument) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(doc.name, undefined, [
      { text: 'Buka', onPress: () => open(doc) },
      { text: 'Bagikan ke klien', onPress: () => share(doc) },
      { text: 'Ganti nama', onPress: () => setRenaming(doc) },
      { text: 'Hapus', style: 'destructive', onPress: () => confirmDelete(doc) },
      { text: 'Batal', style: 'cancel' },
    ]);
  }

  async function handleRename(name: string) {
    if (!renaming) return;
    try {
      await renameDocument(renaming.id, name);
      setDocs((list) => list.map((d) => (d.id === renaming.id ? { ...d, name } : d)));
      setRenaming(null);
    } catch (e) {
      Alert.alert('Gagal mengganti nama', e instanceof Error ? e.message : 'Coba lagi');
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[typography.subheading, { color: colors.textPrimary, flex: 1 }]}>
          Dokumen <Text style={{ color: colors.textMuted }}>{docs.length}</Text>
        </Text>
        {uploading && (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Mengunggah {uploading.done}/{uploading.total}…
          </Text>
        )}
      </View>

      {docs.length > 0 && (
        <View style={[styles.card, shadow.soft]}>
          {docs.map((doc, i) => (
            <Animated.View
              key={doc.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
              style={i > 0 && styles.divider}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => open(doc)}
                onLongPress={() => openActions(doc)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.pdfIcon}>
                  {busyId === doc.id ? (
                    <ActivityIndicator color={colors.danger} size="small" />
                  ) : (
                    <FileText size={18} color={colors.danger} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {[
                      formatSize(doc.size),
                      new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <RowAction label="Bagikan" onPress={() => share(doc)}>
                  <Share2 size={18} color={colors.textPrimary} />
                </RowAction>
                <RowAction label="Lainnya" onPress={() => openActions(doc)}>
                  <MoreVertical size={18} color={colors.textPrimary} />
                </RowAction>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      <Animated.View layout={LinearTransition.duration(200)}>
        <Pressable
          accessibilityRole="button"
          disabled={!!uploading || !loaded}
          onPress={handleImport}
          style={({ pressed }) => [styles.add, pressed && { opacity: 0.6 }]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <FilePlus size={20} color={colors.textSecondary} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Import PDF</Text>
            </>
          )}
        </Pressable>
      </Animated.View>

      <PromptDialog
        visible={!!renaming}
        title="Ganti nama dokumen"
        label="Nama"
        initialValue={renaming?.name}
        onCancel={() => setRenaming(null)}
        onConfirm={handleRename}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  pdfIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: `${colors.danger}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});
