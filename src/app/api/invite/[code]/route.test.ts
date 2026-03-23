import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

import { POST } from './route';

describe('Invite API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest() {
    return new Request('http://localhost/api/invite/abc123', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function makeParams(code = 'abc123') {
    return { params: Promise.resolve({ code }) };
  }

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await POST(makeRequest(), makeParams());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Not authenticated');
  });

  it('returns 404 for invalid invite code', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: [], error: null });

    const response = await POST(makeRequest(), makeParams());
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Invalid invite code');
  });

  it('returns 404 when RPC errors', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: null, error: { message: 'db error' } });

    const response = await POST(makeRequest(), makeParams());
    expect(response.status).toBe(404);
  });

  it('returns alreadyMember: true when user is already in the group', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    // find_group_by_invite_code
    mockRpc.mockResolvedValueOnce({
      data: [{ id: 'group-1', name: 'Family' }],
      error: null,
    });

    // existing member query
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'member-1' }, error: null });
    const eqUserMock = vi.fn(() => ({ single: singleMock }));
    const eqGroupMock = vi.fn(() => ({ eq: eqUserMock }));
    const selectMock = vi.fn(() => ({ eq: eqGroupMock }));
    mockFrom.mockReturnValue({ select: selectMock });

    const response = await POST(makeRequest(), makeParams());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alreadyMember).toBe(true);
    expect(body.groupId).toBe('group-1');
  });

  it('joins group and returns groupId on success', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    // find_group_by_invite_code, then join_group_by_invite_code
    mockRpc
      .mockResolvedValueOnce({
        data: [{ id: 'group-1', name: 'Family' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: 'group-1',
        error: null,
      });

    // existing member: not found
    const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqUserMock = vi.fn(() => ({ single: singleMock }));
    const eqGroupMock = vi.fn(() => ({ eq: eqUserMock }));

    // count members
    const countEqMock = vi.fn().mockResolvedValue({ count: 3, error: null });
    const countSelectMock = vi.fn(() => ({ eq: countEqMock }));

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: vi.fn(() => ({ eq: eqGroupMock })) };
      }
      return { select: countSelectMock };
    });

    const response = await POST(makeRequest(), makeParams());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.groupId).toBe('group-1');
  });

  it('returns 400 when join RPC fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockRpc
      .mockResolvedValueOnce({
        data: [{ id: 'group-1', name: 'Family' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'join failed' },
      });

    const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqUserMock = vi.fn(() => ({ single: singleMock }));
    const eqGroupMock = vi.fn(() => ({ eq: eqUserMock }));
    const countEqMock = vi.fn().mockResolvedValue({ count: 0, error: null });
    const countSelectMock = vi.fn(() => ({ eq: countEqMock }));

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: vi.fn(() => ({ eq: eqGroupMock })) };
      }
      return { select: countSelectMock };
    });

    const response = await POST(makeRequest(), makeParams());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Failed to join group');
  });

  it('calls find_group_by_invite_code with correct code', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: [], error: null });

    await POST(makeRequest(), makeParams('xyz789'));

    expect(mockRpc).toHaveBeenCalledWith('find_group_by_invite_code', {
      code_param: 'xyz789',
    });
  });
});
