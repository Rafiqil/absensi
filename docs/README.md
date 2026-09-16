# Absensi QR Code — Fakultas Teknik Informatika, Universitas Jabal Ghafur (Ruang 5.5)

Sistem absensi berbasis QR Code seperti pada video referensi: **jalan di atas Google
Sheets + Google Apps Script**, jadi tidak perlu sewa hosting/domain sendiri. Gratis
selama pakai akun Google biasa.

## Isi paket ini

```
Absensi_QR_TIF_JabalGhafur/
├── docs/
│   ├── README.md                              <- panduan ini
│   └── Lembar_Cetak_QR_Semua_Mahasiswa.pdf     <- semua kartu QR siap print (3 halaman)
├── data/
│   ├── mahasiswa.csv                           <- daftar 34 mahasiswa (data mentah)
│   └── Database_Absensi_TIF_UJG.xlsx           <- DATABASE utama (import ke Google Sheets)
├── qrcodes/
│   └── <NIM>_<NAMA>.png                        <- 33 kartu QR individual (1 non-aktif dikecualikan)
├── logo/
│   └── logo_placeholder_UJG.png                <- logo sementara, GANTI dengan logo resmi UJG
└── gas/
    ├── Code.gs                                 <- backend (server) Google Apps Script
    ├── Index.html                              <- tampilan website (dashboard, scan, dll)
    └── appsscript.json                         <- manifest project
```

## Catatan data mahasiswa

Dari 34 nama di daftar hadir yang difoto, nomor **14 — FITRAHUL ULFA (24105111131)**
tercoret di kertas aslinya, jadi ditandai **NONAKTIF** di database dan **tidak dibuatkan
kartu QR**. Kalau itu bukan coretan penghapusan, tinggal ubah statusnya jadi AKTIF di
sheet "Mahasiswa" lalu generate ulang QR-nya.

## Cara pasang (± 10 menit, tanpa hosting)

1. **Buat Google Sheet baru** di Google Drive kamu, beri nama misalnya
   `Absensi TIF UJG - Ruang 5.5`.
2. Import isi `data/Database_Absensi_TIF_UJG.xlsx` ke sheet baru itu:
   File > Import > Upload > pilih file xlsx > **Insert new sheet(s)**.
   Sheet `Mahasiswa`, `Absensi`, `Rekap`, `Pengaturan` akan otomatis terbentuk
   lengkap dengan 34 data mahasiswa.
3. Buka **Extensions > Apps Script** dari sheet tersebut.
4. Hapus isi default `Code.gs`, lalu salin-tempel isi file `gas/Code.gs` dari paket ini.
5. Klik **+** di samping "Files" > HTML > beri nama **Index** (huruf besar di awal,
   harus persis) > salin-tempel isi `gas/Index.html`.
6. Buka file `appsscript.json` di Apps Script (klik ikon gerigi > centang "Show
   appsscript.json"), sesuaikan dengan isi `gas/appsscript.json` dari paket ini.
7. Jalankan fungsi `setupSheets` sekali: pilih fungsi itu di dropdown atas, klik ▶ Run.
   Izinkan akses saat diminta (klik akun Google kamu > Advanced > Buka/lanjutkan).
8. Klik **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (atau "Anyone with Google account" kalau mau dibatasi)
   - Klik **Deploy**, copy URL yang muncul.
9. Buka URL itu di browser/HP — website absensi sudah jalan. Tidak ada server/hosting
   terpisah yang perlu dibayar; semua berjalan di infrastruktur Google.

## Pemakaian sehari-hari

- **Scan Absensi**: buka menu ini di laptop/HP yang ada kamera, izinkan akses kamera,
  arahkan ke kartu QR mahasiswa. Scan pertama = jam masuk, scan kedua di hari yang
  sama = jam pulang.
- **Cetak Kartu QR**: generate ulang & cetak kartu QR langsung dari website (atau pakai
  PDF siap pakai di `docs/Lembar_Cetak_QR_Semua_Mahasiswa.pdf`).
- **Absen Manual**: untuk mahasiswa izin/sakit/alpa yang tidak scan.
- **Laporan Rekap**: filter harian/bulanan per mahasiswa, lalu cetak/print.
- **Pengaturan**: ubah nama fakultas, ruang kelas, alamat, logo (isi URL gambar logo
  resmi di sini — bisa upload logo ke Google Drive, klik kanan > Get link > pastikan
  "Anyone with the link", lalu ubah link `.../view` jadi format gambar langsung, atau
  host logo di layanan gambar publik lain).

## Tentang logo

Saya tidak punya file logo resmi Universitas Jabal Ghafur, jadi paket ini memakai
**logo placeholder generik** (`logo/logo_placeholder_UJG.png`, hanya monogram "UJG").
Silakan ganti dengan logo resmi kampus: upload logo asli ke Google Drive/Sheets lalu
tempel URL-nya di menu **Pengaturan** pada website.

## Mengganti QR jika ada perubahan data mahasiswa

QR code di paket ini dibuat dari format teks: `TIF-UJG|<NIM>|<NAMA>`. Kalau ada
mahasiswa baru/keluar, kamu bisa:
- Tambah/nonaktifkan lewat menu **Data Mahasiswa** di website (otomatis update sheet), lalu
  cetak QR-nya dari menu **Cetak Kartu QR** (website generate QR langsung, tak perlu file baru).
