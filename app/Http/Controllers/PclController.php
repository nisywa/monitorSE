<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Pcl;
use App\Models\Pml;

class PclController extends Controller
{
    /**
     * Tampilkan list semua PCL
     */
    public function index()
    {
        $pcls = Pcl::with(['user', 'pml'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pcl) {
                return [
                    'id'              => $pcl->id,
                    'nama_pcl'        => $pcl->nama_pcl,
                    'tanggal_lahir'   => $pcl->tanggal_lahir,
                    'asal_kecamatan'  => $pcl->asal_kecamatan,
                    'blok_sensus'     => $pcl->blok_sensus,
                    'email'           => $pcl->user->email ?? '-',
                    'nama_pml'        => $pcl->pml->nama_pml ?? '-',
                    'pml_id'          => $pcl->pml_id,
                ];
            });

        // Ambil daftar PML untuk dropdown
        $pmls = Pml::select('id', 'nama_pml')->orderBy('nama_pml')->get();

        return Inertia::render('Admin/ManajemenPCL', [
            'pcls' => $pcls,
            'pmls' => $pmls,
        ]);
    }

    /**
     * Simpan data PCL baru (sekaligus buat akun user)
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|min:6',
            'pml_id'         => 'required|exists:pmls,id',
            'tanggal_lahir'  => 'required|date',
            'asal_kecamatan' => 'required|string|max:255',
            'blok_sensus'    => 'required|string|max:255',
        ], [
            'nama.required'           => 'Nama PCL wajib diisi.',
            'email.required'          => 'Email wajib diisi.',
            'email.unique'            => 'Email sudah digunakan.',
            'password.required'       => 'Password wajib diisi.',
            'password.min'            => 'Password minimal 6 karakter.',
            'pml_id.required'         => 'PML wajib dipilih.',
            'pml_id.exists'           => 'PML tidak ditemukan.',
            'tanggal_lahir.required'  => 'Tanggal lahir wajib diisi.',
            'asal_kecamatan.required' => 'Asal kecamatan wajib diisi.',
            'blok_sensus.required'    => 'Blok sensus wajib diisi.',
        ]);

        DB::transaction(function () use ($request) {
            // Simpan ke tabel users
            $user = User::create([
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'PCL',
            ]);

            // Simpan ke tabel pcls
            Pcl::create([
                'user_id'        => $user->id,
                'pml_id'         => $request->pml_id,
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'blok_sensus'    => $request->blok_sensus,
            ]);
        });

        return redirect()->back()->with('success', 'Data PCL berhasil ditambahkan.');
    }

    /**
     * Tampilkan data PCL tertentu (untuk form edit)
     */
    public function show($id)
    {
        $pcl = Pcl::with('user')->findOrFail($id);

        return response()->json([
            'id'             => $pcl->id,
            'nama_pcl'       => $pcl->nama_pcl,
            'tanggal_lahir'  => $pcl->tanggal_lahir,
            'asal_kecamatan' => $pcl->asal_kecamatan,
            'blok_sensus'    => $pcl->blok_sensus,
            'pml_id'         => $pcl->pml_id,
            'email'          => $pcl->user->email,
        ]);
    }

    /**
     * Update data PCL
     */
    public function update(Request $request, $id)
    {
        $pcl = Pcl::with('user')->findOrFail($id);

        $request->validate([
            'nama'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email,' . $pcl->user->id,
            'pml_id'         => 'required|exists:pmls,id',
            'tanggal_lahir'  => 'required|date',
            'asal_kecamatan' => 'required|string|max:255',
            'blok_sensus'    => 'required|string|max:255',
            'password'       => 'nullable|min:6',
        ], [
            'nama.required'           => 'Nama PCL wajib diisi.',
            'email.required'          => 'Email wajib diisi.',
            'email.unique'            => 'Email sudah digunakan.',
            'pml_id.required'         => 'PML wajib dipilih.',
            'tanggal_lahir.required'  => 'Tanggal lahir wajib diisi.',
            'asal_kecamatan.required' => 'Asal kecamatan wajib diisi.',
            'blok_sensus.required'    => 'Blok sensus wajib diisi.',
            'password.min'            => 'Password minimal 6 karakter.',
        ]);

        DB::transaction(function () use ($request, $pcl) {
            // Update tabel users
            $userData = [
                'nama'  => $request->nama,
                'email' => $request->email,
            ];
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $pcl->user->update($userData);

            // Update tabel pcls
            $pcl->update([
                'pml_id'         => $request->pml_id,
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'blok_sensus'    => $request->blok_sensus,
            ]);
        });

        return redirect()->back()->with('success', 'Data PCL berhasil diperbarui.');
    }

    /**
     * Hapus data PCL (dan user terkait)
     */
    public function destroy($id)
    {
        $pcl = Pcl::with('user')->findOrFail($id);

        DB::transaction(function () use ($pcl) {
            $pcl->user->delete();
        });

        return redirect()->back()->with('success', 'Data PCL berhasil dihapus.');
    }
}
