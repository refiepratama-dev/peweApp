import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useVault } from '@/lib/vault/vault-provider';

export type Category = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
};

export type CategoryInput = Pick<Category, 'name' | 'color' | 'icon'>;

type CategoriesContextValue = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CategoryInput) => Promise<Category>;
  update: (id: string, input: CategoryInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, 'id');

/** Data kategori workspace aktif, dipakai bersama oleh beranda, daftar kategori & form */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { workspace } = useVault();
  const workspaceId = workspace?.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');
    if (err) setError(err.message);
    else {
      setError(null);
      setCategories(data as Category[]);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CategoryInput) => {
      const { data, error: err } = await supabase
        .from('categories')
        .insert({ ...input, workspace_id: workspaceId })
        .select()
        .single<Category>();
      if (err) throw new Error(err.message);
      setCategories((list) => [...list, data].sort(byName));
      return data;
    },
    [workspaceId],
  );

  const update = useCallback(async (id: string, input: CategoryInput) => {
    const { error: err } = await supabase.from('categories').update(input).eq('id', id);
    if (err) throw new Error(err.message);
    setCategories((list) => list.map((c) => (c.id === id ? { ...c, ...input } : c)).sort(byName));
  }, []);

  const remove = useCallback(async (id: string) => {
    // Entry di kategori ini tidak ikut terhapus: category_id-nya otomatis jadi kosong (ON DELETE SET NULL)
    const { error: err } = await supabase.from('categories').delete().eq('id', id);
    if (err) throw new Error(err.message);
    setCategories((list) => list.filter((c) => c.id !== id));
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading, error, refresh, create, update, remove }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories harus dipakai di dalam <CategoriesProvider>');
  return ctx;
}
