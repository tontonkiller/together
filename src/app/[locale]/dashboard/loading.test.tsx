import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardLoading from './loading';

describe('DashboardLoading', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<DashboardLoading />);
    // MUI Skeleton renders spans with specific classes
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(5);
  });
});
