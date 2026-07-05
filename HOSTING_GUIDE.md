# Panduan Hosting Smartix

## Platform yang Direkomendasikan

Gunakan Render Web Service karena project ini sudah memiliki:

- `render.yaml`
- `Procfile`
- `package.json` dengan script `npm start`
- `server.js` yang membaca `process.env.PORT`

## Langkah Hosting di Render

1. Buat repository baru di GitHub.
2. Upload semua file project ini ke repository tersebut.
3. Login ke Render.
4. Pilih New Web Service.
5. Connect repository GitHub project Smartix.
6. Render akan membaca konfigurasi dari `render.yaml`.
7. Pastikan konfigurasi:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
8. Deploy aplikasi.
9. Setelah deploy selesai, salin URL hosting Render ke `Tim.txt`.

## Akun Admin untuk Demo

- Email: `ZEE@gmail.com`
- Password: `ZEE241112979`

## Catatan Database

Project ini memakai database JSON di `data/database.json`. Untuk kebutuhan UAS dan demo fitur, konfigurasi ini sudah cukup menunjukkan penggunaan database file pada web server Node.js.

Pada hosting gratis seperti Render, perubahan file database dapat reset jika service redeploy/restart. Saat presentasi, gunakan data awal yang sudah tersedia atau demo fitur secara langsung setelah service aktif.

## Checklist Sebelum Dikumpulkan

- Aplikasi berhasil dibuka dari link hosting.
- Login admin berhasil.
- Customer bisa register, login, booking tiket, dan melihat tiket.
- Admin bisa melihat dashboard, manage events, dan check-in dari tab Tickets.
- Real-time update berjalan saat dua browser/tab dibuka.
- `Tim.txt` sudah diisi lengkap.
- Folder project sudah dibuat `.zip` atau `.rar`.
- Video demo sudah direkam maksimal 15 menit.
