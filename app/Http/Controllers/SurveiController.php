<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Survei;
use App\Models\Pml;

class SurveiController extends Controller
{
    /**
     * Tampilkan list semua survei
     */
    public function index()
    {
        $surveis = Survei::with('pml')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($survei) {
                return [
                    'id'               => $survei->id,
                    'nama_survei'      => $survei->nama_survei,
                    'tanggal_mulai'    => $survei->tanggal_mulai,
                    'tanggal_selesai'  => $survei->tanggal_selesai,
                    'nama_pml'         => $survei->pml->nama_pml ?? '-',
                    'pml_id'           => $survei->pml_id,
                    'total_laporan'    => $survei->laporans()->count(),
                    'status'           => $this->getStatus($survei->tanggal_mulai, $survei->tanggal_selesai),
                ];
            });

        // Daftar PML untuk dropdown
        $pmls = Pml::select('id', 'nama_pml')->orderBy('nama_pml')->get();

        return Inertia::render('Admin/ManajemenSurvei', [
            'surveis' => $surveis,
            'pmls'    => $pmls,
        ]);
    }

    /**
     * Simpan data survei baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_survei'     => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'pml_id'          => 'required|exists:pmls,id',
        ], [
            'nama_survei.required'     => 'Nama survei wajib diisi.',
            'tanggal_mulai.required'   => 'Tanggal mulai wajib diisi.',
            'tanggal_selesai.required' => 'Tanggal selesai wajib diisi.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'pml_id.required'          => 'PML wajib dipilih.',
            'pml_id.exists'            => 'PML tidak ditemukan.',
        ]);

        Survei::create([
            'nama_survei'     => $request->nama_survei,
            'tanggal_mulai'   => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'pml_id'          => $request->pml_id,
        ]);

        return redirect()->back()->with('success', 'Survei berhasil ditambahkan.');
    }

    /**
     * Tampilkan data survei tertentu (untuk form edit)
     */
    public function show($id)
    {
        $survei = Survei::with('pml')->findOrFail($id);

        return response()->json([
            'id'              => $survei->id,
            'nama_survei'     => $survei->nama_survei,
            'tanggal_mulai'   => $survei->tanggal_mulai,
            'tanggal_selesai' => $survei->tanggal_selesai,
            'pml_id'          => $survei->pml_id,
        ]);
    }

    /**
     * Update data survei
     */
    public function update(Request $request, $id)
    {
        $survei = Survei::findOrFail($id);

        $request->validate([
            'nama_survei'     => 'required|string|max:255',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'pml_id'          => 'required|exists:pmls,id',
        ], [
            'nama_survei.required'     => 'Nama survei wajib diisi.',
            'tanggal_mulai.required'   => 'Tanggal mulai wajib diisi.',
            'tanggal_selesai.required' => 'Tanggal selesai wajib diisi.',
            'tanggal_selesai.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai.',
            'pml_id.required'          => 'PML wajib dipilih.',
        ]);

        $survei->update([
            'nama_survei'     => $request->nama_survei,
            'tanggal_mulai'   => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'pml_id'          => $request->pml_id,
        ]);

        return redirect()->back()->with('success', 'Survei berhasil diperbarui.');
    }

    /**
     * Hapus data survei
     */
    public function destroy($id)
    {
        $survei = Survei::findOrFail($id);

        // Cek apakah ada laporan yang terkait
        if ($survei->laporans()->count() > 0) {
            return redirect()->back()->withErrors([
                'error' => 'Survei tidak bisa dihapus karena masih memiliki laporan terkait.'
            ]);
        }

        $survei->delete();

        return redirect()->back()->with('success', 'Survei berhasil dihapus.');
    }

    /**
     * Helper: Tentukan status survei berdasarkan tanggal
     */
    private function getStatus($tanggalMulai, $tanggalSelesai): string
    {
        $today = now()->toDateString();

        if ($today < $tanggalMulai) {
            return 'Belum Mulai';
        } elseif ($today > $tanggalSelesai) {
            return 'Selesai';
        } else {
            return 'Berlangsung';
        }
    }
}
