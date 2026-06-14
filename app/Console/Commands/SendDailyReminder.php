<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
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
        $today = Carbon::today('Asia/Makassar');

        $missingPcls = [];

        $pcls = Pcl::with(['user', 'pmls.user'])->get();
        $sentCount = 0;
        $failedCount = 0;

        foreach ($pcls as $pcl) {
            $hasReport = Laporan::where('pcl_id', $pcl->id)->whereDate('tanggal', $today)->exists();
            if (!$hasReport) {
                $missingPcls[] = $pcl;

                // Notify PCL directly if token present
                if ($pcl->user && $pcl->user->fcm_token) {
                    $sent = $this->fcm->sendToTokens([
                        $pcl->user->fcm_token
                    ],
                        'Pengingat Laporan Harian',
                        'Halo ' . ($pcl->nama_pcl ?? 'PCL') . ", silakan submit laporan harian Anda untuk hari ini.");

                    if ($sent) {
                        $sentCount++;
                        $this->warn("FCM reminder sent to PCL: {$pcl->nama_pcl} ({$pcl->user->email})");
                        Log::info('FCM reminder sent to PCL', [
                            'pcl_id' => $pcl->id,
                            'email' => $pcl->user->email,
                            'nama_pcl' => $pcl->nama_pcl,
                        ]);
                    } else {
                        $failedCount++;
                        $this->error("FCM reminder failed for PCL: {$pcl->nama_pcl} ({$pcl->user->email})");
                        Log::warning('FCM reminder failed for PCL', [
                            'pcl_id' => $pcl->id,
                            'email' => $pcl->user->email,
                            'nama_pcl' => $pcl->nama_pcl,
                        ]);
                    }
                } else {
                    $this->line("No FCM token for PCL: {$pcl->nama_pcl} ({$pcl->user?->email})");
                    Log::info('No FCM token for PCL', [
                        'pcl_id' => $pcl->id,
                        'nama_pcl' => $pcl->nama_pcl,
                    ]);
                }
            }
        }

        // Notify each PML with a summary of their PCLs who haven't submitted
        $pmlMap = [];
        foreach ($missingPcls as $pcl) {
            foreach ($pcl->pmls as $pml) {
                $pclName = $pcl->nama_pcl ?? ($pcl->user->nama ?? 'PCL');
                $pclKey = strtolower(trim((string) $pclName)) ?: 'pcl-' . $pcl->id;

                $pmlMap[$pml->id]['pml'] = $pml;
                $pmlMap[$pml->id]['pcls'][$pclKey] = $pclName;
            }
        }

        foreach ($pmlMap as $entry) {
            $pml = $entry['pml'];
            $names = array_values($entry['pcls']);
            $count = count($names);
            $title = "Reminder: Ada {$count} PCL belum submit laporan";
            $body = "PCL: " . implode(', ', $names);

            if ($pml && $pml->user && $pml->user->fcm_token) {
                $sent = $this->fcm->sendToTokens([
                    $pml->user->fcm_token
                ], $title, $body);

                if ($sent) {
                    $sentCount++;
                    $this->warn("FCM reminder summary sent to PML: {$pml->nama_pml} ({$pml->user->email})");
                    Log::info('FCM summary sent to PML', [
                        'pml_id' => $pml->id,
                        'email' => $pml->user->email,
                        'nama_pml' => $pml->nama_pml,
                        'missing_pcls' => $names,
                    ]);
                } else {
                    $failedCount++;
                    $this->error("FCM reminder summary failed for PML: {$pml->nama_pml} ({$pml->user->email})");
                    Log::warning('FCM summary failed for PML', [
                        'pml_id' => $pml->id,
                        'email' => $pml->user->email,
                        'nama_pml' => $pml->nama_pml,
                        'missing_pcls' => $names,
                    ]);
                }
            } else {
                $this->line("No FCM token for PML: {$pml->nama_pml} ({$pml->user?->email})");
                Log::info('No FCM token for PML', [
                    'pml_id' => $pml->id,
                    'nama_pml' => $pml->nama_pml,
                ]);
            }
        }

        $this->info('Daily reminder executed. Missing PCLs: ' . count($missingPcls));
        $this->info('Notifications sent: ' . $sentCount . ', failed: ' . $failedCount);

        return 0;
    }
}
