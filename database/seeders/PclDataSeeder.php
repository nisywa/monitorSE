<?php

namespace Database\Seeders;

use App\Models\Pcl;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class PclDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('id_ID');

        // Daftar desa dummy
        $desaList = [
            'Desa Merdeka',
            'Desa Sentosa',
            'Desa Sejahtera',
            'Desa Jaya',
            'Desa Bahagia',
            'Desa Aman',
            'Desa Damai',
            'Desa Makmur',
        ];

        // Update semua PCL records dengan dummy data jika belum ada
        $pcls = Pcl::all();

        foreach ($pcls as $pcl) {
            // Hanya update jika kolom masih kosong
            if (empty($pcl->desa) || empty($pcl->sls) || empty($pcl->sobat_id) || empty($pcl->no_telp)) {
                $pcl->update([
                    'desa'     => $pcl->desa ?? $faker->randomElement($desaList),
                    'sls'      => $pcl->sls ?? $faker->numerify('###.##.##'),
                    'sobat_id' => $pcl->sobat_id ?? $faker->numerify('SOBAT#######'),
                    'no_telp'  => $pcl->no_telp ?? $faker->phoneNumber(),
                ]);
            }
        }

        $this->command->info('PCL data dummy berhasil ditambahkan.');
    }
}
