# Smartix - Smart Event and Ticketing System

Smartix adalah website full-stack untuk tugas UAS backend. Aplikasi ini dibuat dengan Node.js native, JavaScript ES Modules, routing manual, database JSON, dan frontend responsive.

## Cara Menjalankan

```bash
npm start
```

Buka browser:

```txt
http://localhost:3000
```

## Akun Admin

| Role | Email | Password |
|---|---|---|
| Admin | `ZEE@gmail.com` | `ZEE241112979` |

Customer tidak memiliki akun demo. Customer wajib register terlebih dahulu, lalu login menggunakan akun yang sudah dibuat.

## Fitur Utama

- Melihat daftar event yang sudah dipublish.
- Mencari event berdasarkan keyword dan kategori.
- Register dan login pengguna.
- Autentikasi berbasis token session.
- Otorisasi role `admin` dan `customer`.
- Booking tiket digital.
- Melihat daftar tiket dan kode tiket.
- Admin membuat event baru.
- Admin mengedit event.
- Admin menghapus event dari daftar publik.
- Admin melakukan check-in tiket berdasarkan kode.
- Dashboard admin untuk total event, tiket, check-in, dan revenue.
- Dashboard menampilkan daftar event paling populer.
- Real-time update menggunakan Server-Sent Events pada endpoint `/api/realtime`.

## API Endpoint

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Cek status server |
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user aktif |
| GET | `/api/auth/me` | Mengambil user aktif |
| GET | `/api/events` | Mengambil semua event published |
| GET | `/api/events/:id` | Mengambil detail event |
| POST | `/api/events` | Membuat event baru |
| PUT | `/api/events/:id` | Mengubah event |
| DELETE | `/api/events/:id` | Menghapus event dari publik |
| GET | `/api/tickets` | Mengambil semua tiket |
| POST | `/api/tickets` | Booking tiket |
| POST | `/api/tickets/check-in` | Check-in tiket |
| GET | `/api/admin/dashboard` | Mengambil ringkasan dashboard |
| GET | `/api/realtime` | Membuka koneksi RTC dengan Server-Sent Events |

## Middleware

Middleware native Node.js berada di `src/middlewares/`.

- `securityHeadersMiddleware`: menambahkan header keamanan.
- `loggerMiddleware`: mencatat method dan path request.
- `jsonContentTypeMiddleware`: memastikan body `POST`, `PUT`, dan `PATCH` API memakai `application/json`.
- `authContextMiddleware`: membaca token, mencari session, lalu menempelkan user aktif ke request.

Proteksi route memakai:

- `requireAuth`: user harus login.
- `requireRole`: user harus memiliki role tertentu, misalnya `admin`.

## Mapping Kriteria Penilaian

| Kriteria | Lokasi Implementasi |
|---|---|
| Operasi dasar JavaScript | `public/app.js`, controller, dan model menggunakan variable, function, array, object, loop, conditional, template string, DOM manipulation |
| Class dan inheritance | `src/models/BaseModel.js`, `Event.js`, `Ticket.js`, `User.js`, `AdminUser.js` |
| Async | `src/services/databaseService.js`, semua controller memakai `async/await` |
| Module system | Semua file backend memakai `import` dan `export` ES Modules |
| Web server NodeJS | `server.js` memakai `http.createServer()` native Node.js |
| Routing | `src/routes/router.js` mengatur route berdasarkan method dan path untuk event, tiket, dan admin |
| Content-Type dan HTTP method | `src/utils/response.js`, `src/utils/staticFile.js`, route API, serta frontend memakai `GET`, `POST`, `PUT`, dan `DELETE` |
| Database | `data/database.json` dibaca dan ditulis melalui `databaseService.js` |
| Tampilan menarik | `public/index.html`, `public/style.css`, dan aset `public/assets/event-hero.svg` |

## Mapping Kriteria Lanjutan

| Kriteria | Lokasi Implementasi |
|---|---|
| Aplikasi web server menggunakan database | Semua controller membaca/menulis `data/database.json` melalui `src/services/databaseService.js` |
| Middleware | `server.js` menjalankan middleware dari `src/middlewares/appMiddleware.js` |
| REST | `src/routes/router.js` memakai resource route seperti `/api/events`, `/api/tickets`, `/api/auth`, dan `/api/admin/dashboard` |
| Autentikasi dan otorisasi | `src/services/authService.js`, `src/controllers/authController.js`, dan `src/middlewares/authMiddleware.js` |
| Tampilan menarik | UI responsive, hero visual, dashboard, auth panel, card event, tiket digital, dan admin panel |
| RTC dan hosting | RTC memakai `/api/realtime` dengan Server-Sent Events; hosting disiapkan lewat `render.yaml`, `Procfile`, dan script `npm start` |

## Struktur Folder

```txt
.
├─ data/
│  └─ database.json
├─ public/
│  ├─ assets/
│  │  └─ event-hero.svg
│  ├─ app.js
│  ├─ index.html
│  └─ style.css
├─ src/
│  ├─ controllers/
│  ├─ middlewares/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  └─ utils/
├─ package.json
├─ README.md
├─ Procfile
├─ render.yaml
└─ server.js
```

## Hosting Website

Opsi Render:

1. Push folder project ke GitHub.
2. Buat Web Service baru di Render.
3. Pilih repository project.
4. Render akan membaca `render.yaml`.
5. Pastikan start command adalah `npm start`.

Opsi Railway:

1. Push project ke GitHub.
2. Buat project baru dari repository.
3. Railway otomatis menjalankan `npm start`.

Opsi VPS:

```bash
npm install
npm start
```

Pastikan port production membaca `process.env.PORT`, sudah tersedia di `server.js`.

## Catatan Presentasi

Project ini sengaja tidak memakai Express agar konsep dasar Node.js web server, routing, content-type, dan HTTP method terlihat jelas di source code.

Saat presentasi, fitur yang paling bagus didemokan:

1. Cari event di halaman utama.
2. Register sebagai customer.
3. Login sebagai customer yang baru dibuat.
4. Booking tiket dan lihat kode tiket di tab Tickets.
5. Login sebagai admin `ZEE@gmail.com`.
6. Masuk tab Admin, check-in kode tiket.
7. Tambah event baru.
8. Edit event lewat panel Manage Events.
9. Delete event untuk menunjukkan HTTP method `DELETE`.
10. Buka dua browser/tab untuk menunjukkan real-time update.
