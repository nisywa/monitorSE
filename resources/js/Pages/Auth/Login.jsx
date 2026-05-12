import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#e8f0f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            fontFamily: "'Segoe UI', sans-serif",
        }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .login-card {
                    animation: fadeIn 0.5s ease forwards;
                    display: flex;
                    width: 100%;
                    max-width: 820px;
                    min-height: 420px;
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,90,180,0.18), 0 4px 16px rgba(0,0,0,0.08);
                    background: #fff;
                }
                .left-panel {
                    position: relative;
                    width: 42%;
                    background: linear-gradient(160deg, #1ab2f5 0%, #0077cc 55%, #005aaa 100%);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 32px 28px 36px;
                    overflow: hidden;
                }
                .wave-mask {
                    position: absolute;
                    top: 0; right: -1px; bottom: 0;
                    width: 70px;
                }
                .right-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 44px;
                    background: #fff;
                }
                .bps-input {
                    width: 100%;
                    border: 1.5px solid #dde3ee;
                    border-radius: 50px;
                    padding: 11px 18px;
                    font-size: 13.5px;
                    color: #333;
                    outline: none;
                    background: #f5f8fc;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    font-family: 'Segoe UI', sans-serif;
                    box-sizing: border-box;
                }
                .bps-input::placeholder { color: #aab4c4; }
                .bps-input:focus {
                    border-color: #0077cc;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(0,119,204,0.1);
                }
                .bps-btn {
                    width: 100%;
                    padding: 12px;
                    border: none;
                    border-radius: 50px;
                    background: linear-gradient(90deg, #1ab2f5, #0077cc);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'Segoe UI', sans-serif;
                    cursor: pointer;
                    letter-spacing: 0.3px;
                    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
                    box-shadow: 0 4px 18px rgba(0,119,204,0.3);
                }
                .bps-btn:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 22px rgba(0,119,204,0.38);
                }
                .bps-btn:active:not(:disabled) { transform: scale(0.99); }
                .bps-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .eye-toggle {
                    background: none; border: none; cursor: pointer;
                    position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
                    color: #aab4c4; display: flex; align-items: center;
                    transition: color 0.2s; padding: 0;
                }
                .eye-toggle:hover { color: #0077cc; }
                @media (max-width: 560px) {
                    .left-panel { display: none; }
                    .right-panel { padding: 36px 24px; }
                }
            `}</style>

            <div className="login-card">

                {/* LEFT PANEL */}
                <div className="left-panel">
                    {/* Logo + nama instansi */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 2 }}>
                        <img
                            src="/asset/logo_bps.png"
                            alt="Logo BPS"
                            style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        <span style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '13px',
                            letterSpacing: '0.7px',
                            textTransform: 'uppercase',
                            lineHeight: 1.35,
                            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }}>
                            Badan Pusat Statistik<br /> Kabupaten Pinrang
                        </span>
                    </div>

                    {/* Bottom tagline */}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.72)',
                            fontSize: '13px',
                            lineHeight: 1.65,
                        }}>
                            Masukkan Email dan Password<br />Anda untuk melanjutkan
                        </p>
                    </div>

                    {/* Wave cutout */}
                    <svg
                        className="wave-mask"
                        viewBox="0 0 70 420"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M70,0 L70,420 L0,420
                               C0,420 28,360 18,300
                               C8,240 46,200 36,140
                               C26,80 0,40 0,0 Z"
                            fill="#fff"
                        />
                    </svg>
                </div>

                {/* RIGHT PANEL */}
                <div className="right-panel">
                    <div style={{ width: '100%', maxWidth: '290px' }}>

                        {/* Heading */}
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <p style={{
                                margin: '0 0 5px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#1a3a5c',
                                letterSpacing: '1.3px',
                                textTransform: 'uppercase',
                            }}>
                                  Monitoring Sistem <br/> Sensus Ekonomi 2026
                            </p>
                            <p style={{
                                margin: 0,
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#1a3a5c',
                                letterSpacing: '0.9px',
                                textTransform: 'uppercase',
                                opacity: 0.65,
                                lineHeight: 1.5,
                            }}>
                             
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>

                            {/* Email */}
                            <div>
                                <input
                                    className="bps-input"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="Email"
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p style={{ margin: '5px 0 0 14px', fontSize: '11px', color: '#e03e3e' }}>
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="bps-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Password"
                                    style={{ paddingRight: '42px' }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="eye-toggle"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                                {errors.password && (
                                    <p style={{ margin: '5px 0 0 14px', fontSize: '11px', color: '#e03e3e' }}>
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <div style={{ marginTop: '8px' }}>
                                <button type="submit" className="bps-btn" disabled={processing}>
                                    {processing ? 'Memproses...' : 'Log In'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
