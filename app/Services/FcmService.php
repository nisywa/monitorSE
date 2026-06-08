<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Google\Auth\Credentials\ServiceAccountCredentials;

class FcmService
{
    protected $projectId;
    protected $credentialsPath;

    public function __construct()
    {
        $this->projectId = env('FCM_PROJECT_ID');
        $this->credentialsPath = env('FCM_SERVICE_ACCOUNT_PATH');
    }

    /**
     * Generate OAuth2 access token dari service account JSON
     */
    protected function getAccessToken(): string
    {
        if (!$this->projectId) {
            throw new \RuntimeException('FCM_PROJECT_ID is not configured. Set it in .env.');
        }

        if (!$this->credentialsPath) {
            throw new \RuntimeException('FCM_SERVICE_ACCOUNT_PATH is not configured. Set it in .env.');
        }

        $credentialsFile = base_path($this->credentialsPath);
        if (!file_exists($credentialsFile)) {
            throw new \RuntimeException("FCM service account file not found at {$credentialsFile}");
        }

        $serviceAccount = json_decode(file_get_contents($credentialsFile), true);
        if (!is_array($serviceAccount)) {
            throw new \RuntimeException('Invalid FCM service account JSON file.');
        }

        $credentials = new ServiceAccountCredentials(
            'https://www.googleapis.com/auth/firebase.messaging',
            $serviceAccount
        );

        $token = $credentials->fetchAuthToken();
        if (empty($token['access_token'])) {
            throw new \RuntimeException('Unable to obtain access token from FCM service account.');
        }

        return $token['access_token'];
    }

    /**
     * Kirim notifikasi ke banyak token (looping satu per satu)
     * FCM V1 tidak support registration_ids, harus kirim satu-satu
     */
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): bool
    {
        if (empty($tokens)) return false;

        $accessToken = $this->getAccessToken();
        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

        $success = true;

        foreach (array_values($tokens) as $token) {
            $payload = [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $title,
                        'body'  => $body,
                    ],
                    'android' => [
                        'priority' => 'high',
                    ],
                    'apns' => [
                        'headers' => [
                            'apns-priority' => '10',
                        ],
                    ],
                    'webpush' => [
                        'notification' => [
                            'icon' => url('logo.png'),
                            'click_action' => url('/'),
                        ],
                    ],
                ],
            ];

            if (!empty($data)) {
                $payload['message']['data'] = array_map('strval', $data);
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type'  => 'application/json',
            ])->post($url, $payload);

            if (!$response->successful()) {
                Log::warning('FCM send failed', [
                    'token' => $token,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                $success = false;
            }
        }

        return $success;
    }
}