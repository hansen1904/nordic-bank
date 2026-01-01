import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from './DashboardLayout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useParams: jest.fn(() => ({ locale: 'en' })),
    usePathname: jest.fn(() => '/en/dashboard'),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock PreferencesContext
jest.mock('@/context/PreferencesContext', () => ({
    usePreferences: jest.fn(() => ({
        theme: 'light',
        language: 'en',
        notificationsEnabled: true,
        emailNotifications: true,
        updatePreferences: jest.fn(),
        isLoading: false
    })),
    PreferencesProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

describe('DashboardLayout - Authentication Guard', () => {
    const mockPush = jest.fn();
    const mockRouter = { push: mockPush };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useParams as jest.Mock).mockReturnValue({ locale: 'en' });
    });

    it('should redirect to login when user is not authenticated', async () => {
        // ARRANGE: Mock unauthenticated state
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: false,
        });

        // ACT: Render component
        render(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        // ASSERT: Should redirect to login
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/en/login');
        });

        // Should not render children
        expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
        // ARRANGE: Mock loading state
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: true,
        });

        // ACT: Render component
        render(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        // ASSERT: Should show loading indicator
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // Should not render children
        expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();

        // Should not redirect yet
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should render dashboard when user is authenticated', () => {
        // ARRANGE: Mock authenticated state
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: '1', username: 'testuser', email: 'test@test.com' },
            isLoading: false,
        });

        // ACT: Render component
        render(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        // ASSERT: Should render children
        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();

        // Should not redirect
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should redirect with correct locale in URL', async () => {
        // ARRANGE: Mock Danish locale
        (useParams as jest.Mock).mockReturnValue({ locale: 'da' });

        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: false,
        });

        // ACT: Render component
        render(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        // ASSERT: Should redirect to Danish login
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/da/login');
        });
    });

    it('should not allow access after logout (user becomes null)', async () => {
        // ARRANGE: Start with authenticated user
        const { rerender } = render(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        (useAuth as jest.Mock).mockReturnValue({
            user: { id: '1', username: 'testuser', email: 'test@test.com' },
            isLoading: false,
        });

        rerender(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        // ACT: User logs out (user becomes null)
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            isLoading: false,
        });

        rerender(
            <DashboardLayout>
                <div>Dashboard Content</div>
            </DashboardLayout>
        );

        // ASSERT: Should redirect to login
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/en/login');
        });
    });
});
