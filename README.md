# Students API — REST API + PostgreSQL + Prisma ORM

Aplikasi backend REST API berbasis **NestJS** yang terhubung ke basis data **PostgreSQL** menggunakan **Prisma ORM** untuk mengelola data mahasiswa secara permanen (pengembangan dari tugas Pekan 9 ke Pekan 10).

## Fitur Utama

- **CRUD Lengkap Mahasiswa** (`POST`, `GET`, `PATCH`/`PUT`, `DELETE`) tersimpan permanen di PostgreSQL.
- **Query Lanjutan**:
  - Filter & pencarian data (`GET /students?search=...&programStudi=...`) menggunakan Prisma `where`.
  - Statistik mahasiswa (`GET /students/stats`) menggunakan Prisma `count` dan `groupBy`.
- **Validasi & Error Handling**:
  - Validasi field wajib (`400 Bad Request`).
  - Penanganan duplikasi `nim` (`409 Conflict` untuk error Prisma `P2002`).
  - Penanganan data tidak ditemukan (`404 Not Found` untuk error Prisma `P2025` / id tidak ada).
- **CORS Aktif** (`app.enableCors()`) untuk integrasi dengan frontend.

## Tech Stack

- **Backend**: NestJS v11 (TypeScript)
- **ORM**: Prisma v6 (`@prisma/client`)
- **Database**: PostgreSQL 16
- **Testing**: Jest & Supertest

## Skema Database (`prisma/schema.prisma`)

Model `Student` dipetakan ke tabel `students`:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | `Int` | Primary key, auto increment |
| `nim` | `String` | Unik (`@unique`) |
| `nama` | `String` | Nama mahasiswa |
| `programStudi` | `String` | Dipetakan ke kolom `program_studi` |

## Cara Menjalankan Proyek

1. **Siapkan PostgreSQL & buat database** (misal `webpro_students`).
2. **Konfigurasi `.env`** di root proyek:
   ```env
   DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/webpro_students?schema=public"
   PORT=3000
   ```
3. **Install dependensi**:
   ```bash
   npm install
   ```
4. **Jalankan migrasi Prisma & generate client**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. **Jalankan server**:
   ```bash
   npm run start:dev
   ```
   Server akan berjalan di `http://localhost:3000`.

## Daftar Endpoint API

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `POST` | `/students` | Tambah data mahasiswa baru (`nim`, `nama`, `programStudi`) |
| `GET` | `/students` | Ambil semua mahasiswa (mendukung query `?search=` dan `?programStudi=`) |
| `GET` | `/students/stats` | Statistik jumlah total mahasiswa & per program studi |
| `GET` | `/students/:id` | Ambil detail 1 mahasiswa berdasarkan `id` |
| `PATCH` / `PUT` | `/students/:id` | Perbarui data mahasiswa berdasarkan `id` |
| `DELETE` | `/students/:id` | Hapus data mahasiswa berdasarkan `id` |

### Contoh Request `POST /students`

```json
{
  "nim": "103022400104",
  "nama": "Dewi Sartika",
  "programStudi": "Informatika"
}
```

### Contoh Response `GET /students/stats`

```json
{
  "total": 3,
  "byProgramStudi": [
    { "programStudi": "Informatika", "total": 2 },
    { "programStudi": "Sistem Informasi", "total": 1 }
  ]
}
```

## Pengujian

```bash
# Unit test
npm test

# End-to-end test
npm run test:e2e
```

## Dokumentasi Screenshot

Simpan screenshot setiap tahapan (migrasi database, pengujian CRUD di Postman/Thunder Client, persistensi setelah restart server, serta tampilan desktop & mobile) ke folder [`docs/screenshots/`](./docs/screenshots).
