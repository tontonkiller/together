import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewGroupPage from './page';

// Mock AuthenticatedLayout
vi.mock('@/components/layout/AuthenticatedLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockPush = vi.fn();
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: vi.fn() }),
}));

const mockGetUser = vi.fn();
const mockInsertGroup = vi.fn();
const mockInsertMember = vi.fn();
const mockDeleteGroup = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'groups') {
        return {
          insert: (...args: unknown[]) => {
            mockInsertGroup(...args);
            return {
              select: () => ({
                single: () =>
                  mockInsertGroup.mock.results[mockInsertGroup.mock.results.length - 1]?.value ??
                  Promise.resolve({ data: { id: 'group-1' }, error: null }),
              }),
            };
          },
          delete: () => ({
            eq: (...args: unknown[]) => {
              mockDeleteGroup(...args);
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === 'group_members') {
        return {
          insert: (...args: unknown[]) => {
            mockInsertMember(...args);
            return mockInsertMember.mock.results[mockInsertMember.mock.results.length - 1]?.value ??
              Promise.resolve({ error: null });
          },
        };
      }
      return {};
    },
  }),
}));

describe('NewGroupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockInsertGroup.mockReturnValue(
      Promise.resolve({ data: { id: 'group-1' }, error: null }),
    );
    mockInsertMember.mockReturnValue(Promise.resolve({ error: null }));
  });

  it('renders name and description fields', () => {
    render(<NewGroupPage />);
    expect(screen.getByLabelText('groupName')).toBeInTheDocument();
    expect(screen.getByLabelText('groupDescription')).toBeInTheDocument();
  });

  it('submit button is disabled when name is empty', () => {
    render(<NewGroupPage />);
    const submitBtn = screen.getByText('create');
    expect(submitBtn.closest('button')).toBeDisabled();
  });

  it('submit button is enabled with a name', () => {
    render(<NewGroupPage />);
    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Family' },
    });
    const submitBtn = screen.getByText('create');
    expect(submitBtn.closest('button')).not.toBeDisabled();
  });

  it('creates group with trimmed name and description', async () => {
    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: '  Family  ' },
    });
    fireEvent.change(screen.getByLabelText('groupDescription'), {
      target: { value: '  My family  ' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(mockInsertGroup).toHaveBeenCalledWith({
        name: 'Family',
        description: 'My family',
        created_by: 'user-1',
      });
    });
  });

  it('passes null for empty description', async () => {
    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Friends' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(mockInsertGroup).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      );
    });
  });

  it('adds creator as admin member after group creation', async () => {
    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Family' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(mockInsertMember).toHaveBeenCalledWith({
        group_id: 'group-1',
        user_id: 'user-1',
        role: 'admin',
        color: '#2196F3',
      });
    });
  });

  it('redirects to group page after successful creation', async () => {
    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Family' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/groups/group-1');
    });
  });

  it('redirects to login when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Family' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error when group creation fails', async () => {
    mockInsertGroup.mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'DB error' } }),
    );

    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Family' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(screen.getByText('DB error')).toBeInTheDocument();
    });
  });

  it('cleans up orphaned group when member insert fails', async () => {
    mockInsertMember.mockReturnValue(
      Promise.resolve({ error: { message: 'Member insert failed' } }),
    );

    render(<NewGroupPage />);

    fireEvent.change(screen.getByLabelText('groupName'), {
      target: { value: 'Family' },
    });
    fireEvent.click(screen.getByText('create'));

    await waitFor(() => {
      expect(mockDeleteGroup).toHaveBeenCalledWith('id', 'group-1');
      expect(screen.getByText('Member insert failed')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on cancel', () => {
    render(<NewGroupPage />);
    fireEvent.click(screen.getByText('cancel'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
