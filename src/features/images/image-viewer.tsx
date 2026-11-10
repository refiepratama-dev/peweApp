import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@/theme';
import type { VaultImage } from './images-api';
import { useDecryptedImage } from './use-decrypted-image';

const MAX_SCALE = 4;
const SPRING = { damping: 20, stiffness: 220 };

/** Gambar dengan pinch-zoom, geser saat diperbesar, dan ketuk 2x untuk zoom */
function ZoomableImage({ image }: { image: VaultImage }) {
  const { uri, failed } = useDecryptedImage(image);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Reset zoom saat pindah gambar
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  }, [image.id, scale, savedScale, tx, ty, savedTx, savedTy]);

  const reset = () => {
    'worklet';
    scale.value = withSpring(1, SPRING);
    tx.value = withSpring(0, SPRING);
    ty.value = withSpring(0, SPRING);
    savedScale.value = 1;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const pinch = usePinchGesture({
    onUpdate: (e) => {
      'worklet';
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.8), MAX_SCALE);
    },
    onDeactivate: () => {
      'worklet';
      if (scale.value <= 1) reset();
      else savedScale.value = scale.value;
    },
  });

  const pan = usePanGesture({
    minPointers: 1,
    onUpdate: (e) => {
      'worklet';
      if (savedScale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    },
    onDeactivate: () => {
      'worklet';
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      if (savedScale.value > 1) reset();
      else {
        scale.value = withSpring(2.5, SPRING);
        savedScale.value = 2.5;
      }
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  if (failed) {
    return <Text style={[typography.body, { color: colors.danger }]}>Gambar gagal dibuka</Text>;
  }
  if (!uri) return <ActivityIndicator color="#FFFFFF" />;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.imageWrap, style]}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" transition={150} cachePolicy="none" />
      </Animated.View>
    </GestureDetector>
  );
}

type ImageViewerProps = {
  images: VaultImage[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onRename: (image: VaultImage) => void;
  onDelete: (image: VaultImage) => void;
};

function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

export function ImageViewer({ images, index, onIndexChange, onClose, onRename, onDelete }: ImageViewerProps) {
  const image = index != null ? images[index] : undefined;

  return (
    <Modal visible={!!image} animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <GestureHandlerRootView style={styles.root}>
        {image && (
          <SafeAreaView style={styles.root}>
            <View style={styles.top}>
              <RoundButton label="Tutup" onPress={onClose}>
                <X size={22} color="#FFFFFF" />
              </RoundButton>
              <View style={styles.titleBox}>
                <Text style={[typography.title, { color: '#FFFFFF' }]} numberOfLines={1}>
                  {image.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textOnDarkMuted }]}>
                  {index! + 1} / {images.length}
                </Text>
              </View>
              <RoundButton label="Ganti nama" onPress={() => onRename(image)}>
                <Pencil size={18} color="#FFFFFF" />
              </RoundButton>
              <RoundButton label="Hapus" onPress={() => onDelete(image)}>
                <Trash2 size={18} color="#FF6B6B" />
              </RoundButton>
            </View>

            <Animated.View key={image.id} entering={FadeIn.duration(150)} style={styles.stage}>
              <ZoomableImage image={image} />
            </Animated.View>

            {images.length > 1 && (
              <View style={styles.bottom}>
                <RoundButton label="Sebelumnya" onPress={() => onIndexChange((index! - 1 + images.length) % images.length)}>
                  <ChevronLeft size={24} color="#FFFFFF" />
                </RoundButton>
                <Text style={[typography.caption, { color: colors.textOnDarkMuted }]}>
                  Cubit untuk zoom · ketuk 2x
                </Text>
                <RoundButton label="Berikutnya" onPress={() => onIndexChange((index! + 1) % images.length)}>
                  <ChevronRight size={24} color="#FFFFFF" />
                </RoundButton>
              </View>
            )}
          </SafeAreaView>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, zIndex: 2 },
  titleBox: { flex: 1, alignItems: 'center' },
  round: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imageWrap: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
