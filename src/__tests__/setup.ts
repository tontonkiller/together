import '@testing-library/jest-dom/vitest';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  hasLocale: (locales: string[], locale: string) => locales.includes(locale),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({})),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock i18n navigation
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  Link: 'a',
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}));

// Mock Supabase server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => createMockSupabaseClient()),
}));

// Helper: chainable Supabase mock
export function createMockSupabaseClient() {
  const chainable: Record<string, unknown> = {};

  const chain = () =>
    new Proxy(chainable, {
      get(target, prop) {
        if (prop === 'then') return undefined; // prevent Promise resolution
        if (typeof target[prop as string] === 'function') return target[prop as string];
        return vi.fn(() => chain());
      },
    });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => chain()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
