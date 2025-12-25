import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['da', 'en'],
    defaultLocale: 'da',
    localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
