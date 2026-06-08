// Simple helper to request permission, get FCM token and POST to backend

// Replace module imports with runtime loading via Firebase CDN (compat) to avoid Vite import resolution errors
import axios from 'axios';

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
    });
}

async function ensureFirebaseCompat() {
    if (typeof window.firebase !== 'undefined' && window.firebase.messaging) return window.firebase;

    // Load compat builds from CDN
    const base = 'https://www.gstatic.com/firebasejs/9.6.10';
    await loadScript(`${base}/firebase-app-compat.js`);
    await loadScript(`${base}/firebase-messaging-compat.js`);

    if (typeof window.firebase === 'undefined') throw new Error('Firebase failed to load from CDN');
    return window.firebase;
}

export async function registerFcm(firebaseConfig, vapidKey) {
    try {
        const fb = await ensureFirebaseCompat();

        // Initialize only once
        if (!fb.apps || fb.apps.length === 0) {
            fb.initializeApp(firebaseConfig);
        }

        const messaging = fb.messaging();

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        // compat getToken supports passing vapidKey in options
        const currentToken = await messaging.getToken({ vapidKey });
        if (currentToken) {
            try {
                await axios.post('/api/device-token', { token: currentToken });
            } catch (err) {
                console.error('Failed to send token to server', err);
            }
            return currentToken;
        }
        return null;
    } catch (err) {
        console.error('FCM registration failed', err);
        return null;
    }
}

// Auto-register using window._app_firebase if present
if (typeof window !== 'undefined') {
    const cfg = window._app_firebase || null;
    if (cfg && cfg.vapidKey && cfg.config) {
        registerFcm(cfg.config, cfg.vapidKey).then(token => {
            if (token) console.log('FCM token registered', token);
        });
    }
}
