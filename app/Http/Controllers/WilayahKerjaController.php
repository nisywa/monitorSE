<?php

namespace App\Http\Controllers;

use App\Models\Kecamatan;
use App\Models\Desa;
use App\Models\Sls;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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

    /**
     * Import data Wilayah Kerja (Kecamatan, Desa, SLS) dari Excel
     */
    public function import(Request $request)
    {
        $request->validate([
            'rows'                          => 'required|array|min:1',
            'rows.*.kecamatan'              => 'required|string|max:255',
            'rows.*.desa'                   => 'required|string|max:255',
            'rows.*.sls'                    => 'required|string|max:255',
        ], [
            'rows.required'                 => 'Data import tidak boleh kosong.',
            'rows.*.kecamatan.required'     => 'Nama kecamatan wajib diisi.',
            'rows.*.desa.required'          => 'Nama desa wajib diisi.',
            'rows.*.sls.required'           => 'Nomor SLS wajib diisi.',
        ]);

        $rows = $request->rows;
        $berhasil = 0;
        $errors = [];

        try {
            DB::transaction(function () use ($rows, &$berhasil, &$errors) {
                foreach ($rows as $idx => $row) {
                    $rowNum = $idx + 1;
                    $namaKecamatan = trim($row['kecamatan']);
                    $namaDesa = trim($row['desa']);
                    $nomorSls = trim($row['sls']);

                    try {
                        // Cari atau buat kecamatan
                        $kecamatan = Kecamatan::firstOrCreate(
                            [
                                'nama' => $namaKecamatan,
                                'kabupaten' => 'Pinrang',
                                'provinsi' => 'Sulawesi Selatan'
                            ]
                        );

                        // Cari atau buat desa
                        $desa = Desa::firstOrCreate(
                            [
                                'kecamatan_id' => $kecamatan->id,
                                'nama' => $namaDesa
                            ]
                        );

                        // Cari atau buat SLS (dengan unique nomor_sls)
                        $slsExists = Sls::where('desa_id', $desa->id)
                            ->where('nomor_sls', $nomorSls)
                            ->exists();

                        if (!$slsExists) {
                            Sls::create([
                                'desa_id' => $desa->id,
                                'nomor_sls' => $nomorSls,
                            ]);
                        }

                        $berhasil++;
                    } catch (\Exception $e) {
                        $errors[] = "Baris {$rowNum}: {$e->getMessage()}";
                    }
                }
            });

            $message = "{$berhasil} data wilayah kerja berhasil diimport.";
            if (!empty($errors)) {
                $message .= " Beberapa baris gagal: " . implode(', ', array_slice($errors, 0, 3));
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengimport data: ' . $e->getMessage());
        }
    }
}
