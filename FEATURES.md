# Fitur Pinrang Monitoring Survei dan Sensus

## 🎯 Ringkasan Fitur

Aplikasi ini adalah sistem informasi untuk manajemen dan monitoring survei/sensus dengan dukungan multi-pengguna (Admin, PML, PCL).

---

## ✨ Fitur Utama

### 1. Import Data Wilayah Kerja (NEW)

Memungkinkan admin untuk mengimpor data Kecamatan, Desa, dan SLS dari file Excel dengan validasi otomatis.

**Lokasi Menu:** Admin > Manajemen Area Kerja > Wilayah Kerja

**Fitur:**
- ✅ Download template Excel
- ✅ Validasi otomatis (format, duplikat, relasi)
- ✅ Preview data sebelum impor
- ✅ Transaction-based insertion untuk konsistensi
- ✅ Error reporting yang detail
- ✅ Automatic kabupaten/provinsi assignment

**Cara Penggunaan:**

1. **Download Template**
   - Klik tombol "Download Template" 
   - Template Excel akan terunduh dengan format:
     ```
     | Kabupaten | Provinsi | Kecamatan | Desa | SLS |
     |-----------|----------|-----------|------|-----|
     | Pinrang   | Sulsel   | Kec. Xxx  | Desa Xxx | 01 |
     ```

2. **Isi Data**
   - Isi data sesuai dengan template
   - Minimal 1 baris data (header tidak dihitung)
   - Jangan ubah nama kolom

3. **Import Data**
   - Klik "Import Data"
   - Pilih file Excel yang sudah diisi
   - Sistem akan membaca dan memvalidasi data

4. **Preview & Konfirmasi**
   - Review data di preview
   - Jika ada error, akan ditampilkan pesan error
   - Klik "Konfirmasi Import" untuk melanjutkan

5. **Selesai**
   - Data berhasil disimpan ke database
   - Notifikasi success akan muncul

**Backend Logic:**
- Endpoint: `POST /wilayah-kerja/import`
- Controller: `WilayahKerjaController@import`
- Validasi: 
  - Kolom wajib: kabupaten, provinsi, kecamatan, desa, sls
  - Tipe data: string untuk semua kolom
  - Format: Kecamatan/Desa tidak boleh kosong

**Database:**
- Model: `Kecamatan`, `Desa`, `Sls`
- Strategy: `firstOrCreate` untuk prevent duplicates
- Transaction: Semua data diimpor dalam 1 transaksi

---

### 2. Responsive Design (NEW)

Aplikasi sekarang fully responsive dengan dukungan untuk semua jenis device.

**Breakpoints:**
- **Mobile** (`< 640px`): Sidebar tersembunyi, menu overlay
- **Tablet** (`640px - 1024px`): Sidebar mini, menu adaptif
- **Desktop** (`> 1024px`): Full sidebar, layout optimal

**Fitur Responsif:**
- ✅ Sidebar otomatis tutup di mobile
- ✅ Mobile overlay/backdrop
- ✅ Header responsif (padding, font-size)
- ✅ Content area adaptif
- ✅ Touch-friendly buttons
- ✅ Readable font sizes untuk semua ukuran

**Tailwind Classes:**
```
sm:   # Small screens (640px)
md:   # Medium screens (768px)  
lg:   # Large screens (1024px)
```

**Contoh:**
```jsx
{/* Hidden on mobile, visible on tablet+ */}
<div className="hidden md:block">Logo Text</div>

{/* Responsive padding */}
<div className="p-4 md:p-6 lg:p-8">Content</div>

{/* Responsive font size */}
<h1 className="text-sm md:text-base lg:text-lg">Title</h1>
```

---

### 3. Role-Based Menu System (IMPROVED)

Setiap role memiliki menu yang disesuaikan dengan tanggung jawab mereka.

**Admin Menus (5 Kategori):**

1. **Dashboard**
   - Dashboard (Link ke halaman dashboard)

2. **Data & Laporan**
   - Data per Level

3. **Manajemen Area Kerja**
   - Wilayah Kerja (Import data Kecamatan/Desa/SLS)

4. **Manajemen Survei**
   - Manajemen Survei

5. **Manajemen SDM**
   - Manajemen PML
   - Manajemen PCL

**PML Menus (2 Kategori):**
1. Dashboard
   - Dashboard
2. Laporan
   - Laporan

**PCL Menus (2 Kategori):**
1. Dashboard
   - Dashboard
2. Laporan
   - Laporan

**Menu Features:**
- ✅ Kategori grouping untuk organisasi lebih baik
- ✅ Ikon untuk setiap menu item
- ✅ Active state highlighting
- ✅ Hover effects
- ✅ Smooth transitions
- ✅ Tooltip pada sidebar collapsed

---

### 4. Auto-Collapse Sidebar

Sidebar otomatis menyesuaikan dengan ukuran layar.

