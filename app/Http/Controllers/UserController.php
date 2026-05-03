<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Pcl;
use App\Models\Pml;

class UserController extends Controller
{
    //membuat akun PCL/PML
    public function storePcl(Request $request)
    {
        $data = $request->validate([
            'nama_pcl' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'pml_id' => 'required|exists:pml,id',
            'tanggal_lahir' => 'required|date',
            'asal_kecamatan' => 'required|string',
            'blok_sensus' => 'required|string',
        ]);

        DB::transaction(function () use ($data) {
            $user = User::create([
                'nama' => $data['nama_pcl'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'PCL',
            ]);
            Pcl::create([
                'user_id' => $user->id,
                'pml_id'  => $data['pml_id'],
                'nama_pcl'=> $data['nama_pcl'],
                'tanggal_lahir' => $data['tanggal_lahir'],
                'asal_kecamatan'=> $data['asal_kecamatan'],
                'blok_sensus'   => $data['blok_sensus'],
            ]);
        });

        return response()->json(['message' => 'Akun PCL berhasil dibuat'], 201);
    }

    //membuat akun PML
    public function storePml(Request $request)
    {
        $data = $request->validate([
            'nama_pml' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'kabupaten' => 'required|string|max:255',
            'kecamatan' => 'required|string|max:255',
            'nomor_telepon' => 'required|string|max:15',
        ]);

        DB::transaction(function () use ($data) {
            $user = User::create([
                'nama' => $data['nama_pml'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'PML',
            ]);
            Pml::create([
                'user_id' => $user->id,
                'nama_pml' => $data['nama_pml'],
                'kabupaten' => $data['kabupaten'],
                'kecamatan' => $data['kecamatan'],
                'nomor_telepon' => $data['nomor_telepon'],
            ]);
        });

        return response()->json(['message' => 'Akun PML berhasil dibuat'], 201);
    }
}