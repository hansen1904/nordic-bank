'use client';

import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <PreferencesProvider>
                {children}
            </PreferencesProvider>
        </AuthProvider>
    );
}
