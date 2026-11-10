import { useEffect, useState } from 'react';
import { useVault } from '@/lib/vault/vault-provider';
import { loadImage, type VaultImage } from './images-api';

/** Data URI gambar yang sudah didekripsi + status loading/error */
export function useDecryptedImage(image: VaultImage | null | undefined) {
  const { dataKey } = useVault();
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setUri(null);
    setFailed(false);
    if (!image || !dataKey) return;
    loadImage(image, dataKey)
      .then((u) => alive && setUri(u))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [image, dataKey]);

  return { uri, failed };
}
