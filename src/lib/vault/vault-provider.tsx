import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/lib/auth/auth-provider';
import { vaultCrypto } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { canUseBiometric, clearDataKey, isBiometricEnabled, loadDataKey, saveDataKey } from './key-storage';

export type Workspace = {
  id: string;
  name: string;
  kdf_salt: string;
  wrapped_key: string;
  created_by: string;
};

export type VaultStatus = 'loading' | 'error' | 'no-workspace' | 'locked' | 'unlocked';

type VaultContextValue = {
  status: VaultStatus;
  error: string | null;
  workspace: Workspace | null;
  /** Kunci untuk enkripsi/dekripsi data. Hanya ada di memori saat vault terbuka. */
  dataKey: Uint8Array | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  isOwner: boolean;
  refresh: () => Promise<void>;
  createWorkspace: (name: string, passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  enableBiometric: () => Promise<void>;
  lock: () => void;
  /** Hapus kunci tersimpan di HP ini lalu keluar akun */
  signOutAndForget: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

/** Vault terkunci otomatis kalau app ditinggal di background lebih lama dari ini */
const AUTO_LOCK_MS = 30_000;

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const userId = session?.user.id;

  const [status, setStatus] = useState<VaultStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [dataKey, setDataKey] = useState<Uint8Array | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const { data, error: err } = await supabase
      .from('workspaces')
      .select('id, name, kdf_salt, wrapped_key, created_by')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<Workspace>();

    if (err) {
      setError(err.message);
      setStatus('error');
      return;
    }
    setWorkspace(data);
    setDataKey(null);
    if (!data) {
      setStatus('no-workspace');
      return;
    }
    const [available, enabled] = await Promise.all([canUseBiometric(), isBiometricEnabled(data.id)]);
    setBiometricAvailable(available);
    setBiometricEnabled(available && enabled);
    setStatus('locked');
  }, []);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  const createWorkspace = useCallback(
    async (name: string, passphrase: string) => {
      const keys = await vaultCrypto.createWorkspaceKeys(passphrase);
      // id dibuat di HP: insert tanpa RETURNING, karena baris baru baru terbaca
      // setelah trigger menambahkan kita sebagai owner.
      const id = randomUUID();
      const { error: err } = await supabase
        .from('workspaces')
        .insert({ id, name, kdf_salt: keys.kdfSalt, wrapped_key: keys.wrappedKey });
      if (err) throw new Error(err.message);

      setWorkspace({ id, name, kdf_salt: keys.kdfSalt, wrapped_key: keys.wrappedKey, created_by: userId ?? '' });
      setDataKey(keys.dataKey);
      setBiometricAvailable(await canUseBiometric());
      setBiometricEnabled(false);
      setStatus('unlocked');
    },
    [userId],
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!workspace) return;
      // Melempar WrongPassphraseError kalau passphrase salah
      const key = await vaultCrypto.unlockDataKey(passphrase, workspace.kdf_salt, workspace.wrapped_key);
      setDataKey(key);
      setStatus('unlocked');
    },
    [workspace],
  );

  const unlockWithBiometric = useCallback(async () => {
    if (!workspace) return false;
    const key = await loadDataKey(workspace.id);
    if (!key) {
      setBiometricEnabled(await isBiometricEnabled(workspace.id));
      return false;
    }
    setDataKey(key);
    setStatus('unlocked');
    return true;
  }, [workspace]);

  const enableBiometric = useCallback(async () => {
    if (!workspace || !dataKey) return;
    await saveDataKey(workspace.id, dataKey);
    setBiometricEnabled(true);
  }, [workspace, dataKey]);

  const lock = useCallback(() => {
    setDataKey(null);
    setStatus((s) => (s === 'unlocked' ? 'locked' : s));
  }, []);

  const signOutAndForget = useCallback(async () => {
    if (workspace) await clearDataKey(workspace.id);
    setDataKey(null);
    await signOut();
  }, [workspace, signOut]);

  // Kunci otomatis setelah app di background > 30 detik
  const backgroundAt = useRef<number | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundAt.current = Date.now();
      if (state === 'active' && backgroundAt.current) {
        if (Date.now() - backgroundAt.current > AUTO_LOCK_MS) lock();
        backgroundAt.current = null;
      }
    });
    return () => sub.remove();
  }, [lock]);

  return (
    <VaultContext.Provider
      value={{
        status,
        error,
        workspace,
        dataKey,
        biometricAvailable,
        biometricEnabled,
        isOwner: !!workspace && workspace.created_by === userId,
        refresh,
        createWorkspace,
        unlock,
        unlockWithBiometric,
        enableBiometric,
        lock,
        signOutAndForget,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault harus dipakai di dalam <VaultProvider>');
  return ctx;
}
