<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function login(Request $request) {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        
        if (!Auth::attempt($credentials)) {
            $password = $request->password;
            $normalizedPassword = null;

            if (preg_match('/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/', $password)) {
                try {
                    $normalizedPassword = Carbon::createFromFormat('d-m-Y', str_replace(['/', '-'], '-', $password))->format('dmY');
                } catch (\Exception $e) {
                    $normalizedPassword = null;
                }
            }

            if ($normalizedPassword && Auth::attempt(['email' => $request->email, 'password' => $normalizedPassword])) {
                $request->session()->regenerate();
                $user = Auth::user();

                if (in_array($user->role, ['PCL', 'PML'])) {
                    return redirect()->route('laporan.index')->with('success', 'Login berhasil');
                }

                return redirect()->route('dashboard')->with('success', 'Login berhasil');
            }

            return back()->withErrors(['email' => 'Email atau password salah']);
        }
        
        $request->session()->regenerate();
        $user = Auth::user();

        if (in_array($user->role, ['PCL', 'PML'])) {
            return redirect()->route('laporan.index')->with('success', 'Login berhasil');
        }

        return redirect()->route('dashboard')->with('success', 'Login berhasil');
    }



public function logout(Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    
    return redirect('/login')->with('success', 'Logout berhasil');
}


public function showLogin()
    {
        if (Auth::check()) {
            $user = Auth::user();
            if (in_array($user->role, ['PCL', 'PML'])) {
                return redirect()->route('laporan.index');
            }
            return redirect()->route('dashboard');
        }
        return Inertia::render('Auth/Login');

}
}