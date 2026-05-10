<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Pcl;
use App\Models\Survei;
use App\Models\Pml;

class PclController extends Controller
{
    /**
     * Tampilkan list semua PCL
     */
    public function index()
    {
        $pcls = Pcl::with(['user', 'pmls', 'surveis'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pcl) {
                return [
                    'id'              => $pcl->id,
                    'nama_PCL'        => $pcl->nama_pcl,
                    'tanggal_lahir'   => $pcl->tanggal_lahir,
                    'asal_kecamatan'  => $pcl->asal_kecamatan,
                    'blok_sensus'     => $pcl->blok_sensus,
                    'email'           => $pcl->user->email ?? '-',
                    'pmls'            => $pcl->pmls->map(fn($pml) => ['id' => $pml->id, 'nama_pml' => $pml->nama_pml])->toArray(),
                    'surveis'         => $pcl->surveis->map(fn($s) => ['id' => $s->id, 'nama_survei' => $s->nama_survei])->toArray(),
                ];
            });

        // Ambil daftar PML untuk dropdown
        $pmls = Pml::select('id', 'nama_pml')
            ->orderBy('nama_pml')
            ->get()
            ->map(function ($pml) {
                return [
                    'id'        => $pml->id,
                    'nama_PML'  => $pml->nama_pml,
                ];
            });

        // Ambil daftar Survei untuk dropdown
        $surveis = Survei::select('id', 'nama_survei')
            ->orderBy('nama_survei')
            ->get()
            ->map(function ($s) {
                return [
                    'id'           => $s->id,
                    'nama_survei'  => $s->nama_survei,
                ];
            });

        return Inertia::render('Admin/ManajemenPCL', [
            'pcls'    => $pcls,
            'pmls'    => $pmls,
            'surveis' => $surveis,
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
            'pml_ids'        => 'required|array|min:1',
            'pml_ids.*'      => 'exists:pml,id',
            'survei_ids'     => 'required|array|min:1',
            'survei_ids.*'   => 'exists:survei,id',
            'tanggal_lahir'  => 'required|date',
            'asal_kecamatan' => 'required|string|max:255',
            'blok_sensus'    => 'required|string|max:255',
        ], [
            'nama.required'           => 'Nama PCL wajib diisi.',
            'email.required'          => 'Email wajib diisi.',
            'email.unique'            => 'Email sudah digunakan.',
            'pml_ids.required'        => 'PML wajib dipilih minimal satu.',
            'pml_ids.min'             => 'PML wajib dipilih minimal satu.',
            'pml_ids.*.exists'        => 'Salah satu PML tidak ditemukan.',
            'survei_ids.required'     => 'Survei wajib dipilih minimal satu.',
            'survei_ids.min'          => 'Survei wajib dipilih minimal satu.',
            'survei_ids.*.exists'     => 'Salah satu Survei tidak ditemukan.',
            'tanggal_lahir.required'  => 'Tanggal lahir wajib diisi.',
            'asal_kecamatan.required' => 'Asal kecamatan wajib diisi.',
            'blok_sensus.required'    => 'Blok sensus wajib diisi.',
        ]);

        // Generate password otomatis dari tanggal lahir (DDMMYYYY)
        $generatedPassword = date('dmY', strtotime($request->tanggal_lahir));

        DB::transaction(function () use ($request, $generatedPassword) {
            // Simpan ke tabel users
            $user = User::create([
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make($generatedPassword),
                'role'     => 'PCL',
            ]);

            // Simpan ke tabel pcl
            $pcl = Pcl::create([
                'user_id'        => $user->id,
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'blok_sensus'    => $request->blok_sensus,
            ]);

            // Tambahkan relasi many-to-many dengan PML
            $pcl->pmls()->attach($request->pml_ids);

            // Tambahkan relasi many-to-many dengan Survei
            $pcl->surveis()->attach($request->survei_ids);
        });

        return redirect()->back()->with('success', "Data PCL berhasil ditambahkan. Password default: {$generatedPassword}");
    }

    /**
     * Tampilkan data PCL tertentu (untuk form edit)
     */
    public function show($id)
    {
        $pcl = Pcl::with(['user', 'pmls', 'surveis'])->findOrFail($id);

        return response()->json([
            'id'             => $pcl->id,
            'nama_pcl'       => $pcl->nama_pcl,
            'tanggal_lahir'  => $pcl->tanggal_lahir,
            'asal_kecamatan' => $pcl->asal_kecamatan,
            'blok_sensus'    => $pcl->blok_sensus,
            'pml_ids'        => $pcl->pmls->pluck('id')->toArray(),
            'survei_ids'     => $pcl->surveis->pluck('id')->toArray(),
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
            'pml_ids'        => 'required|array|min:1',
            'pml_ids.*'      => 'exists:pml,id',
            'survei_ids'     => 'required|array|min:1',
            'survei_ids.*'   => 'exists:survei,id',
            'tanggal_lahir'  => 'required|date',
            'asal_kecamatan' => 'required|string|max:255',
            'blok_sensus'    => 'required|string|max:255',
            'password'       => 'nullable|min:6',
        ], [
            'nama.required'           => 'Nama PCL wajib diisi.',
            'email.required'          => 'Email wajib diisi.',
            'email.unique'            => 'Email sudah digunakan.',
            'pml_ids.required'        => 'PML wajib dipilih minimal satu.',
            'pml_ids.min'             => 'PML wajib dipilih minimal satu.',
            'pml_ids.*.exists'        => 'Salah satu PML tidak ditemukan.',
            'survei_ids.required'     => 'Survei wajib dipilih minimal satu.',
            'survei_ids.min'          => 'Survei wajib dipilih minimal satu.',
            'survei_ids.*.exists'     => 'Salah satu Survei tidak ditemukan.',
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

            // Update tabel pcl
            $pcl->update([
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'blok_sensus'    => $request->blok_sensus,
            ]);

            // Update relasi dengan PML (sync untuk replace)
            $pcl->pmls()->sync($request->pml_ids);

            // Update relasi dengan Survei (sync untuk replace)
            $pcl->surveis()->sync($request->survei_ids);
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
