import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "../../../../components/flashcards/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const initialValue = "test value";
    const { result } = renderHook(() => useDebounce(initialValue, 500));

    expect(result.current).toBe(initialValue);
  });

  it("should not update the value before the delay", () => {
    const initialValue = "test value";
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: initialValue, delay: 500 },
    });

    // Update the input value
    const newValue = "updated value";
    rerender({ value: newValue, delay: 500 });

    // Advance time but not quite to delay threshold
    act(() => {
      vi.advanceTimersByTime(499);
    });

    // Value should still be the initial value
    expect(result.current).toBe(initialValue);
  });

  it("should update the value after the delay period", () => {
    const initialValue = "test value";
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: initialValue, delay: 500 },
    });

    // Update the input value
    const newValue = "updated value";
    rerender({ value: newValue, delay: 500 });

    // Advance time to exactly the delay threshold
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe(newValue);
  });

  it("should handle multiple value changes and only use the latest", () => {
    const initialValue = "initial";
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: initialValue, delay: 500 },
    });

    // First update
    rerender({ value: "update 1", delay: 500 });

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second update before first debounce completes
    rerender({ value: "update 2", delay: 500 });

    // Advance time partially again
    act(() => {
      vi.advanceTimersByTime(300); // 500 total not reached for the second update
    });

    // Value should still be initial
    expect(result.current).toBe(initialValue);

    // Complete the delay for second update
    act(() => {
      vi.advanceTimersByTime(200); // 500 total for second update
    });

    // Value should be the latest update
    expect(result.current).toBe("update 2");
  });

  it("should reset the timer when the delay value changes", () => {
    const initialValue = "test value";
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: initialValue, delay: 500 },
    });

    // Change the value
    rerender({ value: "updated value", delay: 500 });

    // Advance time partially - not enough for original delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Change the delay BEFORE the original timer completes
    rerender({ value: "updated value", delay: 1000 });

    // Advance time by the remaining time of the *original* delay (500 - 300 = 200)
    // The value should *not* update yet as the timer should have reset with the new delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Value should still be initial because delay was reset
    expect(result.current).toBe(initialValue);

    // Advance time by the *new* delay amount from the point the delay was changed
    act(() => {
      vi.advanceTimersByTime(1000); // Advance by the full new delay
    });

    // Now the value should be updated
    expect(result.current).toBe("updated value");
  });

  it("should clean up the timeout when unmounted", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { unmount } = renderHook(() => useDebounce("test", 500));

    unmount();

    // Should have called clearTimeout to prevent memory leaks
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
