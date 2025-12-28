import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/context/AuthContext';
import "../globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Nordic Bank - Employee Dashboard",
    description: "Employee dashboard for Nordic Bank customer service",
};

import DashboardWrapper from '@/components/layout/DashboardWrapper';

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as typeof routing.locales[number])) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${inter.variable}`}>
                <NextIntlClientProvider messages={messages}>
                    <AuthProvider>
                        <DashboardWrapper locale={locale}>
                            {children}
                        </DashboardWrapper>
                    </AuthProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
