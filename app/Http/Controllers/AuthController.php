<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function login(Request $request) {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        
        if (!Auth::attempt($credentials)) {
            return back()->withErrors(['email' => 'Email atau password salah']);
        }
        
        $request->session()->regenerate();
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
            return redirect()->route('dashboard');
        }
        return Inertia::render('Auth/Login');

}
}