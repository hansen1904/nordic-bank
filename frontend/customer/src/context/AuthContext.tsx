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

interface RegisterData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);


    }, []);

    const register = async (data: RegisterData) => {
        // 1. Register Auth User
        const authResponse = await apiRequest<{ id: string; username: string; email: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                username: data.username,
                email: data.email,
                password: data.password,
                role: 'customer',
            }),
        }, '8081');

        // 2. Create Customer Profile
        await apiRequest('/customers/', {
            method: 'POST',
            body: JSON.stringify({
                user_id: authResponse.id,
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                phone: 'N/A', // Placeholder for now
                date_of_birth: '1990-01-01', // Placeholder
                address: {
                    street: 'N/A',
                    city: 'N/A',
                    postal_code: '0000',
                    country: 'Denmark',
                },
            }),
        }, '8082');

        // 3. Auto-login after registration
        await login(data.email, data.password);
    };

    const login = async (email: string, password: string) => {
        const response = await apiRequest<{ access_token: string; user_id: string; role: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }, '8081');

        // We need the user details too.
        // For now, let's assume we can derive them or fetch them.
        // Actually, the login response only gives tokens.

        const userData: User = {
            id: response.user_id,
            username: email.split('@')[0],
            email: email,
            role: response.role,
        };

        setToken(response.access_token);
        setUser(userData);
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
