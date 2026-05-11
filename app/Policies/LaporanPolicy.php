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
     * PML atau PCL pemilik laporan dapat update laporan
     */
    public function update(User $user, Laporan $laporan = null): bool
    {
        if ($user->role === 'PML') {
            return true;
        }

        if ($user->role === 'PCL' && $laporan) {
            return $laporan->pcl_id === $user->pcl?->id;
        }

        return false;
    }

    /**
     * PML atau PCL pemilik laporan dapat hapus laporan
     */
    public function delete(User $user, Laporan $laporan = null): bool
    {
        if ($user->role === 'PML') {
            return true;
        }

        if ($user->role === 'PCL' && $laporan) {
            return $laporan->pcl_id === $user->pcl?->id;
        }

        return false;
    }

    /**
     * Admin, PML, PCL bisa melihat laporan
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'PML', 'PCL']);
    }
}
