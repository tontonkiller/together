import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RouteErrorBoundary from './RouteErrorBoundary';

describe('RouteErrorBoundary', () => {
  const mockError = new Error('Test error') as Error & { digest?: string };
  const mockReset = vi.fn();

  it('renders error message and try again button', () => {
    render(<RouteErrorBoundary error={mockError} reset={mockReset} />);
    expect(screen.getByText('errorMessage')).toBeInTheDocument();
    expect(screen.getByText('tryAgain')).toBeInTheDocument();
  });

  it('calls reset when try again is clicked', () => {
    render(<RouteErrorBoundary error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByText('tryAgain'));
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('logs error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<RouteErrorBoundary error={mockError} reset={mockReset} />);
    expect(consoleSpy).toHaveBeenCalledWith('[route error]', mockError);
    consoleSpy.mockRestore();
  });
});
