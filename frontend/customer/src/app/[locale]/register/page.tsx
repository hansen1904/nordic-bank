import { setRequestLocale } from 'next-intl/server';
import RegisterContent from './RegisterContent';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <RegisterContent locale={locale} />;
}
