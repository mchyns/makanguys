# MakanGuys 🗺️🍲
> *"Temukan yang enak, tandai tempatnya."*

MakanGuys adalah platform rekomendasi tempat makan berbasis komunitas dan peta interaktif. Siapa pun dapat menemukan warung tersembunyi (*hidden gems*), jajanan kaki lima legendaris, kedai kopi lokal, serta membagikan rekomendasi tempat makan favorit langsung di peta tanpa perlu mendaftar atau memiliki akun.

---

## 🚀 Fitur Utama

- **Peta Interaktif 3D & Datar:** Navigasi peta berbasis vector tiles (MapLibre GL JS + OpenFreeMap) dengan kontrol pitch/3D tilt, zoom halus, penanda khusus MakanGuys, dan pencari lokasi saya (GPS).
- **Pencarian & Filter Cerdas:** Cari berdasarkan nama tempat, menu makanan, area, serta filter kategori kuliner (Nasi & Lauk, Bakso, Sate, Jajanan, Kopi, dll.) dan rentang harga.
- **Tambah Tempat Tanpa Akun:** Form bertahap dengan penentuan koordinat manual pada peta interaktif, unggah hingga 5 foto makanan, rentang harga, dan opsi kontributor bernama atau anonim.
- **Keamanan & Anti-Spam:** Honeypot otomatis, sanitasi input server-side dengan Zod, validasi berkas MIME type (hanya JPEG/PNG/WebP maks 5 MB), dan status publikasi moderasi `pending` secara *default*.
- **Halaman Detail Tempat (`/tempat/[slug]`):** Foto galeri resolusi tinggi, petunjuk arah langsung ke Google Maps, tombol bagikan (Web Share API + salin tautan), serta tombol pelaporan tempat bermasalah.
- **Penyimpanan Lokal (`/tersimpan`):** Simpan tempat makan favorit ke memori browser lokal (*localStorage*) tanpa akun.
- **Panel Moderasi Admin (`/admin`):** Dilindungi autentikasi password server dan *signed session cookie* HttpOnly. Moderator dapat menyetujui (`published`), menolak (`rejected`), menyembunyikan (`hidden`), menghapus tempat makan, serta menyelesaikan laporan pengguna.
- **Arsitektur Tangguh & Fallback Cerdas:** Aplikasi dapat langsung dievaluasi dan dijalankan secara lokal dengan data seed bawaan. Ketika kredensial Supabase dihubungkan di `.env.local`, aplikasi otomatis beralih menggunakan database PostgreSQL Supabase dan Supabase Storage.

---

## 🛠️ Teknologi yang Digunakan

| Bagian | Teknologi |
|---|---|
| Framework Frontend & Backend | Next.js 16 (App Router) + React 19 |
| Bahasa | TypeScript |
| Styling | Tailwind CSS v4 |
| Peta Interaktif | MapLibre GL JS |
| Map Vector Tile Provider | OpenFreeMap (Bright Style, tanpa API key) |
| Database Permanen | Supabase PostgreSQL + Row Level Security (RLS) |
| Penyimpanan Gambar | Supabase Storage (`place-photos` bucket) |
| Validasi Skema | Zod |
| Form Management | React Hook Form |
| Sistem Ikon | Lucide React |
| Autentikasi Admin | Node.js Crypto HMAC-SHA256 Signed Cookies |
| Target Deployment | Vercel |

---

## 📋 Persyaratan Sistem

