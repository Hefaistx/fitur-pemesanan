# Spec: Menu Master — Fitur Pemesanan

Dokumen ini adalah brief untuk developer/AI di repo manajemen (`management.dparagon.com`) agar bisa mengimplementasikan halaman-halaman master data untuk modul **Fitur Pemesanan**.

---

## Konteks

Fitur Pemesanan adalah mini-app terpisah (Next.js, database Neon/PostgreSQL, ORM Drizzle) yang memungkinkan tamu D'Paragon memesan makanan (F&B) dan jasa titip (Jastip) dari merchant rekanan, dengan pengiriman ke kamar.

Data master di bawah ini dikelola via web manajemen dan dibaca oleh mini-app tersebut dari database yang sama.

---

## Database

- **Engine**: PostgreSQL (Neon serverless)
- **ORM di mini-app**: Drizzle ORM
- **Koneksi**: gunakan `DATABASE_URL` yang sama dengan mini-app (env var tersedia di manajemen)

---

## Master Data yang Dibutuhkan

Ada **6 halaman master**, dengan urutan dependensi sebagai berikut:

```
Properti
Delivery Group → Delivery Slot
Delivery Group → Toko/Merchant → Kategori Menu → Item Menu
```

---

### 1. Master Properti

**Tabel**: `properties`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial PK | |
| `name` | text, unique | Nama properti, misal `"D'Paragon Kemuning"` |
| `lat` | double precision | Latitude |
| `lng` | double precision | Longitude |

**Kegunaan**: Mini-app menggunakan lat/lng untuk mendeteksi apakah tamu sedang menginap di area Yogyakarta. Jika properti dalam radius Jogja → tamu bisa pesan; jika di luar → hanya bisa lihat.

**UI Table columns**: #, Nama Properti, Latitude, Longitude, Terakhir Diubah, Aksi (Edit/Hapus)

**Form Tambah/Edit**: Nama, Latitude, Longitude

**Data awal (14 properti)**:
```
D'Paragon Kemuning, D'Paragon Seturan 1, D'Paragon Seturan 2, D'Paragon Seturan 3,
D'Paragon Karangmalang, D'Paragon UPN, D'Paragon Pogung F, D'Paragon Pogung B,
D'Paragon Perumnas, D'Paragon Beo, D'Paragon Malioboro,
D'Paragon Pamela 1, D'Paragon Pamela 4, D'Kraton Villa Mantrijeron
```

---

### 2. Master Delivery Group

**Tabel**: `delivery_period_groups`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial PK | |
| `name` | text | Nama grup, misal `"Standar 3 Sesi"` |
| `description` | text nullable | Deskripsi singkat |

**Kegunaan**: Grup sesi pengiriman. Setiap toko (`stores`) diassign ke satu grup. Grup menentukan slot waktu yang tersedia untuk memesan.

**UI Table columns**: #, Nama Grup, Deskripsi, Slot Aktif (preview ringkas), Toko Terhubung (count), Terakhir Diubah, Aksi

**Form Tambah/Edit**: Nama, Deskripsi

**Data awal**:
- `Standar 3 Sesi` — 3× pengiriman per hari (untuk toko F&B)
- `Jastip 2 Sesi` — 2× pengiriman per hari (untuk toko Jastip)

---

### 3. Master Delivery Slot

**Tabel**: `delivery_slots`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial PK | |
| `group_id` | integer FK → `delivery_period_groups.id` | |
| `cutoff_time` | varchar(5) | Batas waktu pesan, format `"HH:MM"`, misal `"11:00"` |
| `delivery_time` | varchar(5) | Estimasi waktu kirim, format `"HH:MM"`, misal `"13:00"` |
| `is_active` | boolean, default true | Slot aktif atau tidak |
| `sort_order` | integer | Urutan tampil |

**Kegunaan**: Mendefinisikan jam cutoff (batas pesan) dan jam pengiriman per sesi dalam satu grup. Mini-app menampilkan slot yang masih bisa dipilih (cutoff belum lewat).

**UI Table columns**: #, Grup, Batas Pesan (Cutoff), Estimasi Kirim, Urutan, Status (Aktif/Non-Aktif), Terakhir Diubah, Aksi

**Filter**: by Grup, by Status

**Form Tambah/Edit**: Delivery Group (dropdown), Cutoff Time (time input), Delivery Time (time input), Urutan, Status

**Data awal**:
```
Standar 3 Sesi: 11:00→13:00, 14:00→16:00, 18:00→20:00
Jastip 2 Sesi:  10:00→14:00, 16:00→19:00
```

---

### 4. Master Toko / Merchant

**Tabel**: `stores`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial PK | |
| `slug` | varchar(50), unique | URL-friendly identifier, misal `"campagna"` |
| `name` | text | Nama toko |
| `type` | varchar(20) | `"fnb"` atau `"jastip"` |
| `delivery_group_id` | integer FK → `delivery_period_groups.id` | Sesi pengiriman yang dipakai |
| `tagline` | text nullable | Tagline singkat |
| `description` | text nullable | Deskripsi toko |
| `wa_number` | varchar(20) | Nomor WhatsApp toko (format 62xxx) |
| `image_url` | text nullable | URL foto thumbnail toko |
| `banner_url` | text nullable | URL foto banner toko |
| `open_hours` | varchar(50) nullable | Jam buka, misal `"07.00 – 22.00"` |
| `rating` | numeric(2,1) nullable | Rating toko (1.0–5.0) |

