import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 1000));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 'initial' } }
    );

    // 値を変更
    rerender({ value: 'changed' });
    
    // まだ元の値が返される
    expect(result.current).toBe('initial');

    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // 新しい値が返される
    expect(result.current).toBe('changed');
  });

  it('should handle multiple rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 'initial' } }
    );

    // 複数回値を変更
    rerender({ value: 'first' });
    rerender({ value: 'second' });
    rerender({ value: 'third' });

    // まだ元の値が返される
    expect(result.current).toBe('initial');

    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // 最後の値が返される
    expect(result.current).toBe('third');
  });

  it('should handle different delay times', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    // 500ms未満では元の値
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial');

    // 500ms後は新しい値
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('changed');
  });

  it('should handle empty string values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: '' });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe('');
  });

  it('should handle number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(42);
  });

  it('should handle object values', () => {
    const initialObj = { name: 'initial' };
    const changedObj = { name: 'changed' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: initialObj } }
    );

    rerender({ value: changedObj });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(changedObj);
  });

  it('should handle array values', () => {
    const initialArray = [1, 2, 3];
    const changedArray = [4, 5, 6];

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: initialArray } }
    );

    rerender({ value: changedArray });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(changedArray);
  });
}); 