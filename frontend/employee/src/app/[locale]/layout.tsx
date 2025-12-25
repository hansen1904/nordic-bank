import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import "../globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Nordic Bank - Employee Dashboard",
    description: "Employee dashboard for Nordic Bank customer service",
};

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Ensure that the incoming locale is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <body className={`${inter.variable}`}>
                <NextIntlClientProvider messages={messages}>
                    <div className="dashboard-layout">
                        <Sidebar />
                        <main className="main-content">
                            {children}
                        </main>
                    </div>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
