# Fitur Import Data Wilayah Kerja

## Deskripsi
Fitur import data Wilayah Kerja memungkinkan admin untuk melakukan import massal data Kecamatan, Desa, dan SLS dari file Excel. Data akan otomatis tersimpan ke dalam database dengan relasi yang benar.

## Fitur Utama

### 1. Download Template Excel
- Admin dapat mendownload template Excel yang berisi struktur kolom yang diperlukan
- Template berisi contoh data untuk referensi
- File: `Template_Import_Wilayah_Kerja.xlsx`

### 2. Import Data dari Excel
- Upload file Excel (.xlsx atau .xls)
- Sistem akan memvalidasi data secara real-time
- Preview data sebelum diimport untuk memastikan kebenaran
- Import dengan transaksi database untuk menjamin integritas data

### 3. Struktur Kolom Excel

File Excel harus memiliki kolom dengan nama (case-sensitive):

| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| **Kecamatan** | Nama kecamatan | Patampanua |
| **Desa** | Nama desa | Desa A |
| **SLS** | Nomor SLS | 001.01.01 |

### 4. Validasi Data

Sistem melakukan validasi:
- Setiap kolom wajib diisi
- Format harus sesuai dengan template
- Data otomatis di-trim untuk menghilangkan spasi berlebih

### 5. Proses Import

Saat import, sistem akan:
1. Cari atau buat Kecamatan baru (dengan Kabupaten: Pinrang, Provinsi: Sulawesi Selatan)
2. Cari atau buat Desa baru di bawah Kecamatan yang terkait
3. Cari atau buat SLS baru di bawah Desa yang terkait
4. Menghindari duplikasi data dengan `firstOrCreate`

### 6. Fitur Keamanan

- Validasi dilakukan di frontend dan backend
- Transaksi database untuk mencegah data tidak konsisten
- Error handling yang detail untuk setiap baris yang gagal
- CSRF token protection untuk keamanan request

## Cara Penggunaan

### Step 1: Buka Halaman Wilayah Kerja
1. Login sebagai Admin
2. Navigasi ke menu **Wilayah Kerja**

### Step 2: Download Template (Opsional)
1. Klik tombol **Import Excel**
2. Jendela modal akan terbuka
3. Klik **Download template Excel** untuk mendapatkan file template
4. Buka file template di Microsoft Excel atau aplikasi spreadsheet lainnya

### Step 3: Isi Data
1. Isi kolom Kecamatan, Desa, dan SLS sesuai data yang ingin diimport
2. Setiap baris adalah satu data wilayah kerja
3. Pastikan data sudah benar sebelum disimpan

### Step 4: Upload File
1. Klik tombol **Import Excel**
2. Modal dialog akan terbuka
3. Klik area input file atau drag-drop file Excel
4. Pilih file yang sudah diisi

### Step 5: Review Preview
1. Sistem akan menampilkan preview data dalam bentuk tabel
2. Periksa apakah data sudah benar
3. Jika ada kesalahan, perbaiki file dan upload ulang

### Step 6: Konfirmasi Import
1. Jika preview sudah benar, klik tombol **Import**
2. Tunggu hingga proses selesai
3. Akan muncul pesan sukses dan halaman akan refresh otomatis

## Contoh Data

### Template Minimal
```
Kecamatan              | Desa        | SLS
Patampanua            | Desa A      | 001.01.01
Patampanua            | Desa B      | 001.01.02
Suppa                 | Desa C      | 002.01.01
Suppa                 | Desa D      | 002.01.02
```

### Jumlah Data
- Minimal 1 baris data
- Tidak ada batasan maksimal, tetapi disarankan per batch 1000 baris

## Pesan Error dan Penyelesaian

| Error | Penyebab | Solusi |
|-------|----------|--------|
| "Kecamatan wajib diisi" | Kolom Kecamatan kosong | Isi kolom Kecamatan untuk setiap baris |
| "Desa wajib diisi" | Kolom Desa kosong | Isi kolom Desa untuk setiap baris |
| "SLS wajib diisi" | Kolom SLS kosong | Isi kolom SLS untuk setiap baris |
| "Gagal membaca file Excel" | Format file salah | Pastikan file adalah .xlsx atau .xls |
| "Data import tidak boleh kosong" | File tidak berisi data | Pastikan file memiliki minimal 1 baris data |

## Fitur Tambahan

### Duplikasi Data
- Sistem menggunakan `firstOrCreate` untuk mencegah duplikasi
- Jika Kecamatan dengan nama yang sama sudah ada, sistem akan menggunakannya
- Jika Desa dengan nama yang sama di Kecamatan yang sama sudah ada, sistem akan menggunakannya
- Jika SLS dengan nomor yang sama di Desa yang sama sudah ada, sistem akan mengabaikannya

### Success Message
Setelah import berhasil, admin akan melihat pesan:
```
X data wilayah kerja berhasil diimport.
```

Contoh: `15 data wilayah kerja berhasil diimport.`

## File yang Diubah

### Backend
- `app/Http/Controllers/WilayahKerjaController.php` - Tambah method `import()`
- `routes/web.php` - Tambah route `POST /wilayah-kerja/import`

### Frontend
- `resources/js/Pages/Admin/WilayahKerja/Index.jsx`
  - Tambah import `XLSX` library
  - Tambah state untuk import
  - Tambah functions: `handleDownloadTemplate()`, `handleFileChange()`, `handleImportSubmit()`, `closeImportModal()`
  - Tambah button "Import Excel" di header
  - Tambah modal import dialog

## Teknologi yang Digunakan

### Frontend
- **React** - Framework UI
- **XLSX** (SheetJS) - Library untuk membaca dan membuat file Excel

### Backend
- **Laravel** - Framework PHP
- **Eloquent ORM** - Database query builder

## Catatan Penting

1. **Urutan Data**: Tidak perlu diurutkan, sistem akan menangani relasi secara otomatis
2. **Duplikasi**: Data yang sama tidak akan dibuat 2x, gunakan ini untuk update
3. **Performa**: Untuk import besar (>1000 baris), gunakan batch processing
4. **Backup**: Selalu backup data sebelum melakukan import massal
5. **Testing**: Test dengan data minimal terlebih dahulu sebelum import data besar

## Support dan Troubleshooting

Jika mengalami masalah:
1. Periksa format file Excel (.xlsx atau .xls)
2. Pastikan nama kolom sesuai (case-sensitive)
3. Lihat console browser untuk error detail (F12 > Console)
4. Cek file logs Laravel di `storage/logs/`
5. Hubungi technical support dengan screenshot error

---

**Version**: 1.0  
**Last Updated**: 2026-06-01  
**Author**: Admin System
