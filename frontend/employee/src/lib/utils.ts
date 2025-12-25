// Utility functions for the employee dashboard

// Format date to relative time (e.g., "2 hours ago")
export function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'DKK'): string {
    return new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency,
    }).format(amount);
}

// Format account number
export function formatAccountNumber(accountNumber: string): string {
    // Format as XXXX-XXXXXXXX
    return accountNumber.replace(/(\d{4})(\d{8})/, '$1-$2');
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
    // Format as +45 XX XX XX XX
    return phone.replace(/(\+\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}
