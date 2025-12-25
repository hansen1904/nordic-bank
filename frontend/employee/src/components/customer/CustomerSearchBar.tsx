'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface CustomerSearchBarProps {
    onSearch?: (query: string) => void;
}

export default function CustomerSearchBar({ onSearch }: CustomerSearchBarProps) {
    const t = useTranslations('dashboard.customerSearch');
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(query);
    };

    return (
        <form onSubmit={handleSearch} className="search-bar">
            <Search className="search-icon" />
            <input
                type="text"
                className="search-input"
                placeholder={t('placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </form>
    );
}
