import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from './TopBar';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = '/dashboard';

vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname,
}));

let mockLocale = 'fr';
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale = 'fr';
    mockPathname = '/dashboard';
  });

  it('renders "Together" branding', () => {
    render(<TopBar />);
    expect(screen.getByText('Together')).toBeInTheDocument();
  });

  it('navigates to dashboard when clicking logo', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText('Together'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows "EN" toggle when locale is fr', () => {
    mockLocale = 'fr';
    render(<TopBar />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('shows "FR" toggle when locale is en', () => {
    mockLocale = 'en';
    render(<TopBar />);
    expect(screen.getByText('FR')).toBeInTheDocument();
  });

  it('switches to en when clicking toggle in fr locale', () => {
    mockLocale = 'fr';
    mockPathname = '/profile';
    render(<TopBar />);

    fireEvent.click(screen.getByText('EN'));
    expect(mockReplace).toHaveBeenCalledWith('/profile', { locale: 'en' });
  });

  it('switches to fr when clicking toggle in en locale', () => {
    mockLocale = 'en';
    mockPathname = '/groups/123';
    render(<TopBar />);

    fireEvent.click(screen.getByText('FR'));
    expect(mockReplace).toHaveBeenCalledWith('/groups/123', { locale: 'fr' });
  });

  it('preserves current pathname during locale switch', () => {
    mockLocale = 'fr';
    mockPathname = '/groups/my-group';
    render(<TopBar />);

    fireEvent.click(screen.getByText('EN'));
    expect(mockReplace).toHaveBeenCalledWith('/groups/my-group', { locale: 'en' });
  });

  it('has accessible language toggle button', () => {
    render(<TopBar />);
    expect(screen.getByLabelText('toggleLanguage')).toBeInTheDocument();
  });
});
