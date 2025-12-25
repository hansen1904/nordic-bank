import './globals.css';

export const metadata = {
    title: 'Nordic Bank',
    description: 'Your modern bank',
};

// This is a passthrough layout - the [locale] layout handles the html/body structure
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
