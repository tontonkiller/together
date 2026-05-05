import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackButtonClose } from './useBackButtonClose';

describe('useBackButtonClose', () => {
  beforeEach(() => {
    // Reset history to a known baseline before each test.
    window.history.replaceState(null, '');
  });

  it('does nothing when open is false', () => {
    const onClose = vi.fn();
    const pushSpy = vi.spyOn(window.history, 'pushState');
    renderHook(() => useBackButtonClose(false, onClose));
    expect(pushSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('pushes a marker history entry when open becomes true', () => {
    const onClose = vi.fn();
    const pushSpy = vi.spyOn(window.history, 'pushState');
    renderHook(() => useBackButtonClose(true, onClose));
    expect(pushSpy).toHaveBeenCalledTimes(1);
    const [stateArg] = pushSpy.mock.calls[0];
    expect(stateArg).toEqual({ __dialogMarker: true });
    pushSpy.mockRestore();
  });

  it('calls onClose when the back button fires popstate', () => {
    const onClose = vi.fn();
    renderHook(() => useBackButtonClose(true, onClose));

    act(() => {
      // Simulate the user pressing the back button. jsdom doesn't actually
      // pop the entry on a manually dispatched popstate, but for our hook's
      // purposes the listener firing is the contract that matters.
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useBackButtonClose(true, onClose));

    unmount();

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('pops the marker when the dialog closes via something other than back', () => {
    const onClose = vi.fn();
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    const { rerender } = renderHook(
      ({ open }: { open: boolean }) => useBackButtonClose(open, onClose),
      { initialProps: { open: true } },
    );

    // Dialog closes for a non-back reason (e.g. Save button).
    rerender({ open: false });

    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it('does NOT pop the marker again when back already closed the dialog', () => {
    const onClose = vi.fn();
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    const { rerender } = renderHook(
      ({ open }: { open: boolean }) => useBackButtonClose(open, onClose),
      { initialProps: { open: true } },
    );

    // Simulate back button — popstate handler sets closedByBack=true.
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Parent then flips open=false in response to onClose being called.
    rerender({ open: false });

    // Cleanup ran but should NOT have called history.back() because the
    // back button already consumed our marker.
    expect(backSpy).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('always uses the latest onClose, even if the parent recreates it on every render', () => {
    let latestCallTarget = vi.fn();

    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useBackButtonClose(true, cb),
      { initialProps: { cb: latestCallTarget } },
    );

    // Parent re-renders with a brand new onClose function. The hook should
    // not re-run its effect (which would tear down + re-push the marker),
    // but a popstate now should still call the latest onClose.
    const replacement = vi.fn();
    latestCallTarget = replacement;
    rerender({ cb: replacement });

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(replacement).toHaveBeenCalledTimes(1);
  });
});
