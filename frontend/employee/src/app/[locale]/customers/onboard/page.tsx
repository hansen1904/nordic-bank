import { setRequestLocale } from 'next-intl/server';
import OnboardCustomerContent from './OnboardCustomerContent';

export default async function OnboardCustomerPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return <OnboardCustomerContent />;
}