**Behavior:**
- Mobile (`< 768px`): Sidebar hidden by default, toggle dengan button
- Tablet+ (`>= 768px`): Sidebar visible, dapat di-toggle
- Mobile overlay: Backdrop otomatis muncul saat sidebar open
- Smooth animation: Transition 300ms

**Click Handler:**
- Menu link otomatis menutup sidebar di mobile
- Toggle button untuk membuka/tutup sidebar
- Click outside (backdrop) menutup sidebar

---

## 🏗️ Struktur File

### Frontend (React/Inertia)

```
resources/js/
├── Layouts/
│   └── MainLayout.jsx           # Layout responsif untuk semua role
│       ├── Mobile detection (useEffect)
│       ├── Sidebar dengan category menus
│       ├── Header responsif
│       └── Main content area
│
└── Pages/
    ├── Admin/
    │   ├── Dashboard.jsx
    │   └── WilayahKerja/
    │       ├── Index.jsx         # List wilayah kerja
    │       └── ...
    ├── PML/
    │   ├── Dashboard.jsx
    │   └── Laporan/
    │       ├── Index.jsx
    │       └── ...
    └── PCL/
        ├── Dashboard.jsx
        └── Laporan/
            ├── Index.jsx
            └── ...
```

### Backend (Laravel)

```
app/Http/Controllers/
├── WilayahKerjaController.php
│   ├── index()          # List wilayah kerja
│   ├── downloadTemplate() # Download template Excel
│   └── import()         # Import dari Excel
├── LaporanController.php
├── DashboardController.php
└── ...

app/Models/
├── Kecamatan.php        # Model kecamatan
├── Desa.php             # Model desa
├── Sls.php              # Model SLS
├── Survei.php
├── Laporan.php
├── User.php
└── ...
```

---

## 🔧 Tech Stack

### Frontend
- **React 18+** - UI library
- **Inertia.js** - Server-driven components
- **Tailwind CSS 3+** - Styling & responsive design
- **XLSX/SheetJS** - Excel file handling
- **Lucide React** - Icons (optional)

### Backend
- **Laravel 11+** - PHP framework
- **Eloquent ORM** - Database query builder
- **Database Transactions** - Data integrity
- **Middleware** - Role-based auth
- **SQLite** - Database (development)

---

## 📝 Catatan Teknis

### MainLayout.jsx Components

1. **State Management**
   ```jsx
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const [isMobile, setIsMobile] = useState(false);
   ```

2. **Mobile Detection Hook**
   ```jsx
   useEffect(() => {
       const handleResize = () => {
           const mobile = window.innerWidth < 768;
           setIsMobile(mobile);
           if (mobile) setSidebarOpen(false);
       };
       window.addEventListener('resize', handleResize);
       return () => window.removeEventListener('resize', handleResize);
   }, []);
   ```

3. **Menu Structure**
   ```jsx
   const adminMenus = [
       {
           category: 'Category Name',
           items: [
               { label: 'Menu Label', href: '/path', icon: <SVG /> }
           ]
       }
   ];
   ```

4. **Responsive Classes**
   - `md:hidden` - Hide on tablet+
   - `md:relative` - Relative positioning on tablet+
   - `md:translate-x-0` - Show on tablet+ (sidebar)
   - `md:w-64` - Full width on tablet+
   - `p-4 md:p-6` - Responsive padding
   - `text-sm md:text-base` - Responsive font size

---

## 🚀 Setup & Deployment

### Requirements
- PHP 8.2+
- Node.js 18+
- Composer
- npm/yarn

### Installation
```bash
# Clone repository
git clone <repo-url>
cd MonitorSE

# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed

# Build assets
npm run build

# Development server
php artisan serve
npm run dev
```

---

## 📋 Checklist Fitur

- [x] Import data Wilayah Kerja (Kecamatan/Desa/SLS)
- [x] Download template Excel
- [x] Validasi data import
- [x] Responsive design (mobile/tablet/desktop)
- [x] Auto-collapse sidebar
- [x] Role-based menus
- [x] Category-based menu organization
- [x] Active state highlighting
- [x] Smooth transitions
- [ ] Dark mode (planned)
- [ ] Mobile app (planned)
- [ ] Real-time collaboration (planned)

---

## 🐛 Known Issues & Troubleshooting

### Sidebar tidak responsive
- **Solusi:** Pastikan `window.innerWidth < 768` dideteksi dengan benar
- Check: Open developer tools, run `window.innerWidth`

### Import gagal dengan error
- **Solusi:** Pastikan format Excel sesuai dengan template
- Cek: Jumlah kolom, nama kolom, tipe data

### Menu tidak muncul
- **Solusi:** Pastikan role user sudah diset dengan benar
- Check: Database table `users`, kolom `role`

---

## 📞 Support

Untuk bantuan atau pertanyaan:
- Hubungi admin
- Buat issue di repository
- Check dokumentasi di README.md

---

**Last Updated:** 2024  
**Version:** 1.0.0
