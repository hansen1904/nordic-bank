import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterContent from './RegisterContent';
import { AuthProvider } from '../../../context/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
    const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
        return <a href={href}>{children}</a>;
    };
    MockLink.displayName = 'MockLink';
    return MockLink;
});

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            'title': 'Create Account',
            'subtitle': 'Join Nordic Bank',
            'login': 'Login here',
            'first_name_placeholder': 'First Name',
            'last_name_placeholder': 'Last Name',
            'username_placeholder': 'Username',
            'email_placeholder': 'Email',
            'password_placeholder': 'Password',
            'submit': 'Create Account',
            'links.have_account': 'Already have an account?',
        };
        return translations[key] || key;
    },
}));

// Mock API request
global.fetch = jest.fn();

describe('RegisterContent - P1 Registration Tests', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (global.fetch as jest.Mock).mockClear();
    });

    it('should successfully register a new customer', async () => {
        // ARRANGE: Mock successful registration
        // ARRANGE: Mock successful registration sequence
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ // 1. Auth Register
                ok: true,
                json: async () => ({
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                }),
            })
            .mockResolvedValueOnce({ // 2. Customer Profile
                ok: true,
                json: async () => ({ id: 'customer-123' }),
            })
            .mockResolvedValueOnce({ // 3. Login
                ok: true,
                json: async () => ({
                    access_token: 'fake-jwt-token',
                    user_id: 'user-123',
                    role: 'customer'
                }),
            });

        render(
            <AuthProvider>
                <RegisterContent locale="en" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        // Get form fields
        const firstNameInput = screen.getByPlaceholderText('First Name');
        const lastNameInput = screen.getByPlaceholderText('Last Name');
        const usernameInput = screen.getByPlaceholderText('Username');
        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByRole('button', { name: /create account/i });

        // ACT: Fill form and submit
        await user.type(firstNameInput, 'Test');
        await user.type(lastNameInput, 'User');
        await user.type(usernameInput, 'testuser');
        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'Password123!');
        await user.click(submitButton);

        // ASSERT: Should call Auth API
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8081/api/v1/auth/register',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"username":"testuser"'),
                })
            );
        });

        // ASSERT: Should call Customer API
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8082/api/v1/customers/',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"first_name":"Test"'),
                })
            );
        });

        // Should redirect to login after success
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
        });
    });

    it('should send registration request without authentication', async () => {
        // ARRANGE: This tests P1 FIX - no auth required
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'user-456' }),
        });

        render(
            <AuthProvider>
                <RegisterContent locale="en" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        // ACT: Submit valid form
        await user.type(screen.getByPlaceholderText('First Name'), 'New');
        await user.type(screen.getByPlaceholderText('Last Name'), 'User');
        await user.type(screen.getByPlaceholderText('Username'), 'newuser');
        await user.type(screen.getByPlaceholderText('Email'), 'new@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'SecurePass123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // ASSERT: Request should NOT include Authorization header
        await waitFor(() => {
            const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
            const headers = fetchCall[1].headers;
            expect(headers['Authorization']).toBeUndefined();
        });
    });

    it('should handle registration errors', async () => {
        // ARRANGE: Mock error response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ error: 'Username already exists' }),
        });

        render(
            <AuthProvider>
                <RegisterContent locale="en" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        // ACT: Submit form
        await user.type(screen.getByPlaceholderText('First Name'), 'Existing');
        await user.type(screen.getByPlaceholderText('Last Name'), 'User');
        await user.type(screen.getByPlaceholderText('Username'), 'existing');
        await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'Pass123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // ASSERT: Should display error message
        await waitFor(() => {
            expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
        });

        // Should NOT redirect
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
        // ARRANGE
        render(
            <AuthProvider>
                <RegisterContent locale="en" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        const submitButton = screen.getByRole('button', { name: /create account/i });

        // ACT: Try to submit empty form
        await user.click(submitButton);

        // ASSERT: Form validation should prevent submission
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should disable form during registration', async () => {
        // ARRANGE: Mock slow registration
        (global.fetch as jest.Mock).mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 1000))
        );

        render(
            <AuthProvider>
                <RegisterContent locale="en" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        // Get form elements
        const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /create account/i }) as HTMLButtonElement;

        // ACT: Fill fields and submit
        await user.type(screen.getByPlaceholderText('First Name'), 'Test');
        await user.type(screen.getByPlaceholderText('Last Name'), 'User');
        await user.type(usernameInput, 'testuser');
        await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'Pass123!');
        await user.click(submitButton);

        // ASSERT: Form should be disabled during submission
        await waitFor(() => {
            expect(usernameInput.disabled).toBe(true);
            expect(submitButton.disabled).toBe(true);
        });
    });

    it('should use correct locale in redirect URL', async () => {
        // ARRANGE: Mock Danish locale
        // ARRANGE: Mock Danish locale
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ // 1. Auth Register
                ok: true,
                json: async () => ({ id: 'user-789' }),
            })
            .mockResolvedValueOnce({ // 2. Customer Profile
                ok: true,
                json: async () => ({ id: 'customer-789' }),
            })
            .mockResolvedValueOnce({ // 3. Login
                ok: true,
                json: async () => ({
                    access_token: 'fake-jwt-token',
                    user_id: 'user-789',
                    role: 'customer'
                }),
            });

        render(
            <AuthProvider>
                <RegisterContent locale="da" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        // ACT: Submit form
        await user.type(screen.getByPlaceholderText('First Name'), 'Test');
        await user.type(screen.getByPlaceholderText('Last Name'), 'User');
        await user.type(screen.getByPlaceholderText('Username'), 'testuser');
        await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'Pass123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // ASSERT: Should redirect to Danish login
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/da/dashboard');
        });
    });

    it('should accept various username formats', async () => {
        // ARRANGE
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'user-abc' }),
        });

        const testCases = [
            'simpleuser',
            'user123',
            'user_name',
            'user-name',
            'asdf', // The original test case that failed
        ];

        for (const username of testCases) {
            // ACT
            const { unmount } = render(
                <AuthProvider>
                    <RegisterContent locale="en" />
                </AuthProvider>
            );
            const user = userEvent.setup();

            await user.type(screen.getByPlaceholderText('First Name'), 'Test');
            await user.type(screen.getByPlaceholderText('Last Name'), 'User');
            await user.type(screen.getByPlaceholderText('Username'), username);
            await user.type(screen.getByPlaceholderText('Email'), `${username}@test.com`);
            await user.type(screen.getByPlaceholderText('Password'), 'Pass123!');
            await user.click(screen.getByRole('button', { name: /create account/i }));

            // ASSERT: All username formats should be accepted
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
            });

            unmount();
            jest.clearAllMocks();
        }
    });

    it('should handle network errors gracefully', async () => {
        // ARRANGE: Mock network failure
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(
            <AuthProvider>
                <RegisterContent locale="en" />
            </AuthProvider>
        );
        const user = userEvent.setup();

        // ACT: Submit form
        await user.type(screen.getByPlaceholderText('First Name'), 'Test');
        await user.type(screen.getByPlaceholderText('Last Name'), 'User');
        await user.type(screen.getByPlaceholderText('Username'), 'testuser');
        await user.type(screen.getByPlaceholderText('Email'), 'test@test.com');
        await user.type(screen.getByPlaceholderText('Password'), 'Pass123!');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // ASSERT: Should show error message
        await waitFor(() => {
            expect(screen.getByText(/network error|failed/i)).toBeInTheDocument();
        });
    });
});
