import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Inter } from 'next/font/google';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import Providers from '@/components/Providers';
import ConditionalHeader from '../../components/layout/ConditionalHeader';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const messages = await getMessages({ locale });
    const metadata = messages.metadata as { title: string; description: string };

    return {
        title: metadata?.title || 'Nordic Bank',
        description: metadata?.description || 'Your modern bank',
    };
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;

    // Validate that the incoming locale is valid
    if (!routing.locales.includes(locale as typeof routing.locales[number])) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Get messages for the locale
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <Providers>
                        <ConditionalHeader />
                        <main>{children}</main>
                        <ConditionalFooter />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
