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
        ->get();

    // Flatten: 1 baris per kombinasi PCL + Survei
    $rows = [];
    foreach ($pcls as $pcl) {
        if ($pcl->surveis->isEmpty()) {
            // PCL tanpa survei tetap ditampilkan
            $rows[] = [
                'id'             => $pcl->id . '_0',
                'pcl_id'         => $pcl->id,
                'nama_PCL'       => $pcl->nama_pcl,
                'tanggal_lahir'  => $pcl->tanggal_lahir,
                'asal_kecamatan' => $pcl->asal_kecamatan,
                'blok_sensus'    => $pcl->blok_sensus,
                'email'          => $pcl->user->email ?? '-',
                'survei_id'      => null,
                'nama_survei'    => '-',
                'pml_id'         => null,
                'nama_pml'       => '-',
            ];
        } else {
            foreach ($pcl->surveis as $survei) {
                // Cari PML yang terkait dengan survei ini
                $pml = $pcl->pmls->firstWhere('pivot.survei_id', $survei->id)
                    ?? $pcl->pmls->first(); // fallback jika pivot tidak ada survei_id

                $rows[] = [
                    'id'             => $pcl->id . '_' . $survei->id,
                    'pcl_id'         => $pcl->id,
                    'nama_PCL'       => $pcl->nama_pcl,
                    'tanggal_lahir'  => $pcl->tanggal_lahir,
                    'asal_kecamatan' => $pcl->asal_kecamatan,
                    'blok_sensus'    => $pcl->blok_sensus,
                    'email'          => $pcl->user->email ?? '-',
                    'survei_id'      => $survei->id,
                    'nama_survei'    => $survei->nama_survei,
                    'pml_id'         => $pml?->id,
                    'nama_pml'       => $pml?->nama_pml ?? '-',
                ];
            }
        }
    }

    $pmls = Pml::with('surveis')->select('id', 'nama_pml')
        ->orderBy('nama_pml')
        ->get()
        ->map(fn($pml) => [
            'id'         => $pml->id,
            'nama_PML'   => $pml->nama_pml,
            'survei_ids' => $pml->surveis->pluck('id')->toArray(),
        ]);

    $surveis = Survei::select('id', 'nama_survei')
        ->orderBy('nama_survei')
        ->get()
        ->map(fn($s) => ['id' => $s->id, 'nama_survei' => $s->nama_survei]);

    return Inertia::render('Admin/ManajemenPCL', [
        'pcls'    => $rows,
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
        'email'          => 'required|email',
        'pml_id'         => 'required|exists:pml,id',
        'survei_id'      => 'required|exists:survei,id',
        'tanggal_lahir'  => 'required|date',
        'asal_kecamatan' => 'required|string|max:255',
        'blok_sensus'    => 'required|string|max:255',
    ], [
        'nama.required'           => 'Nama PCL wajib diisi.',
        'email.required'          => 'Email wajib diisi.',
        'pml_id.required'         => 'PML wajib dipilih.',
        'survei_id.required'      => 'Survei wajib dipilih.',
        'tanggal_lahir.required'  => 'Tanggal lahir wajib diisi.',
        'asal_kecamatan.required' => 'Asal kecamatan wajib diisi.',
        'blok_sensus.required'    => 'Blok sensus wajib diisi.',
    ]);

    $generatedPassword = date('dmY', strtotime($request->tanggal_lahir));

    DB::transaction(function () use ($request, $generatedPassword) {
        // Cek apakah user dengan email ini sudah ada
        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Pastikan role-nya PCL
            if ($user->role !== 'PCL') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'Email ini sudah digunakan oleh akun dengan role lain.',
                ]);
            }

            // Ambil data PCL yang sudah ada
            $pcl = Pcl::where('user_id', $user->id)->first();

            if (!$pcl) {
                // Jika user ada tapi data PCL belum, buat baru
                $pcl = Pcl::create([
                    'user_id'        => $user->id,
                    'nama_pcl'       => $request->nama,
                    'tanggal_lahir'  => $request->tanggal_lahir,
                    'asal_kecamatan' => $request->asal_kecamatan,
                    'blok_sensus'    => $request->blok_sensus,
                ]);
            }

            // Cek apakah PCL ini sudah terdaftar di survei yang dipilih
            if ($pcl->surveis()->where('survei_id', $request->survei_id)->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'survei_id' => 'PCL ini sudah terdaftar di survei yang dipilih.',
                ]);
            }

            // Tambahkan relasi survei & PML baru (attach, bukan sync)
            $pcl->surveis()->attach($request->survei_id);
            $pcl->pmls()->attach($request->pml_id);

        } else {
            // User belum ada, buat user baru
            $user = User::create([
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make($generatedPassword),
                'role'     => 'PCL',
            ]);

            $pcl = Pcl::create([
                'user_id'        => $user->id,
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'blok_sensus'    => $request->blok_sensus,
            ]);

            $pcl->pmls()->attach($request->pml_id);
            $pcl->surveis()->attach($request->survei_id);
        }
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
            'pml_id'         => $pcl->pmls->first()?->id,
            'survei_id'      => $pcl->surveis->first()?->id,
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
            'pml_id'         => 'required|exists:pml,id',
            'survei_id'      => 'required|exists:survei,id',
            'tanggal_lahir'  => 'required|date',
            'asal_kecamatan' => 'required|string|max:255',
            'blok_sensus'    => 'required|string|max:255',
            'password'       => 'nullable|min:6',
        ], [
            'nama.required'           => 'Nama PCL wajib diisi.',
            'email.required'          => 'Email wajib diisi.',
            'email.unique'            => 'Email sudah digunakan.',
            'pml_id.required'         => 'PML wajib dipilih.',
            'pml_id.exists'           => 'PML tidak ditemukan.',
            'survei_id.required'      => 'Survei wajib dipilih.',
            'survei_id.exists'        => 'Survei tidak ditemukan.',
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
            $pcl->pmls()->sync([$request->pml_id]);

            // Update relasi dengan Survei (sync untuk replace)
            $pcl->surveis()->sync([$request->survei_id]);
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
