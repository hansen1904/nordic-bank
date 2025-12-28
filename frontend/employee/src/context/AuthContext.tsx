'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('employee_token');
        const storedUser = localStorage.getItem('employee_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await apiRequest<{ access_token: string; user_id: string; role: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }, '8081');

        if (response.role !== 'employee' && response.role !== 'admin') {
            throw new Error('Access denied. Insufficient permissions.');
        }

        const userData: User = {
            id: response.user_id,
            username: email.split('@')[0],
            email: email,
            role: response.role,
        };

        setToken(response.access_token);
        setUser(userData);
        localStorage.setItem('employee_token', response.access_token);
        localStorage.setItem('employee_user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('employee_token');
        localStorage.removeItem('employee_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
