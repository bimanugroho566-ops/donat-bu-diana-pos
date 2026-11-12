# Sistem Informasi Manajemen & POS - Donat Bu Diana 🍩

Aplikasi sistem informasi berbasis web komponen modern untuk UMKM **Donat Bu Diana**, dibangun dengan standar penilaian tugas kuliah dan rubrik arsitektur frontend terbaik.

## 🌟 Fitur Utama Berdasarkan Role

### 👑 1. Role Pemilik (Owner / Diana)
- **Ringkasan Kinerja (Dashboard)**: Statistik omset kotor, laba bersih, total transaksi, peringatan stok menipis (*low stock alert*), dan daftar donat terlaris (*Top Selling*).
- **Master Data Donat (CRUD)**: Tambah varian baru, ubah harga modal/jual, update stok, atur status aktif/non-aktif, dan hapus varian. Validasi penolakan jika harga bernilai 0.
- **Laporan Keuangan & Audit Penjualan**: Filter rentang waktu (hari ini, 7 hari, bulanan), rincian laba bersih tiap nota, serta fitur **Ekspor CSV/Excel** dan **Cetak Laporan**.

### 💳 2. Role Kasir (Cashier / POS)
- **Point of Sale (POS)**: Tampilan visual katalog varian donat dengan filter kategori dan pencarian cepat.
- **Keranjang Interaktif**: Tambah/kurang kuantiti, kalkulasi subtotal otomatis, input potongan diskon.
- **Metode Pembayaran**: Tunai (lengkap dengan kalkulator uang diterima & kembalian) dan QRIS manual yang dikonfirmasi kasir.
- **Cetak Nota Transaksi**: Struk belanja rapi format kasir dengan tombol cetak langsung (*browser print*).
- **Daftar & Status Antrean Pesanan**: Kasir dapat memantau pesanan yang sedang diproses (*processing*) dan memperbarui status menjadi selesai (*completed*).

### 🍩 3. Role Pelanggan & Publik
- **Registrasi Akun Mandiri**: Pelanggan mendaftar dengan nama, email, nomor WhatsApp/telepon, dan kata sandi sebelum masuk ke sistem.
- **Katalog Menu Publik**: Melihat varian donat kentang, bomboloni, dan minuman beserta harga, foto, dan status ketersediaan stok.
- **Lacak Pesanan (Track Order)**: Pelanggan memasukkan nomor nota dan nomor telepon yang digunakan saat memesan.

---

## 🛠️ Arsitektur & Teknologi

- **Framework**: [Vue.js 3](https://vuejs.org/) dengan sintaks `<script setup>`
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing & Guard**: [Vue Router 4](https://router.vuejs.org/) dengan *Role-Based Navigation Guard*
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **Database**: Produk, akun, dan transaksi tersimpan bersama di Supabase dengan Row Level Security (RLS).

### Persiapan Database Supabase

Integrasi Supabase digunakan oleh autentikasi, katalog, POS, antrean pesanan, laporan, dan pelacakan nota.

1. Isi `.env.local` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Publishable/anon key boleh digunakan di browser; jangan pernah menaruh `service_role` key di aplikasi.
2. Jalankan versi terbaru `supabase/schema.sql` melalui **Supabase → SQL Editor → New query → Run**. Ini diperlukan saat skema SQL diperbarui.
3. Jika tabel produk masih kosong, jalankan `supabase/seed.sql` satu kali untuk memasukkan lima produk awal. Jangan jalankan seed untuk mengatur ulang harga atau stok.
4. Buat akun melalui **Authentication → Users → Add user**. Akun baru otomatis mendapat role `pelanggan`. Untuk mengubah akun pegawai menjadi pemilik atau kasir, jalankan SQL ini di SQL Editor setelah akun dibuat:
   ```sql
   update public.profiles
   set role = 'pemilik'
   where id = (select id from auth.users where email = 'email-pemilik-anda');
   ```
   Ganti `pemilik` dengan `kasir` untuk akun kasir dan ganti alamat email contoh dengan email akun tersebut.
5. Untuk konfirmasi email pelanggan, tambahkan alamat aplikasi (misalnya `http://localhost:5173`) ke **Authentication → URL Configuration → Redirect URLs**.

Pelanggan dapat mendaftar dari halaman masuk. Pemesanan pelanggan memerlukan akun pelanggan dan nomor telepon valid agar pesanan dapat dilacak. Data transaksi lama yang sebelumnya tersimpan di browser tidak otomatis dipindahkan ke Supabase.

---

---

## 🚀 Cara Menjalankan Proyek

1. Pastikan Node.js sudah terpasang.
2. Pasang dependensi (jika belum):
   ```bash
   npm install
   ```
3. Jalankan server pengembang (*development server*):
   ```bash
   npm run dev
   ```
4. Buka tautan lokal yang muncul di terminal (biasanya `http://localhost:5173`).
