import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileContent from './ProfileContent';

// Mock AuthenticatedLayout
vi.mock('@/components/layout/AuthenticatedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// More complete next-intl mock for locale awareness
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: unknown[]) => {
          mockEq(...eqArgs);
          return Promise.resolve({ error: null });
        }};
      },
    }),
    auth: {
      signOut: mockSignOut,
    },
  }),
}));

const defaultProfile = {
  id: 'user-1',
  display_name: 'Alice',
  avatar_url: null,
  preferred_locale: 'fr',
};

describe('ProfileContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('renders with profile name pre-filled', () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);
    const input = screen.getByDisplayValue('Alice');
    expect(input).toBeInTheDocument();
  });

  it('shows email as disabled field', () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);
    const emailInput = screen.getByDisplayValue('alice@test.com');
    expect(emailInput).toBeDisabled();
  });

  it('renders avatar with first letter of name', () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders avatar with ? when name is empty', () => {
    const emptyProfile = { ...defaultProfile, display_name: '' };
    render(<ProfileContent profile={emptyProfile} email="alice@test.com" googleAccounts={[]} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('saves profile with trimmed display name', async () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);

    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: '  Bob  ' } });

    const saveBtn = screen.getByText('save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        display_name: 'Bob',
        preferred_locale: 'fr',
      });
    });
  });

  it('shows success message after save', async () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);

    fireEvent.click(screen.getByText('save'));

    await waitFor(() => {
      expect(screen.getByText('saved')).toBeInTheDocument();
    });
  });

  it('shows error for empty display name', async () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);

    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('save'));

    await waitFor(() => {
      expect(screen.getByText('displayNameRequired')).toBeInTheDocument();
    });

    // Should NOT call supabase
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows error when profile is null', async () => {
    render(<ProfileContent profile={null} email="alice@test.com" googleAccounts={[]} />);

    // Save button should be disabled
    const saveBtn = screen.getByText('save');
    expect(saveBtn.closest('button')).toBeDisabled();
  });

  it('calls signOut and redirects to login on logout', async () => {
    render(<ProfileContent profile={defaultProfile} email="alice@test.com" googleAccounts={[]} />);

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
