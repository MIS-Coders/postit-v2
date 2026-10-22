# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography,forms" vitest="usages:unit,component" sveltekit-adapter="adapter:node" drizzle="database:postgresql+postgresql:postgres.js+docker:yes" better-auth="demo:password" --install bun test
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Keamanan akun dan dokumen

Sebelum menjalankan versi ini di database yang sudah ada, terapkan migrasi
`drizzle/0002_user_security.sql` (atau jalankan `npm run db:migrate` bila database
tersebut sudah menggunakan riwayat migrasi Drizzle). Migrasi menambah
`account_status` dan `password_changed_at`, tanpa mengubah password lama.
Semua akun lama wajib mengganti password pada login berikutnya. Akun yang dibuat
admin juga wajib mengganti password awal. Password baru ditentukan pengguna,
minimal 8 karakter dengan huruf besar, huruf kecil, dan karakter spesial; berlaku
3 bulan kalender. Mengganti password mengakhiri seluruh sesi sebelumnya.

Di **Data User**, admin dapat memilih Aktif, Nonaktif, atau Resign. Status
Nonaktif/Resign serta `void_status` lama memblokir login dan akses melalui sesi
lama. Status ini dikelola dari PostIt; tidak ada sinkronisasi otomatis ke sistem HR.

Di **Upload Dokumen**, MS/superadmin dapat mengubah metadata, mengganti PDF,
dan menghapus dokumen. Tanggal berlaku mendatang menempatkan dokumen di waiting
list. Dokumen aktif saat tanggal berlaku tercapai menurut WIB, pada permintaan
berikutnya. Hapus dokumen menyimpan catatan arsip dan menutup akses PDF/chatbot.
Log upload/edit/hapus berisi pelaku, waktu, serta metadata sebelum/sesudah dan
disimpan bersama dokumen secara atomik di `storage/sop-data.json`. Sertakan file
ini dalam backup. Aktivitas sebelum pembaruan ini tidak dibuat ulang sebagai log.

API Python membaca metadata yang sama sebelum mengirim isi dokumen ke AI.
Dalam Docker, lokasi default adalah `/storage/sop-data.json`; untuk menjalankan
API lokal, set `SOP_DATA_FILE` ke file metadata yang sama dengan server web.
Jika pemrosesan AI gagal, dokumen tetap tersimpan dan dapat diproses ulang.
Pencarian isi PDF membutuhkan teks di dalam PDF; scan gambar memerlukan OCR.

Validasi: `npm run check`, `npm test`, `npm run build`, dan
`cd ../api && python3 -m unittest test_document_access.py`.
Uji browser lengkap tersedia di `scripts/verify-document-security.mjs`.
Jalankan hanya dengan database lokal khusus pengujian yang sudah disiapkan
menggunakan schema terbaru, setelah build:

```sh
POSTIT_TEST_DATABASE_URL=postgres://USER:PASSWORD@127.0.0.1:PORT/postit_test node scripts/verify-document-security.mjs
```

Script ini membuat server dan data uji terpisah, menguji migrasi dengan menghapus
lalu menambahkan kembali kedua kolom keamanan di database uji, dan membersihkan
akun uji setelah selesai. Jangan gunakan database aplikasi yang berisi data kerja.
