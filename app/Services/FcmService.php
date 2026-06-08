<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class FcmService
{
    protected $serverKey;

    public function __construct()
    {
        $this->serverKey = env('FCM_SERVER_KEY');
    }

    public function sendToTokens(array $tokens, string $title, string $body, array $data = [])
    {
        if (empty($tokens) || !$this->serverKey) return false;

        $payload = [
            'registration_ids' => array_values($tokens),
            'notification' => [
                'title' => $title,
                'body' => $body,
                'icon' => asset('logo.png'),
                'click_action' => url('/'),
            ],
            'data' => $data,
            'priority' => 'high',
        ];

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', $payload);

        return $response->successful();
    }
}