- Node.js versi 20.x atau lebih baru (direkomendasikan v22+)
- npm versi 10.x atau lebih baru
- Akun [Supabase](https://supabase.com) (gratis) untuk database & media storage produksi
- Akun [Vercel](https://vercel.com) untuk deployment cloud

---

## ⚙️ Langkah Instalasi & Menjalankan Lokal

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/username/makanguys.git
cd makanguys

# Install seluruh paket dependensi
npm install
```

### 2. Konfigurasi Environment Variables

Salin berkas template environment:

```bash
cp .env.example .env.local
```

Buka `.env.local` dan sesuaikan nilainya:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Map Provider (OpenFreeMap vector tiles - Open Source, no key required)
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/bright

# Admin Panel Security
ADMIN_PASSWORD=makanguysadmin2026
ADMIN_SESSION_SECRET=makanguys_super_secure_session_secret_key_32_chars_local_dev

# Supabase (Dapatkan dari project dashboard Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> **Catatan Pengujian:** Jika variabel Supabase dikosongkan, MakanGuys akan berjalan dalam **Mode Demonstrasi & Fallback**. Anda dapat langsung menjelajah peta, mencari tempat, menambah tempat baru, menyimpan tempat, serta login ke `/admin` menggunakan password `makanguysadmin2026`.

### 3. Menjalankan Server Development

```bash
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Setup Database & Storage Supabase

Jika ingin menghubungkan ke database Supabase nyata:

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor**.
3. Buka berkas `supabase/migrations/001_initial_schema.sql` di repositori ini, salin seluruh isinya, tempel ke SQL Editor Supabase, lalu jalankan (**Run**).
   - Skrip ini akan membuat tabel `places`, `place_photos`, `reports`, indeks pencarian, fungsi trigger `updated_at`, kebijakan Row Level Security (RLS), dan bucket storage `place-photos`.
4. (Opsional) Jalankan berkas `supabase/seed.sql` di SQL Editor untuk mengisi 6 rekomendasi kuliner legendaris Indonesia (Nasi Goreng Kebon Sirih, Bakso Solo Samrat, Soto Betawi H. Ma'ruf, Kopi Klotok, Bebek Sinjay, Batagor Kingsley).
5. Buka menu **Project Settings > API** di Supabase:
   - Salin **Project URL** ke `NEXT_PUBLIC_SUPABASE_URL`.
   - Salin **anon public key** ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Salin **service_role key** (secret) ke `SUPABASE_SERVICE_ROLE_KEY`.

---

## 🛡️ Akses Panel Moderasi Admin

1. Buka [http://localhost:3000/admin](http://localhost:3000/admin).
2. Masukkan password admin yang dikonfigurasi di `ADMIN_PASSWORD` (default lokal: `makanguysadmin2026`).
3. Dari dashboard ini, Anda dapat:
   - Meninjau rekomendasi yang berstatus `pending`.
   - Mempublikasikan rekomendasi yang lolos kurasi.
   - Menolak atau menyembunyikan rekomendasi bermasalah.
   - Meninjau laporan pengunjung.

---

## 🔍 Pemeriksaan Kualitas & Build Produksi

Jalankan perintah berikut untuk memastikan integritas kode dan tipe TypeScript:

```bash
# Validasi ESLint
npm run lint

# Compile & Build Produksi Next.js
npm run build

# Menjalankan Server Produksi
npm run start
```

---

## ☁️ Langkah Deployment ke Vercel

1. Hubungkan repository GitHub Anda ke [Vercel](https://vercel.com).
2. Pada pengaturan proyek Vercel, buka tab **Environment Variables** dan tambahkan variabel berikut:
   - `NEXT_PUBLIC_SITE_URL` (contoh: `https://makanguys.vercel.app`)
   - `NEXT_PUBLIC_MAP_STYLE_URL` (`https://tiles.openfreemap.org/styles/bright`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (gunakan password acak yang kuat)
   - `ADMIN_SESSION_SECRET` (string acak minimal 32 karakter)
3. Klik **Deploy**. Vercel akan otomatis meng-compile dan mempublikasikan aplikasi Anda.

---

## 🗺️ Mengganti Penyedia Peta (Map Provider)

MakanGuys menggunakan MapLibre GL JS yang kompatibel dengan format Mapbox GL Vector Tile Specification. Anda dapat mengganti URL style peta kapan saja melalui variabel `NEXT_PUBLIC_MAP_STYLE_URL`:
- **OpenFreeMap Bright (Default):** `https://tiles.openfreemap.org/styles/bright`
- **OpenFreeMap Liberty:** `https://tiles.openfreemap.org/styles/liberty`
- **Protomaps / MapTiler:** Masukkan URL style JSON dari penyedia Anda.

---

## 📄 Lisensi

MIT License © MakanGuys
