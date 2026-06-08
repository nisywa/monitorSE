<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pcl;
use App\Models\Laporan;
use App\Services\FcmService;
use Carbon\Carbon;

class SendDailyReminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'send:daily-reminder';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily reminders to PCL and summary notifications to PML for missing daily reports.';

    protected $fcm;

    public function __construct(FcmService $fcm)
    {
        parent::__construct();
        $this->fcm = $fcm;
    }

    public function handle()
    {
        $today = Carbon::today();

        $missingPcls = [];

        $pcls = Pcl::with(['user', 'pmls.user'])->get();

        foreach ($pcls as $pcl) {
            $hasReport = Laporan::where('pcl_id', $pcl->id)->whereDate('tanggal', $today)->exists();
            if (!$hasReport) {
                $missingPcls[] = $pcl;

                // Notify PCL directly if token present
                if ($pcl->user && $pcl->user->fcm_token) {
                    $this->fcm->sendToTokens([
                        $pcl->user->fcm_token
                    ],
                    'Pengingat Laporan Harian',
                    'Halo ' . ($pcl->nama_pcl ?? 'PCL') . ", silakan submit laporan harian Anda untuk hari ini.");
                }
            }
        }

        // Notify each PML with a summary of their PCLs who haven't submitted
        $pmlMap = [];
        foreach ($missingPcls as $pcl) {
            foreach ($pcl->pmls as $pml) {
                $pmlMap[$pml->id]['pml'] = $pml;
                $pmlMap[$pml->id]['pcls'][] = $pcl->nama_pcl ?? ($pcl->user->nama ?? 'PCL');
            }
        }

        foreach ($pmlMap as $entry) {
            $pml = $entry['pml'];
            $names = $entry['pcls'];
            $count = count($names);
            $title = "Reminder: Ada {$count} PCL belum submit laporan";
            $body = "PCL: " . implode(', ', $names);

            if ($pml && $pml->user && $pml->user->fcm_token) {
                $this->fcm->sendToTokens([
                    $pml->user->fcm_token
                ], $title, $body);
            }
        }

        // Also send an aggregate notification to admin (optional)
        $adminTokens = \App\Models\User::where('role', 'admin')->whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
        if (!empty($adminTokens)) {
            $this->fcm->sendToTokens($adminTokens, 'Laporan Harian - Ringkasan', 'Terdapat ' . count($missingPcls) . ' PCL yang belum submit laporan hari ini.');
        }

        $this->info('Daily reminder executed. Missing PCLs: ' . count($missingPcls));

        return 0;
    }
}
