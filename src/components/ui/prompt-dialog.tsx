import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { Button } from './button';
import { TextField } from './text-field';

type PromptDialogProps = {
  visible: boolean;
  title: string;
  label?: string;
  initialValue?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void | Promise<void>;
};

/** Dialog input teks satu baris (Alert.prompt hanya ada di iOS, jadi dibuat sendiri) */
export function PromptDialog({
  visible,
  title,
  label,
  initialValue = '',
  confirmText = 'Simpan',
  onCancel,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  async function confirm() {
    if (!value.trim()) return;
    setBusy(true);
    try {
      await onConfirm(value.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeIn.duration(150)} style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
          <Animated.View entering={ZoomIn.duration(180)} style={[styles.card, shadow.strong]}>
            <Text style={[typography.subheading, { color: colors.textPrimary }]}>{title}</Text>
            <TextField
              label={label}
              value={value}
              onChangeText={setValue}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={confirm}
            />
            <View style={styles.actions}>
              <Button title="Batal" variant="ghost" onPress={onCancel} style={styles.flex} />
              <Button title={confirmText} loading={busy} disabled={!value.trim()} onPress={confirm} style={styles.flex} />
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
