import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from './not-found';

describe('NotFound', () => {
  it('renders 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders translated not found message', () => {
    render(<NotFound />);
    // useTranslations mock returns the key as-is
    expect(screen.getByText('notFoundMessage')).toBeInTheDocument();
  });

  it('renders translated link to dashboard', () => {
    render(<NotFound />);
    expect(screen.getByText('goHome')).toBeInTheDocument();
  });
});
