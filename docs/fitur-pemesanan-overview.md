# Fitur Pemesanan F&B — Overview Fitur & Alur

Dokumen ini merangkum seluruh fitur, tombol, aksi, popup, dan detail lain dari fitur pemesanan F&B D'Paragon. Digunakan sebagai referensi untuk pembuatan PRD.

---

## Konteks Produk & Ekosistem

Fitur ini adalah bagian dari **aplikasi mobile D'Paragon** — aplikasi React Native yang tersedia di Android dan iOS untuk tamu dan calon tamu properti hotel D'Paragon di Indonesia.

Dalam ekosistem app D'Paragon, fitur pemesanan F&B ini diimplementasikan sebagai **web app terpisah berbasis Next.js** (`fitur_pemesanan`) yang diakses melalui menu "Belanja" di dalam app utama. Pola ini serupa dengan ShopeeFood di dalam Shopee — mini-app dengan navigasi dan konteks tersendiri, namun terintegrasi dalam satu pengalaman pengguna.

**App induk:** D'Paragon Mobile App (React Native)
**Fitur ini:** Web app Next.js yang di-embed sebagai bagian dari menu Belanja
**Platform target:** Mobile (Android & iOS via WebView, dan browser mobile)

### Tentang D'Paragon

D'Paragon adalah jaringan properti hotel/kos yang tersebar di berbagai kota di Indonesia (Yogyakarta, Jakarta, Semarang, Palembang, dll). App D'Paragon menyediakan fitur reservasi, informasi properti, perpanjang menginap, dan layanan tamu lainnya.

---

## Konteks Fitur Pemesanan

Layanan pemesanan makanan & minuman untuk tamu hotel yang sedang menginap di properti D'Paragon wilayah Yogyakarta. Mekanisme pengiriman menggunakan jastip oleh runner internal — runner membeli dan mengantarkan pesanan ke kamar tamu.

**Akses**: Hanya tamu dengan reservasi aktif di properti D'Paragon Yogyakarta.
**Pembayaran**: Virtual Account BCA.
**Pengiriman**: Berdasarkan periode/slot waktu per hari per merchant.

---

## Halaman & Fitur

---

### 1. Dashboard (`/`)

**Komponen:**
- Promo carousel (banner hotel)
- Search bar (statis, belum ada fungsi pencarian)
- Quick Access Grid (4 icon: Kuliner, Oleh-oleh, Cafe, Semua)
- Section "Pesan Makanan & Minuman" — horizontal scroll store cards + "Jelajahi Menu"
- Section "Jelajahi Keindahan Alam" — destinasi wisata
- Bottom navigation utama

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Icon Kuliner | → `/belanja` |
| Icon Oleh-oleh | → `/belanja` |
| Icon Cafe | → `/belanja` |
| Icon Semua | → `/layanan` |
| Jelajahi Menu | → `/belanja` |
| Store card | → `/menu/[slug]` |
| Tab Belanja (bottom nav) | → `/belanja` |

---

### 2. Belanja — Hub F&B (`/belanja`)

Entry point utama fitur pemesanan, seperti halaman utama ShopeeFood.

**Komponen:**
- Header: back button, lokasi pengiriman (nama properti), cart icon + badge count
- Search bar (statis)
- Quick icons: Kuliner, Cafe, Oleh-oleh (3 icon)
- Section per kategori merchant (Kuliner, Cafe & Minuman, Oleh-oleh) dengan horizontal scroll cards
- Floating cart bar (muncul saat keranjang tidak kosong): nama toko, jumlah item, total, tombol checkout
- Mini bottom navigation: Beranda, Pesanan, Profil

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Back button (header) | → `/` (dashboard) |
| Cart icon | → `/checkout` |
| Quick icon kategori | → `/merchants?tab=[kategori]` |
| Lihat Semua (tiap section) | → `/merchants?tab=[kategori]` |
| Store card | → `/menu/[slug]` |
| Floating cart bar | → `/checkout` |
| Tab Beranda (mini nav) | → `/belanja` |
| Tab Pesanan (mini nav) | → `/orders` |
| Tab Profil (mini nav) | belum ada navigasi |

---

### 3. Semua Merchant (`/merchants`)

Halaman daftar semua merchant dengan filter kategori.

