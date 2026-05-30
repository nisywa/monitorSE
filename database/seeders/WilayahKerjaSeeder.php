<?php

namespace Database\Seeders;

use App\Models\Kecamatan;
use App\Models\Desa;
use App\Models\Sls;
use Illuminate\Database\Seeder;

class WilayahKerjaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Data Kecamatan di Kabupaten Pinrang
        $kecamatanList = [
            'Mattiro Sompe',
            'Mattirotasi',
            'Watang Sawitto',
            'Lembang',
            'Cempa',
            'Suppa',
            'Duampanua',
            'Tondong Tallasa',
            'Simembe',
            'Lanrisang',
            'Aras',
            'Kota Baru',
            'Bulu Teppu',
            'Paleteang',
            'Polewali',
            'Subang',
            'Ininnawa',
        ];

        // Data Desa untuk setiap Kecamatan (contoh dengan 3-4 desa per kecamatan)
        $desaByKecamatan = [
            'Mattiro Sompe' => ['Sompe', 'Pateangpanua', 'Tembung', 'Puntilang'],
            'Mattirotasi' => ['Mattirotasi', 'Tabiyan', 'Macege', 'Punratan'],
            'Watang Sawitto' => ['Sawitto', 'Langnga', 'Puncak', 'Salama'],
            'Lembang' => ['Lembang', 'Lebbak Lare', 'Tande', 'Bolo'],
            'Cempa' => ['Cempa', 'Salumangka', 'Rappang', 'Tepang'],
            'Suppa' => ['Suppa', 'Buntu', 'Poleang', 'Labakkang'],
            'Duampanua' => ['Duampanua', 'Lanrebba', 'Mattutung', 'Dammangewa'],
            'Tondong Tallasa' => ['Tondong Tallasa', 'Tondong', 'Kampung Baru', 'Manggalewa'],
            'Simembe' => ['Simembe', 'Salaokka', 'Dusun Baru', 'Pattiro'],
            'Lanrisang' => ['Lanrisang', 'Passukkang', 'Balang Baru', 'Tapalang'],
            'Aras' => ['Aras', 'Mangkubumen', 'Salegadeng', 'Tanjong'],
            'Kota Baru' => ['Kota Baru', 'Benteng', 'Bulu', 'Pasir'],
            'Bulu Teppu' => ['Bulu Teppu', 'Bulu', 'Labakka', 'Loaya'],
            'Paleteang' => ['Paleteang', 'Galangan', 'Bulu Loe', 'Bora'],
            'Polewali' => ['Polewali', 'Somba Opu', 'Matakali', 'Lompo'],
            'Subang' => ['Subang', 'Balang Loe', 'Salassa', 'Tanjung'],
            'Ininnawa' => ['Ininnawa', 'Lebuh', 'Saluwaya', 'Tanjung Batu'],
        ];

        // Create kecamatan and their desa and sls
        foreach ($kecamatanList as $namaKecamatan) {
            $kecamatan = Kecamatan::create([
                'nama' => $namaKecamatan,
                'kabupaten' => 'Pinrang',
                'provinsi' => 'Sulawesi Selatan',
            ]);

            // Get desa for this kecamatan
            $desaList = $desaByKecamatan[$namaKecamatan] ?? [];

            foreach ($desaList as $namaDesa) {
                $desa = Desa::create([
                    'kecamatan_id' => $kecamatan->id,
                    'nama' => $namaDesa,
                ]);

                // Create 3-5 SLS for each desa
                for ($i = 1; $i <= rand(3, 5); $i++) {
                    Sls::create([
                        'desa_id' => $desa->id,
                        'nomor_sls' => sprintf('%s%02d%02d', str_pad($kecamatan->id, 2, '0', STR_PAD_LEFT), $desa->id % 100, $i),
                        'jumlah_rumah_tangga' => rand(15, 45),
                    ]);
                }
            }
        }

        $this->command->info('Data Kecamatan, Desa, dan SLS untuk Kabupaten Pinrang berhasil ditambahkan!');
    }
}