**Kegunaan**: Data merchant yang muncul di halaman beranda mini-app. Tamu memilih toko, lalu memilih menu.

**UI Table columns**: #, Nama Toko (+ slug kecil di bawah), Tipe (badge FnB/Jastip), Sesi Pengiriman, Jam Buka, Status (aktif/non-aktif via is_available atau field baru), Terakhir Diubah, Aksi

> **Catatan**: Schema saat ini tidak punya kolom `is_active` di `stores`. Jika dibutuhkan, tambahkan kolom `is_active boolean default true` via migration.

**Filter**: Tipe, Sesi Pengiriman, Status

**Form Tambah/Edit**: Nama, Slug, Tipe (FnB/Jastip), Delivery Group (dropdown), Tagline, Deskripsi, Nomor WA, URL Foto, URL Banner, Jam Buka, Rating

**Data awal (5 toko)**:
| Slug | Nama | Tipe | Grup |
|---|---|---|---|
| campagna | Campagna Coffee & Eatery | fnb | Standar 3 Sesi |
| jede | Sate Klathak Pak Jede | fnb | Standar 3 Sesi |
| bakpia-asri | Bakpia Jogja Asri | jastip | Jastip 2 Sesi |
| gudeg-busari | Gudeg Kemasan Bu Sari | jastip | Jastip 2 Sesi |
| wedang-rempah | Wedang Rempah Jogja | jastip | Jastip 2 Sesi |

---

### 5. Master Kategori Menu

**Tabel**: `menu_categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial PK | |
| `store_id` | integer FK → `stores.id` | Kategori milik toko mana |
| `name` | text | Nama kategori, misal `"Kopi & Minuman"` |
| `sort_order` | integer | Urutan tampil di mini-app |

**Kegunaan**: Pengelompokan item menu di dalam satu toko. Mini-app menampilkan menu per kategori dengan sticky tab.

**UI Table columns**: #, Nama Kategori, Toko, Jumlah Item, Urutan, Terakhir Diubah, Aksi

**Filter**: by Toko

**Form Tambah/Edit**: Toko (dropdown), Nama Kategori, Urutan

---

### 6. Master Item Menu

**Tabel**: `menu_items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial PK | |
| `store_id` | integer FK → `stores.id` | |
| `category_id` | integer FK → `menu_categories.id` nullable | |
| `name` | text | Nama item |
| `description` | text nullable | Deskripsi item |
| `price` | integer | Harga dalam rupiah (tanpa desimal) |
| `image_url` | text nullable | URL foto item |
| `is_available` | boolean, default true | Item tersedia atau tidak (tampil di mini-app) |
| `sort_order` | integer | Urutan tampil |

**Kegunaan**: Item yang bisa dipesan tamu. `is_available = false` menyembunyikan item dari mini-app tanpa menghapus data.

**UI Table columns**: #, Nama Item, Toko, Kategori, Harga (format Rp), Tersedia (toggle/badge), Urutan, Terakhir Diubah, Aksi

**Filter**: by Toko, by Kategori, by Status Tersedia

**Form Tambah/Edit**: Toko (dropdown, lalu trigger load kategori), Kategori (dropdown, dependent ke toko), Nama, Deskripsi, Harga (input angka, tampil format Rp), URL Foto, Tersedia (checkbox/toggle), Urutan

> **Catatan penting**: Ketika `is_available` di-toggle false, item tidak muncul di mini-app tapi `order_items` historis yang sudah ada tidak terpengaruh karena menyimpan `item_name` dan `price_at_order` secara snapshot.

---

## Pola UI (Mengikuti Standar Web Manajemen)

Ikuti pattern yang sudah ada di halaman-halaman lain di repo manajemen:

- **List page**: DataTable dengan search, show entries, pagination, tombol Export + Tambah
- **Filter**: Tampilkan filter di atas tabel jika ada lebih dari 1 dimensi filter
- **Aksi per row**: Tombol Edit (kuning) dan Hapus (merah)
- **Form Tambah/Edit**: Modal atau halaman terpisah (sesuai konvensi repo)
- **Konfirmasi hapus**: SweetAlert atau modal konfirmasi sebelum delete
- **Toast/notifikasi**: Tampilkan sukses/error setelah operasi CRUD

---

## Urutan Implementasi yang Disarankan

1. **Properti** — paling independen, tidak ada FK ke tabel lain
2. **Delivery Group** — independen
3. **Delivery Slot** — butuh Delivery Group sudah ada
4. **Toko / Merchant** — butuh Delivery Group sudah ada
5. **Kategori Menu** — butuh Toko sudah ada
6. **Item Menu** — butuh Toko + Kategori sudah ada

---

## Catatan Tambahan

- Semua operasi CRUD harus melalui API (bukan akses DB langsung dari frontend), mengikuti pola yang sudah ada di repo manajemen.
- Untuk field `price` di `menu_items`, simpan sebagai integer (rupiah bulat). Format tampilan `Rp 25.000` hanya di UI.
- Field `slug` di `stores` harus unik dan URL-safe. Validasi di backend sebelum save.
- Jika ada upload foto (`image_url`, `banner_url`), ikuti pola upload yang sudah ada di repo manajemen (kemungkinan ke S3/Cloudinary/storage yang sudah dikonfigurasi).
