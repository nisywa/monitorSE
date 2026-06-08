<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pcl;
use App\Models\Pml;
use App\Models\Laporan;
use Carbon\Carbon;

class TestReminderSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:reminder-system
                            {--log : Log missing PCLs without sending notifications}
                            {--send : Actually send notifications (requires FCM V1 service account)}
                            {--date= : Check for specific date (YYYY-MM-DD, default: today)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the daily reminder system for PCL report submissions. Use --log to see what would be sent without FCM V1 credentials.';

    public function handle()
    {
        $mode = $this->option('send') ? 'send' : 'log';
        $dateStr = $this->option('date') ?? Carbon::today()->format('Y-m-d');
        $date = Carbon::createFromFormat('Y-m-d', $dateStr)->startOfDay();

        $this->info("=== PCL Daily Reminder System Test ===");
        $this->info("Mode: " . ($mode === 'send' ? 'SEND NOTIFICATIONS' : 'LOG ONLY (no notifications sent)'));
        $this->info("Date: {$dateStr}");
        $this->line('');

        // Check configuration
        $this->checkConfiguration();
        $this->line('');

        // Get all PCLs
        $pcls = Pcl::with(['user', 'pmls.user'])->get();
        $this->info("Total PCLs in system: " . count($pcls));

        $missingPcls = [];
        $pclDetails = [];

        foreach ($pcls as $pcl) {
            $hasReport = Laporan::where('pcl_id', $pcl->id)
                ->whereDate('tanggal', $date)->exists();

            $pcl_info = [
                'pcl_id' => $pcl->id,
                'pcl_name' => $pcl->nama_pcl ?? 'N/A',
                'email' => $pcl->user->email ?? 'N/A',
                'has_token' => !empty($pcl->user->fcm_token),
                'token_preview' => $pcl->user->fcm_token 
                    ? substr($pcl->user->fcm_token, 0, 10) . '...' 
                    : 'NONE',
                'has_report' => $hasReport,
            ];

            $pclDetails[] = $pcl_info;

            if (!$hasReport) {
                $missingPcls[] = $pcl;
                $this->line("❌ {$pcl->nama_pcl} - No report on {$dateStr} (Token: {$pcl_info['token_preview']})");
            } else {
                $this->line("✓ {$pcl->nama_pcl} - Has report on {$dateStr}");
            }
        }

        $this->line('');
        $this->info("Missing Reports: " . count($missingPcls) . "/" . count($pcls));
        $this->line('');

        // Summary by PML
        if (count($missingPcls) > 0) {
            $this->info("=== Summary by PML ===");
            $pmlMap = [];

            foreach ($missingPcls as $pcl) {
                foreach ($pcl->pmls as $pml) {
                    if (!isset($pmlMap[$pml->id])) {
                        $pmlMap[$pml->id] = [
                            'pml' => $pml,
                            'pcls' => [],
                        ];
                    }
                    $pmlMap[$pml->id]['pcls'][] = $pcl->nama_pcl ?? $pcl->user->nama ?? 'PCL';
                }
            }

            foreach ($pmlMap as $entry) {
                $pml = $entry['pml'];
                $pcl_names = $entry['pcls'];
                $count = count($pcl_names);
                $token_status = $pml->user && $pml->user->fcm_token ? '✓' : '✗';

                $this->line("{$token_status} {$pml->nama_pml} ({$pml->user->email}) - {$count} PCL missing:");
                foreach ($pcl_names as $name) {
                    $this->line("   → {$name}");
                }

                if ($mode === 'send' && $pml->user && $pml->user->fcm_token) {
                    $this->sendNotification($pml, $pcl_names);
                }
            }

            $this->line('');
        }

        // Send notifications to missing PCLs
        if ($mode === 'send') {
            $this->info("=== Sending Notifications ===");
            $fcmService = app(\App\Services\FcmService::class);
            $notificationsSent = 0;
            $notificationsFailed = 0;

            foreach ($missingPcls as $pcl) {
                if ($pcl->user && $pcl->user->fcm_token) {
                    $sent = $fcmService->sendToTokens(
                        [$pcl->user->fcm_token],
                        'Pengingat Laporan Harian',
                        'Halo ' . ($pcl->nama_pcl ?? 'PCL') . ", silakan submit laporan harian Anda untuk hari ini."
                    );
                    
                    if ($sent) {
                        $this->line("✓ Notification sent to {$pcl->nama_pcl}");
                        $notificationsSent++;
                    } else {
                        $this->line("✗ Failed to send to {$pcl->nama_pcl}");
                        $notificationsFailed++;
                    }
                } else {
                    $this->line("⊘ {$pcl->nama_pcl} has no FCM token");
                }
            }

            $this->line('');
            $this->info("Notifications Sent: {$notificationsSent}");
            $this->error("Notifications Failed: {$notificationsFailed}");
        } else {
            $this->info("=== What Would Be Sent (Log Mode) ===");
            $this->line("If --send flag was used:");
            $this->line("  • " . count($missingPcls) . " notifications to PCLs");
            $this->line("  • " . count($pmlMap ?? []) . " summary notifications to PMLs");
            $this->line('');
            $this->info("Use --send flag to actually send notifications");
            $this->info("Example: php artisan test:reminder-system --send");
        }

        $this->line('');
        $this->info("=== Test Complete ===");
        return 0;
    }

    private function checkConfiguration()
    {
        $this->info("Configuration Check:");

        // Check service account path and project ID for FCM V1
        $credentialsPath = env('FCM_SERVICE_ACCOUNT_PATH');
        $projectId = env('FCM_PROJECT_ID');
        if ($credentialsPath) {
            $this->line("✓ FCM_SERVICE_ACCOUNT_PATH is configured: {$credentialsPath}");
        } else {
            $this->error("✗ FCM_SERVICE_ACCOUNT_PATH is NOT configured");
            $this->line("  To configure: Add FCM_SERVICE_ACCOUNT_PATH to .env");
            $this->line("  This should point to your Firebase service account JSON file.");
        }

        if ($projectId) {
            $this->line("✓ FCM_PROJECT_ID is configured: {$projectId}");
        } else {
            $this->error("✗ FCM_PROJECT_ID is NOT configured");
            $this->line("  To configure: Add FCM_PROJECT_ID to .env");
        }

        // Check migration
        $userTableHasToken = \Illuminate\Support\Facades\DB::getSchemaBuilder()
            ->hasColumn('users', 'fcm_token');
        if ($userTableHasToken) {
            $this->line("✓ Database migration (fcm_token column) is applied");
        } else {
            $this->error("✗ Database migration NOT applied");
            $this->line("  Run: php artisan migrate");
        }

        // Check users with tokens
        $usersWithTokens = \App\Models\User::whereNotNull('fcm_token')->count();
        $totalUsers = \App\Models\User::count();
        $this->line("  Users with FCM tokens: {$usersWithTokens}/{$totalUsers}");
    }

    private function sendNotification($pml, $pcl_names)
    {
        $fcmService = app(\App\Services\FcmService::class);
        $count = count($pcl_names);
        $title = "Reminder: Ada {$count} PCL belum submit laporan";
        $body = "PCL: " . implode(', ', $pcl_names);

        $sent = $fcmService->sendToTokens(
            [$pml->user->fcm_token],
            $title,
            $body
        );

        if ($sent) {
            $this->line("   ✓ Summary sent to {$pml->nama_pml}");
        } else {
            $this->line("   ✗ Failed to send summary to {$pml->nama_pml}");
        }
    }
}
