import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CalendarLoading from './loading';

describe('CalendarLoading', () => {
  it('renders calendar skeleton grid', () => {
    const { container } = render(<CalendarLoading />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    // 2 nav buttons + 1 month title + 7 day headers + 35 day cells = 45
    expect(skeletons.length).toBeGreaterThan(30);
  });
});
