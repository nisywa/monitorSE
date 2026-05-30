<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppBlastService
{
    protected ?string $apiUrl;
    protected ?string $apiKey;
    protected ?string $from;

    public function __construct()
    {
        $this->apiUrl = Config::get('services.fonnte.api_url');
        $this->apiKey = Config::get('services.fonnte.api_key');
        $this->from   = Config::get('services.fonnte.from');
    }

    public function isConfigured(): bool
    {
        return filled($this->apiUrl) && filled($this->apiKey);
    }

    public function sendReminderToPhone(string $phone, string $message): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Fonnte service is not configured.',
            ];
        }

        // Normalize phone number to digits and ensure Indonesian country code if needed
        $normalized = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($normalized, '0')) {
            $normalized = '62' . ltrim($normalized, '0');
        } elseif (str_starts_with($normalized, '8')) {
            $normalized = '62' . $normalized;
        }

        $payload = [
            'target'  => $normalized,
            'message' => $message,
        ];

        if ($this->from) {
            $payload['from'] = $this->from;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->apiKey,
            ])
                ->acceptJson()
                ->timeout(20)
                ->post($this->apiUrl, $payload);

            // Log request/response for diagnostics
            Log::info('WhatsApp blast request', [
                'phone'   => $normalized,
                'payload' => $payload,
                'status'  => $response->status(),
                'body'    => $response->body(),
            ]);

            $responseData = $response->json();
            $isCarrierSuccess = $response->successful() && isset($responseData['status']) && $responseData['status'] === true;

            if ($isCarrierSuccess) {
                return [
                    'success'  => true,
                    'response' => $responseData,
                ];
            }

            Log::warning('WhatsApp blast failed', [
                'phone'    => $normalized,
                'payload'  => $payload,
                'status'   => $response->status(),
                'response' => $responseData,
            ]);

            return [
                'success' => false,
                'message' => $responseData['reason'] ?? $responseData['message'] ?? 'Gagal mengirim notifikasi WhatsApp.',
                'status'  => $response->status(),
                'response' => $responseData,
            ];
        } catch (\Exception $e) {
            Log::error('WhatsApp blast exception', [
                'phone'    => $normalized,
                'payload'  => $payload,
                'error'    => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Exception saat mengirim ke Fonnte: ' . $e->getMessage(),
            ];
        }
    }

    public function sendDailyReminderForPcls($pcls): array
    {
        $results = [];

        foreach ($pcls as $pcl) {
            if (!$pcl->no_telp) {
                $results[] = [
                    'pcl_id'   => $pcl->id,
                    'success'  => false,
                    'message'  => 'Nomor telepon tidak tersedia.',
                ];
                continue;
            }

            $message = sprintf(
                'Halo %s, ini reminder untuk segera submit laporan harian Anda untuk tanggal %s. Mohon cek aplikasi dan lengkapi laporan hari ini. Terima kasih.',
                $pcl->nama_pcl,
                now()->translatedFormat('d F Y')
            );

            $result = $this->sendReminderToPhone($pcl->no_telp, $message);
            $results[] = array_merge(['pcl_id' => $pcl->id, 'nama_pcl' => $pcl->nama_pcl, 'phone' => $pcl->no_telp], $result);
        }

        return $results;
    }
}
