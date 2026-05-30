<?php

namespace App\Http\Controllers;

use App\Models\Kecamatan;
use App\Models\Desa;
use App\Models\Sls;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WilayahKerjaController extends Controller
{
    /**
     * Display all kecamatan for Kabupaten Pinrang.
     */
    public function index()
    {
        $kecamatan = Kecamatan::where('kabupaten', 'Pinrang')
            ->where('provinsi', 'Sulawesi Selatan')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Admin/WilayahKerja/Index', [
            'kecamatan' => $kecamatan,
        ]);
    }

    /**
     * Get list of kecamatan for Pinrang (API endpoint).
     */
    public function getKecamatanList()
    {
        $kecamatan = Kecamatan::where('kabupaten', 'Pinrang')
            ->where('provinsi', 'Sulawesi Selatan')
            ->orderBy('nama')
            ->get(['id', 'nama']);

        return response()->json([
            'success' => true,
            'data' => $kecamatan,
        ]);
    }

    /**
     * Get desa by kecamatan ID.
     */
    public function getDesaByKecamatan($kecamatanId)
    {
        $desa = Desa::where('kecamatan_id', $kecamatanId)
            ->orderBy('nama')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $desa,
        ]);
    }

    /**
     * Get SLS by desa ID.
     */
    public function getSlsByDesa($desaId)
    {
        $sls = Sls::where('desa_id', $desaId)
            ->orderBy('nomor_sls')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sls,
        ]);
    }

    /**
     * Store a new kecamatan.
     */
    public function storeKecamatan(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        try {
            Kecamatan::create([
                'nama' => $validated['nama'],
                'kabupaten' => 'Pinrang',
                'provinsi' => 'Sulawesi Selatan',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kecamatan berhasil ditambahkan',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan kecamatan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a kecamatan.
     */
    public function updateKecamatan(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        try {
            $kecamatan = Kecamatan::findOrFail($id);
            $kecamatan->update(['nama' => $validated['nama']]);

            return response()->json([
                'success' => true,
                'message' => 'Kecamatan berhasil diperbarui',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui kecamatan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a kecamatan.
     */
    public function destroyKecamatan($id)
    {
        try {
            $kecamatan = Kecamatan::findOrFail($id);
            $kecamatan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Kecamatan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus kecamatan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a new desa.
     */
    public function storeDesa(Request $request)
    {
        $validated = $request->validate([
            'kecamatan_id' => 'required|exists:kecamatan,id',
            'nama' => 'required|string|max:255',
        ]);

        try {
            Desa::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Desa berhasil ditambahkan',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan desa: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a desa.
     */
    public function updateDesa(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        try {
            $desa = Desa::findOrFail($id);
            $desa->update(['nama' => $validated['nama']]);

            return response()->json([
                'success' => true,
                'message' => 'Desa berhasil diperbarui',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui desa: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a desa.
     */
    public function destroyDesa($id)
    {
        try {
            $desa = Desa::findOrFail($id);
            $desa->delete();

            return response()->json([
                'success' => true,
                'message' => 'Desa berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus desa: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a new SLS.
     */
    public function storeSls(Request $request)
    {
        $validated = $request->validate([
            'desa_id' => 'required|exists:desa,id',
            'nomor_sls' => 'required|string|max:255|unique:sls,nomor_sls',
            'jumlah_rumah_tangga' => 'nullable|integer|min:0',
        ]);

        try {
            Sls::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'SLS berhasil ditambahkan',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan SLS: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update SLS.
     */
    public function updateSls(Request $request, $id)
    {
        $validated = $request->validate([
            'nomor_sls' => 'required|string|max:255|unique:sls,nomor_sls,' . $id,
            'jumlah_rumah_tangga' => 'nullable|integer|min:0',
        ]);

        try {
            $sls = Sls::findOrFail($id);
            $sls->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'SLS berhasil diperbarui',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui SLS: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete SLS.
     */
    public function destroySls($id)
    {
        try {
            $sls = Sls::findOrFail($id);
            $sls->delete();

            return response()->json([
                'success' => true,
                'message' => 'SLS berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus SLS: ' . $e->getMessage(),
            ], 500);
        }
    }
}
