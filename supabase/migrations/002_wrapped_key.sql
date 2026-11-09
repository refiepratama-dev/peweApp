-- Pewe — migrasi 002: key wrapping
-- Kolom key_check diganti wrapped_key: berisi data key (DEK) acak yang dibungkus
-- dengan kunci turunan passphrase tim. Ganti passphrase cukup bungkus ulang DEK.
-- Jalankan sekali di Supabase → SQL Editor (aman dijalankan selama tabel workspaces masih kosong).
alter table public.workspaces rename column key_check to wrapped_key;
