'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from '@/lib/api';

type Theme = 'light' | 'dark';

interface UserPreferences {
    theme: Theme;
    language: string;
    notifications_enabled: boolean;
    email_notifications: boolean;
}

interface PreferencesContextType {
    theme: Theme;
    language: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
    isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences>({
        theme: 'light',
        language: 'en',
        notifications_enabled: true,
        email_notifications: true
    });
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load from localStorage (to avoid flash)
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('nordic-bank-preferences');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPreferences(parsed);
                document.documentElement.setAttribute('data-theme', parsed.theme);
            } catch (e) {
                console.error("Failed to parse stored preferences", e);
            }
        } else {
            // Check system preference if no stored preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                setPreferences(prev => ({ ...prev, theme: 'dark' }));
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }
    }, []);

    // Fetch from backend when token is available
    useEffect(() => {
        if (token) {
            fetchPreferences();
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const fetchPreferences = async () => {
        try {
            const data = await apiRequest<UserPreferences>('/auth/preferences', {
                headers: { 'Authorization': `Bearer ${token}` }
            }, '8081');

            if (data) {
                setPreferences(data);
                document.documentElement.setAttribute('data-theme', data.theme);
                localStorage.setItem('nordic-bank-preferences', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
        const updated = { ...preferences, ...newPrefs };
        setPreferences(updated);

        // Update UI immediately
        if (newPrefs.theme) {
            document.documentElement.setAttribute('data-theme', newPrefs.theme);
        }

        // Save to localStorage
        localStorage.setItem('nordic-bank-preferences', JSON.stringify(updated));

        // Save to backend if logged in
        if (token) {
            try {
                await apiRequest('/auth/preferences', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updated)
                }, '8081');
            } catch (error) {
                console.error('Failed to save preferences to backend:', error);
            }
        }
    };

    return (
        <PreferencesContext.Provider value={{
            theme: preferences.theme,
            language: preferences.language,
            notificationsEnabled: preferences.notifications_enabled,
            emailNotifications: preferences.email_notifications,
            updatePreferences,
            isLoading
        }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}
