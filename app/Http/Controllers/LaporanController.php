<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use App\Models\Laporan;
use App\Models\Survei;
use App\Models\Pcl;
use App\Models\Pml;

class LaporanController extends Controller
{
    use AuthorizesRequests;
    /**
     * Tampilkan list laporan sesuai role
     * - Admin : semua laporan
     * - PML   : laporan milik PML-nya saja
     * - PCL   : laporan milik PCL-nya saja
     */
    public function index()
    {
        $user  = Auth::user();
        $query = Laporan::with(['survei', 'pcl', 'pml']);

        if ($user->role === 'PML') {
            $pml   = $user->pml;
            $query->where('pml_id', $pml->id);
        } elseif ($user->role === 'PCL') {
            $pcl   = $user->pcl;
            $query->where('pcl_id', $pcl->id);
        }

        $laporans = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($laporan) {
                return [
                    'id'           => $laporan->id,
                    'nama_survei'  => $laporan->survei->nama_survei ?? '-',
                    'survei_id'    => $laporan->survei_id,
                    'nama_pcl'     => $laporan->pcl->nama_pcl ?? '-',
                    'pcl_id'       => $laporan->pcl_id,
                    'nama_pml'     => $laporan->pml->nama_pml ?? '-',
                    'pml_id'       => $laporan->pml_id,
                    'tanggal'      => $laporan->tanggal,
                    'data_usaha'   => $laporan->data_usaha,
                    'data_keluarga'=> $laporan->data_keluarga,
                    'data_submit'  => $laporan->data_submit,
                ];
            });

        // Data untuk dropdown form tambah laporan (PCL)
        $surveis = [];
        $pmlBySurvei = [];

        if ($user->role === 'PCL') {
            $pcl     = $user->pcl;
            // Ambil survei yang terhubung dengan PCL ini melalui relasi many-to-many
            $surveis = $pcl->surveis()
                ->select('survei.id', 'survei.nama_survei')
                ->get();

            // Bangun mapping survei -> PML berdasarkan relasi PCL -> PML -> Survei
            $pmlBySurvei = $pcl->pmls()->with('surveis')->get()
                ->flatMap(function ($pml) {
                    return $pml->surveis->map(fn ($survei) => [
                        'survei_id' => $survei->id,
                        'pml_id'    => $pml->id,
                        'nama_pml'  => $pml->nama_pml,
                    ]);
                })
                ->unique('survei_id')
                ->mapWithKeys(fn ($item) => [$item['survei_id'] => [
                    'id'       => $item['pml_id'],
                    'nama_pml' => $item['nama_pml'],
                ]])->toArray();
        } elseif ($user->role === 'admin') {
            $surveis = Survei::select('id', 'nama_survei')->get();
        }

        return Inertia::render('Laporan/Index', [
            'laporans'     => $laporans,
            'surveis'      => $surveis,
            'pmlBySurvei'  => $pmlBySurvei,
            'role'         => $user->role,
        ]);
    }

    /**
     * Simpan laporan baru — hanya PCL
     */
    public function store(Request $request)
    {
        $this->authorize('create', Laporan::class);

        $user = Auth::user();
        $pcl  = $user->pcl;

        $request->validate([
            'survei_id'    => 'required|exists:survei,id',
            'pml_id'       => 'required|exists:pml,id',
            'tanggal'      => 'required|date',
            'data_usaha'   => 'required|integer|min:0',
            'data_keluarga'=> 'required|integer|min:0',
            'data_submit'  => 'required|integer|min:0',
        ], [
            'survei_id.required'     => 'Survei wajib dipilih.',
            'survei_id.exists'       => 'Survei tidak ditemukan.',
            'pml_id.required'        => 'PML wajib diisi. Pilih survei terlebih dahulu.',
            'pml_id.exists'          => 'PML tidak ditemukan.',
            'tanggal.required'       => 'Tanggal wajib diisi.',
            'data_usaha.required'    => 'Data usaha wajib diisi.',
            'data_usaha.integer'     => 'Data usaha harus berupa angka.',
            'data_keluarga.required' => 'Data keluarga wajib diisi.',
            'data_keluarga.integer'  => 'Data keluarga harus berupa angka.',
            'data_submit.required'   => 'Data submit wajib diisi.',
            'data_submit.integer'    => 'Data submit harus berupa angka.',
        ]);

        $survei = Survei::findOrFail($request->survei_id);

        if ($user->role === 'PCL' && $pcl) {
            $validPml = $pcl->pmls()
                ->where('pml.id', $request->pml_id)
                ->whereHas('surveis', fn ($query) => $query->where('survei.id', $request->survei_id))
                ->exists();

            if (!$validPml) {
                return redirect()->back()->with('error', 'PML tidak valid untuk survei yang dipilih.');
            }
        }

        Laporan::create([
            'survei_id'    => $request->survei_id,
            'pcl_id'       => $pcl?->id,
            'pml_id'       => $request->pml_id,
            'tanggal'      => $request->tanggal,
            'data_usaha'   => $request->data_usaha,
            'data_keluarga'=> $request->data_keluarga,
            'data_submit'  => $request->data_submit,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil ditambahkan.');
    }

    /**
     * Tampilkan detail laporan tertentu
     */
    public function show($id)
    {
        $laporan = Laporan::with(['survei', 'pcl', 'pml'])->findOrFail($id);

        return response()->json([
            'id'           => $laporan->id,
            'survei_id'    => $laporan->survei_id,
            'nama_survei'  => $laporan->survei->nama_survei ?? '-',
            'pcl_id'       => $laporan->pcl_id,
            'nama_pcl'     => $laporan->pcl->nama_pcl ?? '-',
            'pml_id'       => $laporan->pml_id,
            'nama_pml'     => $laporan->pml->nama_PML ?? '-',
            'tanggal'      => $laporan->tanggal,
            'data_usaha'   => $laporan->data_usaha,
            'data_keluarga'=> $laporan->data_keluarga,
            'data_submit'  => $laporan->data_submit,
        ]);
    }

    /**
     * Update laporan — hanya PML
     */
    public function update(Request $request, $id)
    {
        $laporan = Laporan::findOrFail($id);

        $this->authorize('update', $laporan);

        $request->validate([
            'tanggal'      => 'required|date',
            'data_usaha'   => 'required|integer|min:0',
            'data_keluarga'=> 'required|integer|min:0',
            'data_submit'  => 'nullable|integer|min:0',
        ], [
            'tanggal.required'       => 'Tanggal wajib diisi.',
            'data_usaha.required'    => 'Data usaha wajib diisi.',
            'data_usaha.integer'     => 'Data usaha harus berupa angka.',
            'data_keluarga.required' => 'Data keluarga wajib diisi.',
            'data_keluarga.integer'  => 'Data keluarga harus berupa angka.',
        ]);

        $laporan->update([
            'tanggal'      => $request->tanggal,
            'data_usaha'   => $request->data_usaha,
            'data_keluarga'=> $request->data_keluarga,
            'data_submit'  => $request->data_submit ?? $laporan->data_submit,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil diperbarui.');
    }

    /**
     * Hapus laporan — hanya PML
     */
    public function destroy($id)
    {
        $laporan = Laporan::findOrFail($id);

        $this->authorize('delete', $laporan);
        $laporan->delete();

        return redirect()->back()->with('success', 'Laporan berhasil dihapus.');
    }
}
