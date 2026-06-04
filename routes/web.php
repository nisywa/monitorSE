<?php

//use Illuminate\Support\Facades\Route;

// Route::get('/', function () {
//     return view('welcome');
// });



use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PmlController;
use App\Http\Controllers\PclController;
use App\Http\Controllers\SurveiController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\WilayahKerjaController;
use App\Http\Controllers\DebugController;

/*
|--------------------------------------------------------------------------
| Route Publik (tanpa login)
|-----------------------------------------------------------------------
*/
Route::get('/', fn() => redirect()->route('login'));

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');

/*
|--------------------------------------------------------------------------
| Route Terproteksi (harus login)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {

    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/chart-data', [DashboardController::class, 'getChartData'])->name('dashboard.chart-data');
    Route::get('/api/dashboard/chart-data-by-pml', [DashboardController::class, 'getChartDataByPml'])->name('dashboard.chart-data-by-pml');
    Route::get('/api/dashboard/stats-by-location', [DashboardController::class, 'getStatsByLocation'])->name('dashboard.stats-by-location');

    // DEBUG Routes (untuk troubleshooting relasi user-pcl-laporan)
    Route::get('/debug/pcl-laporan', [DebugController::class, 'debugPclLaporan'])->name('debug.pcl-laporan');
    Route::get('/debug/all-laporan', [DebugController::class, 'debugAllLaporan'])->name('debug.all-laporan');

    /*
    |------------------------------------------------------------------
    | Route Admin only
    |------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {

        // Manajemen PML
        Route::get('/manajemen-pml', [PmlController::class, 'index'])->name('pml.index');
        Route::post('/manajemen-pml', [PmlController::class, 'store'])->name('pml.store');
        Route::post('/manajemen-pml/import', [PmlController::class, 'import'])->name('manajemen-pml.import');
        Route::get('/manajemen-pml/{id}', [PmlController::class, 'show'])->name('pml.show');
        Route::put('/manajemen-pml/{id}', [PmlController::class, 'update'])->name('pml.update');
        Route::delete('/manajemen-pml/{id}', [PmlController::class, 'destroy'])->name('pml.destroy');

        // Manajemen PCL
        Route::get('/manajemen-pcl', [PclController::class, 'index'])->name('pcl.index');
        Route::post('/manajemen-pcl', [PclController::class, 'store'])->name('pcl.store');
        Route::get('/manajemen-pcl/export/{surveiId}', [PclController::class, 'exportExcel'])->name('pcl.export');
        Route::post('/manajemen-pcl/blast-whatsapp-reminder', [PclController::class, 'blastWhatsAppReminder'])->name('pcl.blast-whatsapp');
        Route::get('/manajemen-pcl/test-blast-whatsapp', [PclController::class, 'testBlastWhatsApp'])->name('pcl.test-blast-whatsapp');
        Route::get('/manajemen-pcl/send-whatsapp', [PclController::class, 'sendIndividualWhatsApp'])->name('pcl.send-whatsapp');
        Route::get('/manajemen-pcl/template', [PclController::class, 'downloadTemplate'])->name('pcl.template');
        Route::post('/manajemen-pcl/import', [PclController::class, 'importExcel'])->name('pcl.import');
        Route::get('/manajemen-pcl/{id}', [PclController::class, 'show'])->name('pcl.show');
        Route::put('/manajemen-pcl/{id}', [PclController::class, 'update'])->name('pcl.update');
        Route::delete('/manajemen-pcl/{id}', [PclController::class, 'destroy'])->name('pcl.destroy');


        // Manajemen Survei
        Route::get('/manajemen-survei', [SurveiController::class, 'index'])->name('survei.index');
        Route::post('/manajemen-survei', [SurveiController::class, 'store'])->name('survei.store');
        Route::get('/manajemen-survei/{id}/detail', [SurveiController::class, 'detail'])->name('survei.detail');
        Route::get('/manajemen-survei/{surveiId}/pcl/{pclId}/laporan', [SurveiController::class, 'laporanPcl'])->name('survei.laporanPcl');
        Route::get('/manajemen-survei/{id}', [SurveiController::class, 'show'])->name('survei.show');
        Route::put('/manajemen-survei/{id}', [SurveiController::class, 'update'])->name('survei.update');
        Route::delete('/manajemen-survei/{id}', [SurveiController::class, 'destroy'])->name('survei.destroy');

        // Data per Level (Admin)
        Route::get('/data-per-level', [LaporanController::class, 'dataPerLevel'])->name('data-per-level.index');

        // Wilayah Kerja
        Route::get('/wilayah-kerja', [WilayahKerjaController::class, 'index'])->name('wilayah-kerja.index');
        
        // Kecamatan CRUD
        Route::post('/api/wilayah-kerja/kecamatan', [WilayahKerjaController::class, 'storeKecamatan'])->name('kecamatan.store');
        Route::put('/api/wilayah-kerja/kecamatan/{id}', [WilayahKerjaController::class, 'updateKecamatan'])->name('kecamatan.update');
        Route::delete('/api/wilayah-kerja/kecamatan/{id}', [WilayahKerjaController::class, 'destroyKecamatan'])->name('kecamatan.destroy');
        
        // Desa CRUD
        Route::post('/api/wilayah-kerja/desa', [WilayahKerjaController::class, 'storeDesa'])->name('desa.store');
        Route::put('/api/wilayah-kerja/desa/{id}', [WilayahKerjaController::class, 'updateDesa'])->name('desa.update');
        Route::delete('/api/wilayah-kerja/desa/{id}', [WilayahKerjaController::class, 'destroyDesa'])->name('desa.destroy');
        
        // SLS CRUD
        Route::post('/api/wilayah-kerja/sls', [WilayahKerjaController::class, 'storeSls'])->name('sls.store');
        Route::put('/api/wilayah-kerja/sls/{id}', [WilayahKerjaController::class, 'updateSls'])->name('sls.update');
        Route::delete('/api/wilayah-kerja/sls/{id}', [WilayahKerjaController::class, 'destroySls'])->name('sls.destroy');

        // Import Wilayah Kerja
        Route::post('/wilayah-kerja/import', [WilayahKerjaController::class, 'import'])->name('wilayah-kerja.import');
    });

    // Wilayah Kerja API untuk dropdown kecamatan/desa/sls (PCL juga bisa akses)
    Route::get('/api/wilayah-kerja/kecamatan-list', [WilayahKerjaController::class, 'getKecamatanList'])->name('wilayah-kerja.kecamatan-list');
    Route::get('/api/wilayah-kerja/desa/{kecamatanId}', [WilayahKerjaController::class, 'getDesaByKecamatan'])->name('wilayah-kerja.desa');
    Route::get('/api/wilayah-kerja/sls/{desaId}', [WilayahKerjaController::class, 'getSlsByDesa'])->name('wilayah-kerja.sls');

    /*
    |------------------------------------------------------------------
    | Route Laporan (akses berbeda per role)
    |------------------------------------------------------------------
    */
    // Admin & PML & PCL bisa melihat list laporan
    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::get('/laporan/{id}', [LaporanController::class, 'show'])->name('laporan.show');

    // Hanya PCL yang bisa tambah laporan
    Route::post('/laporan', [LaporanController::class, 'store'])
        ->middleware('role:PCL')
        ->name('laporan.store');

    // Hanya PML atau PCL pemilik laporan yang bisa edit dan hapus laporan
    Route::put('/laporan/{id}', [LaporanController::class, 'update'])
        ->middleware('role:PML,PCL')
        ->name('laporan.update');

    Route::delete('/laporan/{id}', [LaporanController::class, 'destroy'])
        ->middleware('role:PML,PCL')
        ->name('laporan.destroy');
});

