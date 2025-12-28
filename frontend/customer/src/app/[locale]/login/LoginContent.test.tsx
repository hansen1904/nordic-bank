import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginContent from './LoginContent';

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

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            'title': 'Login',
            'subtitle': 'Access your account',
            'form.email_or_username': 'Email or Username',
            'form.password': 'Password',
            'form.submit': 'Login',
            'links.forgot_password': 'Forgot password?',
        };
        return translations[key] || key;
    },
}));

describe('LoginContent - Input Flexibility Tests', () => {
    const mockPush = jest.fn();
    const mockLogin = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
    });

    it('should accept username without email format validation', async () => {
        // ARRANGE: Render login form
        render(<LoginContent locale="en" />);
        const user = userEvent.setup();

        // Get input fields
        const emailInput = screen.getByPlaceholderText('Email or Username') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;


        // ACT: Enter username (not email format)
        await user.type(emailInput, 'asdf');
        await user.type(passwordInput, 'password123');

        // ASSERT: Input should accept the value
        expect(emailInput.value).toBe('asdf');
        expect(emailInput.type).toBe('text'); // Should be text, not email
    });

    it('should accept email format in username field', async () => {
        // ARRANGE: Render login form
        render(<LoginContent locale="en" />);
        const user = userEvent.setup();

        // Get input fields
        const emailInput = screen.getByPlaceholderText('Email or Username') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;

        // ACT: Enter email format
        await user.type(emailInput, 'user@example.com');
        await user.type(passwordInput, 'password123');

        // ASSERT: Input should accept email format
        expect(emailInput.value).toBe('user@example.com');
    });

    it('should call login with both username and password', async () => {
        // ARRANGE: Mock successful login
        mockLogin.mockResolvedValue(undefined);
        render(<LoginContent locale="en" />);
        const user = userEvent.setup();

        // Get input fields
        const emailInput = screen.getByPlaceholderText('Email or Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByRole('button', { name: /login/i });

        // ACT: Fill form and submit
        await user.type(emailInput, 'testuser');
        await user.type(passwordInput, 'testpass');
        await user.click(submitButton);

        // ASSERT: Should call login with credentials
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass');
        });
    });

    it('should redirect to dashboard after successful login', async () => {
        // ARRANGE: Mock successful login
        mockLogin.mockResolvedValue(undefined);
        render(<LoginContent locale="en" />);
        const user = userEvent.setup();

        // Get form elements
        const emailInput = screen.getByPlaceholderText('Email or Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByRole('button', { name: /login/i });

        // ACT: Submit login form
        await user.type(emailInput, 'testuser');
        await user.type(passwordInput, 'password');
        await user.click(submitButton);

        // ASSERT: Should redirect to dashboard
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
        });
    });

    it('should display error message on failed login', async () => {
        // ARRANGE: Mock failed login
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));
        render(<LoginContent locale="en" />);
        const user = userEvent.setup();

        // Get form elements
        const emailInput = screen.getByPlaceholderText('Email or Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByRole('button', { name: /login/i });

        // ACT: Submit invalid credentials
        await user.type(emailInput, 'wronguser');
        await user.type(passwordInput, 'wrongpass');
        await user.click(submitButton);

        // ASSERT: Should display error
        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });

    it('should disable form during login attempt', async () => {
        // ARRANGE: Mock slow login
        mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
        render(<LoginContent locale="en" />);
        const user = userEvent.setup();

        // Get form elements
        const emailInput = screen.getByPlaceholderText('Email or Username') as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /login/i }) as HTMLButtonElement;

        // ACT: Start login
        await user.type(emailInput, 'testuser');
        await user.type(passwordInput, 'password');
        await user.click(submitButton);

        // ASSERT: Form should be disabled during login
        await waitFor(() => {
            expect(emailInput.disabled).toBe(true);
            expect(passwordInput.disabled).toBe(true);
            expect(submitButton.disabled).toBe(true);
        });
    });

    it('should use correct locale in dashboard redirect', async () => {
        // ARRANGE: Mock Danish locale
        mockLogin.mockResolvedValue(undefined);
        render(<LoginContent locale="da" />);
        const user = userEvent.setup();

        // Get form elements
        const emailInput = screen.getByPlaceholderText('Email or Username');
        const passwordInput = screen.getByPlaceholderText('Password');
        const submitButton = screen.getByRole('button', { name: /login/i });

        // ACT: Submit login
        await user.type(emailInput, 'testuser');
        await user.type(passwordInput, 'password');
        await user.click(submitButton);

        // ASSERT: Should redirect to Danish dashboard
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/da/dashboard');
        });
    });
});
