<?php

// File test untuk debugging

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');
$response = $kernel->handle(
    $request = \Illuminate\Http\Request::capture()
);

// Load models
use App\Models\Pml;
use App\Models\Pcl;
use App\Models\Survei;

echo "=== DEBUG DATA ===\n\n";

echo "Total PML: " . Pml::count() . "\n";
echo "Total PCL: " . Pcl::count() . "\n";
echo "Total Survei: " . Survei::count() . "\n\n";

// Lihat PML pertama dengan PCL-nya
$pml = Pml::first();
if ($pml) {
    echo "PML Pertama: " . $pml->nama_pml . "\n";
    echo "  - ID: " . $pml->id . "\n";
    echo "  - PCL yang dimiliki: " . $pml->pcls->count() . "\n";
    foreach ($pml->pcls as $pcl) {
        echo "    - " . $pcl->nama_pcl . " (ID: " . $pcl->id . ")\n";
    }
}

echo "\n";

// Lihat Survei pertama dengan PML-nya
$survei = Survei::with('pmls')->first();
if ($survei) {
    echo "Survei Pertama: " . $survei->nama_survei . "\n";
    echo "  - ID: " . $survei->id . "\n";
    echo "  - PML yang ditugaskan: " . $survei->pmls->count() . "\n";
    foreach ($survei->pmls as $pml) {
        echo "    - " . $pml->nama_pml . " (ID: " . $pml->id . ")\n";
        $pclCount = Pcl::where('pml_id', $pml->id)->count();
        echo "      - PCL yang dimiliki: " . $pclCount . "\n";
    }
}
