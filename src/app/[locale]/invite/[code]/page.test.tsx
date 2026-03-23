import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import InvitePage from './page';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock i18n router
const mockPush = vi.fn();
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock Supabase client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

describe('InvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ code: 'abc123' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows login prompt when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getAllByText('loginFirst').length).toBeGreaterThanOrEqual(1);
    });

    // Should not call the API
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('auto-joins when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groupId: 'group-1' }),
    });

    render(<InvitePage />);

    // Should show loading/joining state
    await waitFor(() => {
      expect(screen.getByText('joining')).toBeInTheDocument();
    });

    // Should call the invite API automatically
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/invite/abc123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
    });

    // Should show success
    await waitFor(() => {
      expect(screen.getByText('joined')).toBeInTheDocument();
    });
  });

  it('shows already member message when user is already in group', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groupId: 'group-1', alreadyMember: true }),
    });

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('alreadyMember')).toBeInTheDocument();
    });
  });

  it('shows error when API returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid invite code' }),
    });

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('Invalid invite code')).toBeInTheDocument();
    });
  });

  it('shows error when fetch throws', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('invalidLink')).toBeInTheDocument();
    });
  });

  it('redirects to group page after successful join', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groupId: 'group-1' }),
    });

    render(<InvitePage />);

    await waitFor(() => {
      expect(screen.getByText('joined')).toBeInTheDocument();
    });

    // Advance timer for the redirect delay
    vi.advanceTimersByTime(1500);

    expect(mockPush).toHaveBeenCalledWith('/groups/group-1');
  });

  it('uses the invite code from URL params', async () => {
    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ code: 'xyz789' });

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ groupId: 'group-1' }),
    });

    render(<InvitePage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/invite/xyz789',
        expect.any(Object),
      );
    });
  });
});
