<?php

namespace App\Providers;

use App\Models\Laporan;
use App\Policies\LaporanPolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
         Gate::policy(Laporan::class, LaporanPolicy::class);
    }
}
