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

    /*
    |------------------------------------------------------------------
    | Route Admin only
    |------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {

        // Manajemen PML
        Route::get('/manajemen-pml', [PmlController::class, 'index'])->name('pml.index');
        Route::post('/manajemen-pml', [PmlController::class, 'store'])->name('pml.store');
        Route::get('/manajemen-pml/{id}', [PmlController::class, 'show'])->name('pml.show');
        Route::put('/manajemen-pml/{id}', [PmlController::class, 'update'])->name('pml.update');
        Route::delete('/manajemen-pml/{id}', [PmlController::class, 'destroy'])->name('pml.destroy');

        // Manajemen PCL
        Route::get('/manajemen-pcl', [PclController::class, 'index'])->name('pcl.index');
        Route::post('/manajemen-pcl', [PclController::class, 'store'])->name('pcl.store');
        Route::get('/manajemen-pcl/{id}', [PclController::class, 'show'])->name('pcl.show');
        Route::put('/manajemen-pcl/{id}', [PclController::class, 'update'])->name('pcl.update');
        Route::delete('/manajemen-pcl/{id}', [PclController::class, 'destroy'])->name('pcl.destroy');

        // Manajemen Survei
        Route::get('/manajemen-survei', [SurveiController::class, 'index'])->name('survei.index');
        Route::post('/manajemen-survei', [SurveiController::class, 'store'])->name('survei.store');
        Route::get('/manajemen-survei/{id}/detail', [SurveiController::class, 'detail'])->name('survei.detail');
        Route::get('/manajemen-survei/{id}', [SurveiController::class, 'show'])->name('survei.show');
        Route::put('/manajemen-survei/{id}', [SurveiController::class, 'update'])->name('survei.update');
        Route::delete('/manajemen-survei/{id}', [SurveiController::class, 'destroy'])->name('survei.destroy');
    });

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

    // Hanya PML yang bisa edit dan hapus laporan
    Route::put('/laporan/{id}', [LaporanController::class, 'update'])
        ->middleware('role:PML')
        ->name('laporan.update');

    Route::delete('/laporan/{id}', [LaporanController::class, 'destroy'])
        ->middleware('role:PML')
        ->name('laporan.destroy');
});