**Komponen:**
- Header: back button, judul "Semua Merchant", icon riwayat pesanan (kanan)
- Tab filter kategori: Semua, Cafe & Minuman, Kuliner, Oleh-oleh
- Icon riwayat pesanan (bawah tab, pojok kanan)
- Grid 2 kolom merchant cards

**Merchant card berisi:**
- Foto merchant
- Badge "Nx dipesan" (jika ada)
- Nama merchant
- Tagline / kategori
- Jam buka (hanya Campagna & Jede)
- Jarak (km/m dari properti)
- Tombol "Lihat Menu"

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Icon riwayat (header kanan) | → `/orders` |
| Icon riwayat (bawah tab) | → `/orders` |
| Tab kategori | Filter merchant tampil |
| Tombol "Lihat Menu" | → `/menu/[slug]` |

---

### 4. Halaman Menu Toko (`/menu/[slug]`)

Halaman menu dari satu merchant.

**Komponen:**
- Banner carousel foto toko
- Overlay info toko: nama, jumlah dipesan, alamat + link Maps (hanya Campagna & Jede), jam buka (hanya Campagna & Jede)
- Banner periode pengiriman: "Pengiriman tersedia: HH:MM · HH:MM · ..."
- Category tab pills (sticky, scroll ke section)
- Daftar menu per kategori: foto, nama, deskripsi, harga, tombol + Tambah / counter +/-
- Floating bar "Lihat Pesanan" (muncul saat keranjang tidak kosong)
- Sticky bottom bar saat toko tutup/pemesanan tutup

**Popup & Notif:**
| Kondisi | Tampilan |
|---|---|
| Belum login | Popup: "Masuk untuk memesan" + tombol Masuk + Lihat Menu |
| Login, tidak ada reservasi aktif | Popup: "Pemesanan Tidak Tersedia" + tombol "Reservasi di D'Paragon" + Lihat Menu |
| Login, reservasi non-Jogja | Popup: "Pemesanan Tidak Tersedia" + tombol Lihat Menu |
| Pemesanan tutup hari ini | Banner bawah: info jam buka kembali |
| Klik item tanpa login | Popup login prompt (sheet) |

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Back button | Kembali ke halaman sebelumnya |
| Alamat toko | Buka Google Maps (tab baru) |
| + Tambah / counter +/- | Update keranjang |
| Floating "Lihat Pesanan" | → `/checkout` |
| Popup "Masuk" | → `/auth/login` |
| Popup "Reservasi di D'Paragon" | → `/` |
| Popup "Lihat Menu" | Tutup popup |

---

### 5. Konfirmasi Pesanan / Checkout (`/checkout`)

**Komponen:**
- Info toko (nama + icon)
- Room selector (hanya muncul jika user punya 2+ kamar aktif di Jogja)
- Jadwal pengiriman:
  - Tanggal picker (muncul jika durasi menginap > 1 hari)
  - Slot waktu pengiriman (dinonaktifkan jika lewat cutoff atau setelah jam checkout)
  - Banner kuning jika semua slot hari ini sudah lewat
- Daftar pesanan: foto, nama, harga, counter +/-, subtotal per item
- Ringkasan harga: Subtotal, Biaya Layanan (Rp 2.000), Diskon (jika ada), **Total**
- Input kode voucher + tombol "Terapkan"
- Catatan (textarea opsional)
- Accordion "Tata Cara Pemesanan" (default terbuka)
  - 5 langkah pemesanan
  - Info "Tentang Periode Pengiriman"
- Bottom bar: info pengiriman terpilih + Total Pembayaran + tombol "Buat Pesanan & Bayar"

**Validasi slot:**
- Slot diblokir jika waktu sekarang > cutoff time (slot hari ini)
- Slot diblokir jika jam pengiriman ≥ 12:00 di hari checkout

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Tanggal picker | Pilih tanggal pengiriman |
| Slot waktu | Pilih periode pengiriman |
| Room selector | Pilih kamar tujuan pengiriman |
| Counter +/- item | Update qty (qty 0 = hapus item) |
| Terapkan (voucher) | Validasi kode voucher (belum ada backend) |
| Buat Pesanan & Bayar | Submit order → redirect ke `/payment/[id]` |

---

### 6. Pembayaran (`/payment/[id]`)

