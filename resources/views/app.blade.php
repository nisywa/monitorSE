<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring App</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
    <script>
        // Expose CSRF token to frontend scripts
        window.csrf_token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    </script>
</head>
<body class="antialiased">
    @inertia
</body>
</html>