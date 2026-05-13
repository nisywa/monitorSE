<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Pml;

class PmlController extends Controller
{
    /**
     * Tampilkan list semua PML
     */
    public function index()
    {
        $pmls = Pml::with(['user', 'pcls'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pml) {
                return [
                    'id'            => $pml->id,
                    'nama_PML'      => $pml->nama_pml,
                    'tanggal_lahir' => $pml->tanggal_lahir,
                    'email'         => $pml->user->email ?? '-',
                    'total_pcl'     => $pml->pcls->count(),
                ];
            });

        return Inertia::render('Admin/ManajemenPML', [
            'pmls' => $pmls,
        ]);
    }

    /**
     * Simpan data PML baru (sekaligus buat akun user)
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'tanggal_lahir' => 'required|date',
        ], [
            'nama.required'          => 'Nama PML wajib diisi.',
            'email.required'         => 'Email wajib diisi.',
            'email.unique'           => 'Email sudah digunakan.',
            'tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
        ]);

        // Generate password otomatis dari tanggal lahir (format: DDMMYYYY)
        $tanggalLahir = \Carbon\Carbon::createFromFormat('Y-m-d', $request->tanggal_lahir);
        $password = $tanggalLahir->format('dmY');

        DB::transaction(function () use ($request, $password) {
            $user = User::create([
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make($password),
                'role'     => 'PML',
            ]);

            Pml::create([
                'user_id'       => $user->id,
                'nama_pml'      => $request->nama,
                'tanggal_lahir' => $request->tanggal_lahir,
            ]);
        });

        return redirect()->back()->with('success', "PML berhasil ditambahkan. Password default: {$password}");
    }

    /**
     * Tampilkan data PML tertentu (untuk form edit)
     */
    public function show($id)
    {
        $pml = Pml::with('user')->findOrFail($id);

        return response()->json([
            'id'            => $pml->id,
            'nama_pml'      => $pml->nama_pml,
            'tanggal_lahir' => $pml->tanggal_lahir,
            'email'         => $pml->user->email,
        ]);
    }

    /**
     * Update data PML
     */
    public function update(Request $request, $id)
    {
        $pml = Pml::with('user')->findOrFail($id);

        $request->validate([
            'nama'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email,' . $pml->user->id,
            'tanggal_lahir' => 'required|date',
        ], [
            'nama.required'          => 'Nama PML wajib diisi.',
            'email.required'         => 'Email wajib diisi.',
            'email.unique'           => 'Email sudah digunakan.',
            'tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
        ]);

        $tanggalBerubah = $request->tanggal_lahir !== $pml->tanggal_lahir;

        DB::transaction(function () use ($request, $pml, $tanggalBerubah) {
            $pml->user->update([
                'nama'  => $request->nama,
                'email' => $request->email,
            ]);

            // Jika tanggal lahir diubah, reset password sesuai tanggal baru
            if ($tanggalBerubah) {
                $newPassword = \Carbon\Carbon::createFromFormat('Y-m-d', $request->tanggal_lahir)->format('dmY');
                $pml->user->update(['password' => Hash::make($newPassword)]);
            }

            $pml->update([
                'nama_pml'      => $request->nama,
                'tanggal_lahir' => $request->tanggal_lahir,
            ]);
        });

        $msg = 'Data PML berhasil diperbarui.';
        if ($tanggalBerubah) {
            $newPassword = \Carbon\Carbon::createFromFormat('Y-m-d', $request->tanggal_lahir)->format('dmY');
            $msg .= " Password direset menjadi: {$newPassword}";
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Hapus data PML (dan user terkait)
     */
    public function destroy($id)
    {
        $pml = Pml::with('user')->findOrFail($id);

        DB::transaction(function () use ($pml) {
            $pml->user->delete();
        });

        return redirect()->back()->with('success', 'Data PML berhasil dihapus.');
    }

    /**
     * Import data PML dari Excel (dikirim sebagai JSON rows dari frontend)
     */
    public function import(Request $request)
    {
        $request->validate([
            'rows'                    => 'required|array|min:1',
            'rows.*.nama'             => 'required|string|max:255',
            'rows.*.email'            => 'required|email|distinct|unique:users,email',
            'rows.*.tanggal_lahir'    => 'required|date',
        ], [
            'rows.required'              => 'Data import tidak boleh kosong.',
            'rows.*.nama.required'       => 'Nama PML wajib diisi.',
            'rows.*.email.required'      => 'Email wajib diisi.',
            'rows.*.email.email'         => 'Format email tidak valid.',
            'rows.*.email.distinct'      => 'Terdapat email duplikat dalam file Excel.',
            'rows.*.email.unique'        => 'Email sudah terdaftar di sistem.',
            'rows.*.tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
            'rows.*.tanggal_lahir.date'  => 'Format tanggal lahir tidak valid.',
        ]);

        $rows = $request->rows;
        $berhasil = 0;

        DB::transaction(function () use ($rows, &$berhasil) {
            foreach ($rows as $row) {
                // Generate password dari tanggal lahir (DDMMYYYY)
                $password = \Carbon\Carbon::createFromFormat('Y-m-d', $row['tanggal_lahir'])->format('dmY');

                $user = User::create([
                    'nama'     => $row['nama'],
                    'email'    => $row['email'],
                    'password' => Hash::make($password),
                    'role'     => 'PML',
                ]);

                Pml::create([
                    'user_id'       => $user->id,
                    'nama_pml'      => $row['nama'],
                    'tanggal_lahir' => $row['tanggal_lahir'],
                ]);

                $berhasil++;
            }
        });

        return redirect()->back()->with('success', "{$berhasil} data PML berhasil diimport. Password masing-masing PML adalah tanggal lahir dalam format DDMMYYYY.");
    }
}
