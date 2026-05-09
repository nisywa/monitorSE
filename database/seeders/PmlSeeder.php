<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Pml;

class PmlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pmlData = [
            [
                'nama' => 'Ahmad Ridho',
                'email' => 'ahmad.ridho@example.com',
                'tanggal_lahir' => '1990-05-15',
            ],
            [
                'nama' => 'Budi Santoso',
                'email' => 'budi.santoso@example.com',
                'tanggal_lahir' => '1992-08-22',
            ],
            [
                'nama' => 'Citra Dewi',
                'email' => 'citra.dewi@example.com',
                'tanggal_lahir' => '1994-03-10',
            ],
            [
                'nama' => 'Doni Hermawan',
                'email' => 'doni.hermawan@example.com',
                'tanggal_lahir' => '1989-11-30',
            ],
            [
                'nama' => 'Eka Putri',
                'email' => 'eka.putri@example.com',
                'tanggal_lahir' => '1995-07-18',
            ],
            [
                'nama' => 'Farid Aziz',
                'email' => 'farid.aziz@example.com',
                'tanggal_lahir' => '1991-01-25',
            ],
            [
                'nama' => 'Gina Maulida',
                'email' => 'gina.maulida@example.com',
                'tanggal_lahir' => '1993-09-12',
            ],
            [
                'nama' => 'Hendra Wijaya',
                'email' => 'hendra.wijaya@example.com',
                'tanggal_lahir' => '1988-06-08',
            ],
            [
                'nama' => 'Indra Kusuma',
                'email' => 'indra.kusuma@example.com',
                'tanggal_lahir' => '1996-04-20',
            ],
            [
                'nama' => 'Jasmine Sari',
                'email' => 'jasmine.sari@example.com',
                'tanggal_lahir' => '1997-12-05',
            ],
        ];

        foreach ($pmlData as $data) {
            // Generate password dari tanggal lahir (format: YYYYMMDD -> DDMMYYYY)
            $tanggalBagian = explode('-', $data['tanggal_lahir']);
            $password = $tanggalBagian[2] . $tanggalBagian[1] . $tanggalBagian[0];

            // Buat user terlebih dahulu
            $user = User::create([
                'nama' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($password),
                'role' => 'PML',
            ]);

            // Buat PML
            Pml::create([
                'user_id' => $user->id,
                'nama_pml' => $data['nama'],
                'tanggal_lahir' => $data['tanggal_lahir'],
            ]);
        }

        $this->command->info('10 PML berhasil ditambahkan!');
    }
}
