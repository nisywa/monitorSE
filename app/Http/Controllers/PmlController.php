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
        $pmls = Pml::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pml) {
                return [
                    'id'            => $pml->id,
                    'nama_PML'      => $pml->nama_pml,
                    'tanggal_lahir' => $pml->tanggal_lahir,
                    'email'         => $pml->user->email ?? '-',
                    'total_pcl'     => $pml->pcl()->count(),
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
        // $request->validate([
        //     'nama'          => 'required|string|max:255',
        //     'email'         => 'required|email|unique:users,email',
        //     'password'      => 'required|min:6',
        //     'tanggal_lahir' => 'required|date',
        // ], [
        //     'nama.required'          => 'Nama PML wajib diisi.',
        //     'email.required'         => 'Email wajib diisi.',
        //     'email.unique'           => 'Email sudah digunakan.',
        //     'password.required'      => 'Password wajib diisi.',
        //     'password.min'           => 'Password minimal 6 karakter.',
        //     'tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
        // ]);

        // DB::transaction(function () use ($request) {
        //     // Simpan ke tabel users
        //     $user = User::create([
        //         'nama'     => $request->nama,
        //         'email'    => $request->email,
        //         'password' => Hash::make($request->password),
        //         'role'     => 'PML',
        //     ]);

        //     // Simpan ke tabel pmls
        //     Pml::create([
        //         'user_id'       => $user->id,
        //         'nama_pml'      => $request->nama,
        //         'tanggal_lahir' => $request->tanggal_lahir,
        //     ]);
        // });

        // return redirect()->back()->with('success', 'Data PML berhasil ditambahkan.');
       
        ///// UPDATE CODE
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

    // ✅ Generate password otomatis dari tanggal lahir (format: YYYYMMDD)
    $password = str_replace('-', '', $request->tanggal_lahir);

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

    // ✅ Kirim info password ke frontend lewat flash message
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
        // $pml = Pml::with('user')->findOrFail($id);

        // $request->validate([
        //     'nama'          => 'required|string|max:255',
        //     'email'         => 'required|email|unique:users,email,' . $pml->user->id,
        //     'tanggal_lahir' => 'required|date',
        //     'password'      => 'nullable|min:6',
        // ], [
        //     'nama.required'          => 'Nama PML wajib diisi.',
        //     'email.required'         => 'Email wajib diisi.',
        //     'email.unique'           => 'Email sudah digunakan.',
        //     'tanggal_lahir.required' => 'Tanggal lahir wajib diisi.',
        //     'password.min'           => 'Password minimal 6 karakter.',
        // ]);

        // DB::transaction(function () use ($request, $pml) {
        //     // Update tabel users
        //     $userData = [
        //         'nama'  => $request->nama,
        //         'email' => $request->email,
        //     ];
        //     if ($request->filled('password')) {
        //         $userData['password'] = Hash::make($request->password);
        //     }
        //     $pml->user->update($userData);

        //     // Update tabel pmls
        //     $pml->update([
        //         'nama_pml'      => $request->nama,
        //         'tanggal_lahir' => $request->tanggal_lahir,
        //     ]);
        // });

        // return redirect()->back()->with('success', 'Data PML berhasil diperbarui.');
        ///// UPDATE CODE

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

    DB::transaction(function () use ($request, $pml) {
        $pml->user->update([
            'nama'  => $request->nama,
            'email' => $request->email,
        ]);

        // ✅ Jika tanggal lahir diubah, reset password sesuai tanggal baru
        if ($request->tanggal_lahir !== $pml->tanggal_lahir) {
            $newPassword = str_replace('-', '', $request->tanggal_lahir);
            $pml->user->update(['password' => Hash::make($newPassword)]);
        }

        $pml->update([
            'nama_pml'      => $request->nama,
            'tanggal_lahir' => $request->tanggal_lahir,
        ]);
    });

    $msg = 'Data PML berhasil diperbarui.';
    if ($request->tanggal_lahir !== $pml->getOriginal('tanggal_lahir')) {
        $newPassword = str_replace('-', '', $request->tanggal_lahir);
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
            // Hapus user (cascade akan hapus pml juga karena foreign key)
            $pml->user->delete();
        });

        return redirect()->back()->with('success', 'Data PML berhasil dihapus.');
    }
}
