@extends('app')

@section('content')
<div class="max-w-3xl mx-auto p-6">
    <h2 class="text-lg font-semibold mb-4">Profil Saya</h2>
    <div class="bg-white rounded-md shadow-sm p-4">
        <p class="text-sm">Nama: {{ auth()->user()->nama }}</p>
        <p class="text-sm">Email: {{ auth()->user()->email }}</p>
        <p class="text-sm">Role: {{ auth()->user()->role }}</p>
        <div class="mt-3">
            <p class="text-sm font-medium">Status Push Notification</p>
            @if(auth()->user()->fcm_token)
                <div class="text-sm text-green-700">Sudah terdaftar (token tersimpan)</div>
                <form method="POST" action="{{ route('device.token.remove') }}">
                    @csrf
                    <button type="submit" class="mt-2 px-3 py-1 bg-red-600 text-white rounded">Hapus token</button>
                </form>
            @else
                <div class="text-sm text-gray-600">Belum mendaftar perangkat untuk notifikasi</div>
            @endif
        </div>
    </div>
</div>
@endsection
