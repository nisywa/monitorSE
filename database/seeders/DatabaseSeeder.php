<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    // {
    //     // User::factory(10)->create();

    //     User::factory()->create([
    //         'name' => 'Test User',
    //         'email' => 'test@example.com',
    //     ]);
    // }
     {
        // Buat admin jika belum ada
        if (!User::where('email', 'admin@admin.com')->exists()) {
            User::create([
                'nama'     => 'Administrator',
                'email'    => 'admin@admin.com',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
            ]);
        }

        // Jalankan PmlSeeder untuk menambahkan 10 PML
        $this->call(PmlSeeder::class);
    }
}
