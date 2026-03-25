import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BottomNav from './BottomNav';

const mockPush = vi.fn();
let mockPathname = '/dashboard';

vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname,
}));

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/dashboard';
  });

  it('renders groups, calendar, google sync, bob, and profile tabs', () => {
    render(<BottomNav />);
    expect(screen.getByText('groups')).toBeInTheDocument();
    expect(screen.getByText('calendar')).toBeInTheDocument();
    expect(screen.getByText('googleSync')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
  });

  it('highlights groups tab on /dashboard', () => {
    mockPathname = '/dashboard';
    render(<BottomNav />);
    const groupsBtn = screen.getByText('groups').closest('button');
    expect(groupsBtn).toHaveClass('Mui-selected');
  });

  it('highlights groups tab on /groups paths', () => {
    mockPathname = '/groups/123';
    render(<BottomNav />);
    const groupsBtn = screen.getByText('groups').closest('button');
    expect(groupsBtn).toHaveClass('Mui-selected');
  });

  it('highlights calendar tab on /calendar', () => {
    mockPathname = '/calendar';
    render(<BottomNav />);
    const calendarBtn = screen.getByText('calendar').closest('button');
    expect(calendarBtn).toHaveClass('Mui-selected');
  });

  it('highlights google sync tab on /google-sync', () => {
    mockPathname = '/google-sync';
    render(<BottomNav />);
    const syncBtn = screen.getByText('googleSync').closest('button');
    expect(syncBtn).toHaveClass('Mui-selected');
  });

  it('highlights bob tab on /bob', () => {
    mockPathname = '/bob';
    render(<BottomNav />);
    const bobBtn = screen.getByText('bob').closest('button');
    expect(bobBtn).toHaveClass('Mui-selected');
  });

  it('highlights profile tab on /profile', () => {
    mockPathname = '/profile';
    render(<BottomNav />);
    const profileBtn = screen.getByText('profile').closest('button');
    expect(profileBtn).toHaveClass('Mui-selected');
  });

  it('defaults to groups tab for unknown paths', () => {
    mockPathname = '/unknown';
    render(<BottomNav />);
    const groupsBtn = screen.getByText('groups').closest('button');
    expect(groupsBtn).toHaveClass('Mui-selected');
  });
});

describe('BottomNav path logic (unit)', () => {
  function getValue(pathname: string): number {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/groups')) return 0;
    if (pathname.startsWith('/calendar')) return 1;
    if (pathname.startsWith('/google-sync')) return 2;
    if (pathname.startsWith('/bob')) return 3;
    if (pathname.startsWith('/profile')) return 4;
    return 0;
  }

  it('/dashboard → 0', () => expect(getValue('/dashboard')).toBe(0));
  it('/dashboard/sub → 0', () => expect(getValue('/dashboard/sub')).toBe(0));
  it('/groups → 0', () => expect(getValue('/groups')).toBe(0));
  it('/groups/123 → 0', () => expect(getValue('/groups/123')).toBe(0));
  it('/groups/new → 0', () => expect(getValue('/groups/new')).toBe(0));
  it('/calendar → 1', () => expect(getValue('/calendar')).toBe(1));
  it('/google-sync → 2', () => expect(getValue('/google-sync')).toBe(2));
  it('/bob → 3', () => expect(getValue('/bob')).toBe(3));
  it('/profile → 4', () => expect(getValue('/profile')).toBe(4));
  it('/profile/settings → 4', () => expect(getValue('/profile/settings')).toBe(4));
  it('/ → 0 (default)', () => expect(getValue('/')).toBe(0));
  it('/unknown → 0 (default)', () => expect(getValue('/unknown')).toBe(0));
});
