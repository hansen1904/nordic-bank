'use client';

import { useState, useMemo } from 'react';

import { UserPlus, Mail, User, ShieldCheck, AlertCircle, Loader2, Phone, Calendar, Lock as LockIcon, Users, Key } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { apiRequest } from '@/lib/api';
import styles from './onboard.module.css';

export default function OnboardCustomerContent() {

    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '1990-01-01',
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate form completion progress
    const progress = useMemo(() => {
        const fields = Object.values(formData);
        const filledFields = fields.filter(value => value && value !== '1990-01-01').length;
        return Math.round((filledFields / fields.length) * 100);
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null); // Clear error on input change
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Register Auth User
            const authResponse = await apiRequest<{ id: string }>('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: 'customer',
                }),
            }, '8081');

            // 2. Create Customer Profile
            await apiRequest('/customers/', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: authResponse.id,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    date_of_birth: formData.dateOfBirth,
                    address: {
                        street: 'N/A',
                        city: 'N/A',
                        postal_code: '0000',
                        country: 'DK', // ISO country code for Denmark
                    },
                }),
            }, '8082');

            setSuccess(true);
            setTimeout(() => {
                router.push(`/${locale}/customers`);
            }, 3000);
        } catch (err: unknown) {
            // Transform technical validation errors into user-friendly messages
            let errorMessage = (err as Error).message || 'Onboarding failed. Please try again.';

            // Password validation errors
            if (errorMessage.includes("Password' failed on the 'min' tag")) {
                errorMessage = 'Password must be at least 8 characters long.';
            } else if (errorMessage.includes('Password')) {
                errorMessage = 'Password does not meet requirements. Please use at least 8 characters with uppercase, lowercase, and numbers.';
            }
            // Email validation errors
            else if (errorMessage.includes("Email' failed on the 'email' tag")) {
                errorMessage = 'Please enter a valid email address.';
            } else if (errorMessage.includes('email already registered')) {
                errorMessage = 'This email address is already registered. Please use a different email.';
            }
            // Username validation errors
            else if (errorMessage.includes("Username' failed on the 'min' tag")) {
                errorMessage = 'Username must be at least 3 characters long.';
            } else if (errorMessage.includes('username already exists')) {
                errorMessage = 'This username is already taken. Please choose a different username.';
            }
            // First name validation
            else if (errorMessage.includes("FirstName") || errorMessage.includes("first_name")) {
                errorMessage = 'First name is required and must be valid.';
            }
            // Last name validation
            else if (errorMessage.includes("LastName") || errorMessage.includes("last_name")) {
                errorMessage = 'Last name is required and must be valid.';
            }
            // Phone validation
            else if (errorMessage.includes("Phone")) {
                errorMessage = 'Please enter a valid phone number (e.g., +45XXXXXXXX).';
            }
            // Date of birth validation
            else if (errorMessage.includes("DateOfBirth") || errorMessage.includes("date_of_birth")) {
                errorMessage = 'Please enter a valid date of birth.';
            }
            // Generic validation error
            else if (errorMessage.includes("Field validation") || errorMessage.includes("failed on the")) {
                errorMessage = 'Please check your inputs. Some fields contain invalid data.';
            }
            // Network/connection errors
            else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                errorMessage = 'Unable to connect to the server. Please check your connection and try again.';
            }
            // Authorization errors
            else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
                errorMessage = 'Your session has expired. Please log in again.';
            }
            // Server errors
            else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                errorMessage = 'A server error occurred. Please try again or contact support.';
            }
            // Database errors
            else if (errorMessage.includes('SQLSTATE') || errorMessage.includes('value too long')) {
                errorMessage = 'Invalid data format. Please check your inputs and try again.';
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={styles.onboardContainer}>
                <div className={styles.onboardCard}>
                    {success ? (
                        <div className={styles.successContainer}>
                            <div className={styles.successIcon}>
                                <ShieldCheck size={48} color="white" />
                            </div>
                            <h2 className={styles.successTitle}>Customer Onboarded!</h2>
                            <p className={styles.successMessage}>
                                {formData.firstName} {formData.lastName} has been successfully added to the system.
                            </p>
                            <p className={styles.successDetail}>
                                Redirecting to customer list...
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className={styles.header}>
                                <div className={styles.headerIcon}>
                                    <UserPlus size={32} color="white" />
                                </div>
                                <h1 className={styles.title}>Onboard New Customer</h1>
                                <p className={styles.subtitle}>
                                    Create a new customer account with initial login credentials
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className={styles.progressText}>
                                    {progress}% Complete
                                </p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className={`${styles.alert} ${styles.alertError}`}>
                                    <AlertCircle size={24} className={styles.alertIcon} />
                                    <div className={styles.alertContent}>
                                        <h4 className={styles.alertTitle}>Onboarding Failed</h4>
                                        <p className={styles.alertDescription}>{error}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Personal Information Section */}
                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader}>
                                        <div className={styles.sectionIcon}>
                                            <Users size={20} />
                                        </div>
                                        <h3 className={styles.sectionTitle}>Personal Information</h3>
                                    </div>

                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <div className={styles.inputWrapper}>
                                                <User size={18} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    className={styles.input}
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>First Name</label>
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <div className={styles.inputWrapper}>
                                                <User size={18} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    className={styles.input}
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>Last Name</label>
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <div className={styles.inputWrapper}>
                                                <Mail size={18} className={styles.inputIcon} />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className={styles.input}
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>Email Address</label>
                                            </div>
                                            <p className={styles.helperText}>
                                                Customer will use this email to login
                                            </p>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <div className={styles.inputWrapper}>
                                                <Phone size={18} className={styles.inputIcon} />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    className={styles.input}
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>Phone Number</label>
                                            </div>
                                            <p className={styles.helperText}>
                                                Format: +45XXXXXXXX
                                            </p>
                                        </div>

                                        <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                                            <div className={styles.inputWrapper}>
                                                <Calendar size={18} className={styles.inputIcon} />
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    className={styles.input}
                                                    value={formData.dateOfBirth}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>Date of Birth</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Login Credentials Section */}
                                <div className={styles.formSection}>
                                    <div className={styles.sectionHeader}>
                                        <div className={styles.sectionIcon}>
                                            <Key size={20} />
                                        </div>
                                        <h3 className={styles.sectionTitle}>Initial Login Credentials</h3>
                                    </div>

                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <div className={styles.inputWrapper}>
                                                <User size={18} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    name="username"
                                                    className={styles.input}
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>Username</label>
                                            </div>
                                            <p className={styles.helperText}>
                                                Unique identifier for the customer
                                            </p>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <div className={styles.inputWrapper}>
                                                <LockIcon size={18} className={styles.inputIcon} />
                                                <input
                                                    type="text"
                                                    name="password"
                                                    className={styles.input}
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    required
                                                    disabled={isLoading}
                                                />
                                                <label className={styles.label}>Temporary Password</label>
                                            </div>
                                            <p className={styles.helperText}>
                                                Min. 8 characters (uppercase, lowercase, number recommended)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isLoading || progress < 100}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} className={styles.spinner} />
                                            Creating Customer...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={20} />
                                            Onboard Customer
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
