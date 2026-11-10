import { router, useFocusEffect } from 'expo-router';
import { KeyRound, LogOut, Mail, UserMinus, UserPlus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { addMember, listMembers, removeMember, type Member } from '@/features/team/team-api';
import { useAuth } from '@/lib/auth/auth-provider';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, shadow, spacing, typography } from '@/theme';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const enter = (delay: number) => FadeInDown.duration(350).delay(delay).easing(Easing.out(Easing.cubic));

export default function TeamScreen() {
  const { session } = useAuth();
  const { workspace, isOwner, leaveWorkspace } = useVault();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      setMembers(await listMembers(workspace.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat anggota');
    } finally {
      setLoaded(true);
    }
  }, [workspace]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleAdd() {
    const value = email.trim().toLowerCase();
    if (!isEmail(value)) return setEmailError('Format email belum benar');
    if (members.some((m) => m.email.toLowerCase() === value)) return setEmailError('Sudah jadi anggota tim');
    setAdding(true);
    try {
      await addMember(workspace!.id, value);
      setEmail('');
      setEmailError(null);
      await load();
      Alert.alert(
        'Anggota ditambahkan',
        `Sekarang bagikan passphrase tim ke ${value} secara langsung (bukan lewat chat grup). Setelah itu dia bisa membuka vault.`,
      );
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Gagal menambah anggota');
    } finally {
      setAdding(false);
    }
  }

  function handleRemove(member: Member) {
    Alert.alert(
      `Keluarkan ${member.full_name || member.email}?`,
      'Dia tidak bisa lagi mengakses data tim. Disarankan ganti passphrase tim setelah ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluarkan',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(workspace!.id, member.user_id);
              setMembers((list) => list.filter((m) => m.user_id !== member.user_id));
              Alert.alert('Anggota dikeluarkan', 'Ganti passphrase tim sekarang?', [
                { text: 'Nanti', style: 'cancel' },
                { text: 'Ganti', onPress: () => router.push('/team/passphrase') },
              ]);
            } catch (e) {
              Alert.alert('Gagal', e instanceof Error ? e.message : 'Coba lagi');
            }
          },
        },
      ],
    );
  }

  function handleLeave() {
    Alert.alert(
      `Keluar dari ${workspace?.name}?`,
      'Kamu tidak bisa lagi mengakses data tim ini sampai owner menambahkanmu lagi.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveWorkspace();
            } catch (e) {
              Alert.alert('Gagal keluar', e instanceof Error ? e.message : 'Coba lagi');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.ink} />}
      >
        <ScreenHeader title="Tim" />

        <Animated.View entering={enter(0)} style={{ gap: 2 }}>
          <Text style={[typography.heading, { color: colors.textPrimary }]}>{workspace?.name}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {members.length} anggota · kamu {isOwner ? 'owner' : 'anggota'}
          </Text>
        </Animated.View>

        {isOwner && (
          <Animated.View entering={enter(60)} style={[styles.card, shadow.soft]}>
            <Text style={[typography.title, { color: colors.textPrimary }]}>Tambah anggota</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Teman harus sudah daftar akun di Pewe dulu.
            </Text>
            <TextField
              placeholder="email@teman.com"
              icon={<Mail size={18} color={colors.textSecondary} />}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError(null);
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Button
              title="Tambah ke tim"
              loading={adding}
              onPress={handleAdd}
              icon={<UserPlus size={18} color={colors.textOnDark} />}
            />
          </Animated.View>
        )}

        <Animated.View entering={enter(120)} style={{ gap: spacing.sm }}>
          <Text style={[typography.subheading, { color: colors.textPrimary }]}>Anggota</Text>
          {error ? (
            <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
          ) : !loaded ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <View style={[styles.card, shadow.soft, { paddingVertical: 0, gap: 0 }]}>
              {members.map((m, i) => {
                const isMe = m.user_id === session?.user.id;
                return (
                  <Animated.View
                    key={m.user_id}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition.duration(200)}
                    style={[styles.member, i > 0 && styles.divider]}
                  >
                    <Avatar name={m.full_name || m.email} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyMedium, { color: colors.textPrimary }]} numberOfLines={1}>
                        {m.full_name || m.email}
                        {isMe ? ' (kamu)' : ''}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                        {m.email}
                      </Text>
                    </View>
                    {m.role === 'owner' ? (
                      <View style={styles.badge}>
                        <Text style={[typography.label, { color: colors.textOnDark }]}>Owner</Text>
                      </View>
                    ) : (
                      isOwner && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Keluarkan ${m.email}`}
                          hitSlop={6}
                          onPress={() => handleRemove(m)}
                          style={({ pressed }) => [styles.remove, pressed && { opacity: 0.6 }]}
                        >
                          <UserMinus size={18} color={colors.danger} />
                        </Pressable>
                      )
                    )}
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={enter(180)} style={{ gap: spacing.sm }}>
          {isOwner ? (
            <Button
              title="Ganti passphrase tim"
              variant="secondary"
              onPress={() => router.push('/team/passphrase')}
              icon={<KeyRound size={18} color={colors.textPrimary} />}
            />
          ) : (
            <Button
              title="Keluar dari tim"
              variant="ghost"
              textColor={colors.danger}
              onPress={handleLeave}
              icon={<LogOut size={18} color={colors.danger} />}
            />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.xl, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
  },
  remove: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: `${colors.danger}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