**Komponen:**
- Banner countdown deadline bayar
- Card Virtual Account BCA: nomor VA + tombol Salin
- Total pembayaran
- Estimasi pengiriman
- Panduan cara bayar via m-BCA (6 langkah)
- Tombol "Saya Sudah Transfer"

**State setelah bayar:**
- Ilustrasi sukses ✅
- Estimasi pengiriman
- Tombol "Lihat Status Pesanan" → `/orders`
- Tombol "Kembali ke Beranda" → `/`

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Salin (nomor VA) | Copy ke clipboard |
| Saya Sudah Transfer | Simulasi konfirmasi bayar (PATCH API) |
| Lihat Status Pesanan | → `/orders` |
| Kembali ke Beranda | → `/` |

---

### 7. Riwayat Pesanan (`/orders`)

**Komponen:**
- Header "Belanja" + back button
- Tab: Aktif / Selesai
- Filter chip: Makanan & Minuman (aktif permanen)
- Daftar order cards (style Gool/shopping card):
  - Icon toko, kode order (#ORD-XXXX), status badge
  - Kategori, nama toko, ringkasan item
  - Total harga, tombol "Lihat Detail"

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Tab Aktif | Filter pesanan belum terkirim |
| Tab Selesai | Filter pesanan status `delivered` |
| Card pesanan / Lihat Detail | → `/orders/[id]` |

---

### 8. Detail Pesanan (`/orders/[id]`)

**Komponen:**
- Header status: "Pesanan Aktif" atau "Pesanan Terkirim"
- Timeline 4 langkah: Dibayar → Dikonfirmasi → Dalam Perjalanan → Terkirim
- Rincian item pesanan
- Info pengiriman:
  - Titik merah: Diambil dari (nama toko)
  - Titik hijau: Diantar ke (nama properti + nomor kamar)
  - Link "Bukti Pengiriman ›" + tanggal/jam (muncul jika runner sudah upload)
- Lightbox foto bukti pengiriman (muncul saat klik link)
- Ringkasan harga: Subtotal, Biaya Layanan, Diskon, Total
- Info pesanan: nomor order, waktu pemesanan
- Tombol "Pesan Lagi"

**Tombol & Aksi:**
| Tombol | Aksi |
|---|---|
| Back button | Kembali |
| Bukti Pengiriman | Buka lightbox foto |
| Lightbox (klik area gelap / ✕) | Tutup foto |
| Pesan Lagi | → `/menu/[slug]` |

---

### 9. Semua Layanan (`/layanan`)

Halaman hub layanan selain F&B.

**Section:**
- **Kuliner**: quick icons (Kuliner, Oleh-oleh, Cafe) → `/belanja`
- **Layanan**: Perpanjang Kamar, Layanan Kamar (placeholder, belum ada navigasi)

---

### 10. Login (`/auth/login`)

**Komponen:**
- Form: Nomor HP + Password
- Tombol Masuk
- Panel akun demo (6 akun dengan info status reservasi)

---

## Aturan Bisnis Utama

| Aturan | Detail |
|---|---|
| Eligibilitas pesan | Login + reservasi aktif + properti Jogja |
| Multi-kamar | Room selector muncul jika ≥2 kamar aktif di Jogja |
| Slot pengiriman | Cutoff time per slot; slot setelah jam 12:00 diblokir di hari checkout |
| Tanggal pengiriman | Dari hari ini s/d hari checkout (maks 7 hari) |
| Cart | Single-store; items dari 1 toko saja per sesi |
| Biaya layanan | Flat Rp 2.000 per transaksi |
| Voucher | Input kode manual; validasi backend belum diimplementasi |
| Status pengiriman | `null` → `confirmed` → `delivering` → `delivered` (diupdate runner) |
| Bukti pengiriman | Field URL di DB, diupload oleh runner (UI upload belum ada) |

---

## Yang Belum Diimplementasi

- Pencarian merchant/menu
- Halaman profil pengguna (dalam belanja)
- Sistem voucher (tabel + validasi backend)
- Upload bukti pengiriman oleh runner (perlu halaman admin/runner)
- Notifikasi real-time status pesanan
- Perpanjang Kamar & Layanan Kamar (placeholder)
- Halaman reservasi
- Halaman profil utama
