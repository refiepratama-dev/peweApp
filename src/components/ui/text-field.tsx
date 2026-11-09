import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: ReactNode;
  /** Field password: teks disembunyikan + tombol mata */
  secret?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

// React 19: ref cukup jadi prop biasa (tanpa forwardRef)
export function TextField({ label, error, hint, icon, secret, style, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.ink : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      <View style={[styles.box, { borderColor }]}>
        {icon}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.ink}
          secureTextEntry={secret && hidden}
          autoCapitalize={secret ? 'none' : rest.autoCapitalize}
          autoCorrect={secret ? false : rest.autoCorrect}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[typography.body, styles.input, style]}
          {...rest}
        />
        {secret && (
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan' : 'Sembunyikan'}
            onPress={() => setHidden((h) => !h)}
          >
            {hidden ? (
              <Eye size={20} color={colors.textSecondary} />
            ) : (
              <EyeOff size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
      </View>
      {error ? (
        <Animated.Text
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={[typography.caption, { color: colors.danger }]}
        >
          {error}
        </Animated.Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  label: { color: colors.textSecondary },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.surfaceAlt,
  },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: spacing.md },
});
