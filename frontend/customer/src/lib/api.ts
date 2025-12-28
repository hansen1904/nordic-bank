const BASE_URL = 'http://localhost';

export type ServicePort = '8081' | '8082' | '8083' | '8084';

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    port: ServicePort = '8081'
): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}:${port}/api/v1${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}
