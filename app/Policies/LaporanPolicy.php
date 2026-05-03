<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Laporan;

class LaporanPolicy
{
    /**
     * Hanya PCL yang bisa membuat laporan
     */
    public function create(User $user): bool
    {
        return $user->role === 'PCL';
    }

    /**
     * Hanya PML yang bisa update laporan
     */
    public function update(User $user, Laporan $laporan = null): bool
    {
        return $user->role === 'PML';
    }

    /**
     * Hanya PML yang bisa hapus laporan
     */
    public function delete(User $user, Laporan $laporan = null): bool
    {
        return $user->role === 'PML';
    }

    /**
     * Admin, PML, PCL bisa melihat laporan
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'PML', 'PCL']);
    }
}
