import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

describe('ServiceWorkerRegistration', () => {
  const mockRegister = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing', () => {
    const { container } = render(<ServiceWorkerRegistration />);
    expect(container.innerHTML).toBe('');
  });

  it('registers the service worker on mount', () => {
    render(<ServiceWorkerRegistration />);
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });
});
