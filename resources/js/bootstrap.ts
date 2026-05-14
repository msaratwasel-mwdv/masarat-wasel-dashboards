import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import * as Sentry from '@sentry/react';

window.axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status !== 422) {
            Sentry.captureException(new Error(`API Error: ${error.config?.url}`), {
                extra: {
                    status: error.response?.status,
                    data: error.response?.data,
                    method: error.config?.method,
                    url: error.config?.url
                }
            });
        }
        return Promise.reject(error);
    }
);

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

import * as Sentry from '@sentry/react';

// استماع لأخطاء الاتصال بالـ WebSocket (Reverb) وإرسالها لـ Sentry
if (window.Echo.connector && window.Echo.connector.pusher) {
    window.Echo.connector.pusher.connection.bind('error', (err: any) => {
        Sentry.captureException(new Error('WebSocket Connection Error'), {
            extra: { details: err }
        });
    });
}
