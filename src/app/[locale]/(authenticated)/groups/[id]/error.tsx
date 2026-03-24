'use client';

import RouteErrorBoundary from '@/components/error/RouteErrorBoundary';

export default function GroupDetailError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorBoundary {...props} />;
}
