const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export type ServicePort = '8081' | '8082' | '8083' | '8084';

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    port: ServicePort = '8081'
): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('employee_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}:${port}/api/v1${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}
