<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring App</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ asset('logo2.png') }}">
    <link rel="shortcut icon" href="{{ asset('logo2.png') }}">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
    <script>
        // Expose CSRF token to frontend scripts
        window.csrf_token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        // Provide firebase config to frontend if set in env
        window._app_firebase = {
            config: {
                apiKey: '{{ env('MIX_FIREBASE_API_KEY') }}',
                authDomain: '{{ env('MIX_FIREBASE_AUTH_DOMAIN') }}',
                projectId: '{{ env('MIX_FIREBASE_PROJECT_ID') }}',
                storageBucket: '{{ env('MIX_FIREBASE_STORAGE_BUCKET') }}',
                messagingSenderId: '{{ env('MIX_FIREBASE_MESSAGING_SENDER_ID') }}',
                appId: '{{ env('MIX_FIREBASE_APP_ID') }}',
            },
            vapidKey: '{{ env('MIX_FIREBASE_VAPID_KEY') }}'
        };
    </script>
</head>
<body class="antialiased">
    @inertia
</body>
</html>