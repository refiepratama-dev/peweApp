import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ImageOff, ImagePlus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, spacing, typography } from '@/theme';
import { ImageViewer } from './image-viewer';
import { deleteImage, listImages, renameImage, uploadImage, type VaultImage } from './images-api';
import { useDecryptedImage } from './use-decrypted-image';

const GAP = spacing.sm;
const MAX_PICK = 10;

function Thumbnail({
  image,
  size,
  onPress,
  onLongPress,
}: {
  image: VaultImage;
  size: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { uri, failed } = useDecryptedImage(image);
  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={image.name}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.thumb, { width: size, height: size }, pressed && { opacity: 0.8 }]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} cachePolicy="none" />
      ) : failed ? (
        <ImageOff size={20} color={colors.textMuted} />
      ) : (
        <ActivityIndicator color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const baseName = (fileName: string | null | undefined, fallback: string) =>
  fileName ? fileName.replace(/\.[^.]+$/, '') : fallback;

/** Seksi Gambar di detail entry: grid, tambah (galeri/kamera), lihat, ganti nama, hapus */
export function ImagesSection({ entryId }: { entryId: string }) {
  const { workspace, dataKey } = useVault();
  const [images, setImages] = useState<VaultImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<VaultImage | null>(null);

  const columns = width >= 600 ? 5 : 3;
  const size = width ? (width - GAP * (columns - 1)) / columns : 0;

  const load = useCallback(async () => {
    try {
      setImages(await listImages(entryId));
    } catch (e) {
      Alert.alert('Gagal memuat gambar', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setLoaded(true);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(assets: ImagePicker.ImagePickerAsset[]) {
    if (!workspace || !dataKey || !assets.length) return;
    setUploading({ done: 0, total: assets.length });
    let failed = 0;
    for (const [i, asset] of assets.entries()) {
      try {
        const saved = await uploadImage({
          workspaceId: workspace.id,
          entryId,
          key: dataKey,
          uri: asset.uri,
          name: baseName(asset.fileName, `Gambar ${images.length + i + 1}`),
          orderIndex: images.length + i,
        });
        setImages((list) => [...list, saved]);
      } catch {
        failed++;
      }
      setUploading({ done: i + 1, total: assets.length });
    }
    setUploading(null);
    if (failed) Alert.alert('Sebagian gagal', `${failed} gambar gagal diunggah. Cek koneksi lalu coba lagi.`);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PICK,
      quality: 1,
    });
    if (!result.canceled) upload(result.assets);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin kamera ditolak', 'Aktifkan izin kamera untuk Pewe di pengaturan HP.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) upload(result.assets);
  }

  function handleAdd() {
    Alert.alert('Tambah gambar', undefined, [
      { text: 'Pilih dari galeri', onPress: pickFromLibrary },
      { text: 'Ambil foto', onPress: takePhoto },
      { text: 'Batal', style: 'cancel' },
    ]);
  }

  function confirmDelete(image: VaultImage) {
    Alert.alert(`Hapus "${image.name}"?`, 'Gambar akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteImage(image);
            setImages((list) => {
              const next = list.filter((i) => i.id !== image.id);
              setViewIndex((current) => (current == null || !next.length ? null : Math.min(current, next.length - 1)));
              return next;
            });
          } catch (e) {
            Alert.alert('Gagal menghapus', e instanceof Error ? e.message : 'Coba lagi');
          }
        },
      },
    ]);
  }

  function openActions(image: VaultImage) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(image.name, undefined, [
      { text: 'Ganti nama', onPress: () => setRenaming(image) },
      { text: 'Hapus', style: 'destructive', onPress: () => confirmDelete(image) },
      { text: 'Batal', style: 'cancel' },
    ]);
  }

  async function handleRename(name: string) {
    if (!renaming) return;
    try {
      await renameImage(renaming.id, name);
      setImages((list) => list.map((i) => (i.id === renaming.id ? { ...i, name } : i)));
      setRenaming(null);
    } catch (e) {
      Alert.alert('Gagal mengganti nama', e instanceof Error ? e.message : 'Coba lagi');
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[typography.subheading, { color: colors.textPrimary, flex: 1 }]}>
          Gambar <Text style={{ color: colors.textMuted }}>{images.length}</Text>
        </Text>
        {uploading && (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Mengunggah {uploading.done}/{uploading.total}…
          </Text>
        )}
      </View>

      <View style={styles.grid} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {size > 0 &&
          images.map((image, index) => (
            <Animated.View
              key={image.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.duration(200)}
            >
              <Thumbnail
                image={image}
                size={size}
                onPress={() => setViewIndex(index)}
                onLongPress={() => openActions(image)}
              />
            </Animated.View>
          ))}
        {size > 0 && (
          <Animated.View layout={LinearTransition.duration(200)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tambah gambar"
              disabled={!!uploading || !loaded}
              onPress={handleAdd}
              style={({ pressed }) => [styles.thumb, styles.add, { width: size, height: size }, pressed && { opacity: 0.6 }]}
            >
              {uploading ? (
                <ActivityIndicator color={colors.textSecondary} />
              ) : (
                <>
                  <ImagePlus size={22} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Tambah</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>
      {loaded && images.length > 0 && (
        <Text style={[typography.caption, { color: colors.textMuted }]}>Tekan lama gambar untuk ganti nama / hapus</Text>
      )}

      <ImageViewer
        images={images}
        index={viewIndex}
        onIndexChange={setViewIndex}
        onClose={() => setViewIndex(null)}
        onRename={setRenaming}
        onDelete={confirmDelete}
      />
      <PromptDialog
        visible={!!renaming}
        title="Ganti nama gambar"
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  thumb: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    gap: 4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
});
