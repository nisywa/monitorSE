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
    //membuat akun PCL
    public function storePcl(Request $request)
    {
        $data = $request->validate([
            'nama_pcl' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'pml_id' => 'required|exists:pml,id',
            'tanggal_lahir' => 'required|date',
            'asal_kecamatan' => 'required|string',
            'blok_sensus' => 'required|string',
        ]);

        // Generate password otomatis dari tanggal lahir (DDMMYYYY)
        $generatedPassword = date('dmY', strtotime($data['tanggal_lahir']));

        DB::transaction(function () use ($data, $generatedPassword) {
            $user = User::create([
                'nama' => $data['nama_pcl'],
                'email' => $data['email'],
                'password' => Hash::make($generatedPassword),
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

        return response()->json([
            'message' => 'Akun PCL berhasil dibuat',
            'password' => $generatedPassword,
            'note' => 'Password otomatis generate dari tanggal lahir (DDMMYYYY)'
        ], 201);
    }

    //membuat akun PML
    public function storePml(Request $request)
    {
        $data = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'tanggal_lahir' => 'required|date',
        ]);

        // Generate password otomatis dari tanggal lahir (DDMMYYYY)
        $generatedPassword = date('dmY', strtotime($data['tanggal_lahir']));

        DB::transaction(function () use ($data, $generatedPassword) {
            $user = User::create([
                'nama' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($generatedPassword),
                'role' => 'PML',
            ]);
            Pml::create([
                'user_id' => $user->id,
                'nama_pml' => $data['nama'],
                'tanggal_lahir' => $data['tanggal_lahir'],
            ]);
        });

        return response()->json([
            'message' => 'Akun PML berhasil dibuat',
            'password' => $generatedPassword,
            'note' => 'Password otomatis generate dari tanggal lahir (DDMMYYYY)'
        ], 201);
    }
}