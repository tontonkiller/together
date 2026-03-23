import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import LoginPage from './page';

// Mock next-intl more specifically for this component
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

const mockSignInWithOtp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams(),
    );
    mockSignInWithOtp.mockResolvedValue({ error: null });
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  it('renders email input and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('emailLabel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sendLink' })).toBeInTheDocument();
  });

  it('shows auth error alert when ?error=auth is in URL', () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams('error=auth'),
    );

    render(<LoginPage />);
    expect(screen.getByText('authError')).toBeInTheDocument();
  });

  it('validates email and shows error for empty email', async () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: 'sendLink' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('invalidEmail')).toBeInTheDocument();
    });

    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('validates email and shows error for invalid format', async () => {
    render(<LoginPage />);

    const input = screen.getByLabelText('emailLabel');
    fireEvent.change(input, { target: { value: 'not-an-email' } });

    // Use fireEvent.submit on the form since click on a submit button
    // in jsdom may not always trigger form's onSubmit
    const form = screen.getByRole('button', { name: 'sendLink' }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('invalidEmail')).toBeInTheDocument();
    });

    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it('calls signInWithOtp with valid email and correct redirect URL', async () => {
    render(<LoginPage />);

    const input = screen.getByLabelText('emailLabel');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'sendLink' }));

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/fr/auth/callback',
        },
      });
    });
  });

  it('shows success message after successful OTP send', async () => {
    render(<LoginPage />);

    const input = screen.getByLabelText('emailLabel');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'sendLink' }));

    await waitFor(() => {
      expect(screen.getByText('linkSent')).toBeInTheDocument();
      expect(screen.getByText('linkSentDesc')).toBeInTheDocument();
    });
  });

  it('shows error message when OTP request fails', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    render(<LoginPage />);

    const input = screen.getByLabelText('emailLabel');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'sendLink' }));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('disables button during loading', async () => {
    // Keep the promise pending to test loading state
    let resolveOtp: (value: unknown) => void;
    mockSignInWithOtp.mockReturnValue(
      new Promise((resolve) => {
        resolveOtp = resolve;
      }),
    );

    render(<LoginPage />);

    const input = screen.getByLabelText('emailLabel');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'sendLink' }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    // Resolve to clean up
    resolveOtp!({ error: null });
  });

  it('hides auth error when user gets a validation error', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams('error=auth'),
    );

    render(<LoginPage />);
    expect(screen.getByText('authError')).toBeInTheDocument();

    // Submit empty to trigger validation
    fireEvent.click(screen.getByRole('button', { name: 'sendLink' }));

    await waitFor(() => {
      expect(screen.getByText('invalidEmail')).toBeInTheDocument();
      // callbackError alert is hidden when there's a setError
      expect(screen.queryByText('authError')).not.toBeInTheDocument();
    });
  });
});

describe('Email validation regex', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it.each([
    'test@example.com',
    'user@domain.co',
    'john.doe@company.org',
    'a@b.c',
  ])('accepts valid email: %s', (email) => {
    expect(emailRegex.test(email)).toBe(true);
  });

  it.each([
    '',
    'notanemail',
    '@missing-local.com',
    'missing-domain@',
    'spaces in@email.com',
    'no@dots',
  ])('rejects invalid email: %s', (email) => {
    expect(emailRegex.test(email)).toBe(false);
  });
});
