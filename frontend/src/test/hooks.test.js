import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoSync } from '../hooks/useVideoSync';
import { useProcessingStatus } from '../hooks/useProcessingStatus';

describe('useVideoSync', () => {
  let mockVideo;

  beforeEach(() => {
    mockVideo = {
      currentTime: 0,
      duration: 60,
      paused: true,
      play: vi.fn(),
      pause: vi.fn(),
    };
    // Mock rAF to run once then stop (avoids infinite recursion)
    let called = false;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      if (!called) {
        called = true;
        cb(performance.now());
      }
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state', () => {
    const videoRef = { current: mockVideo };
    const { result } = renderHook(() => useVideoSync(videoRef));
    expect(result.current.currentTime).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it('seekTo updates video currentTime', () => {
    const videoRef = { current: mockVideo };
    const { result } = renderHook(() => useVideoSync(videoRef));

    act(() => {
      result.current.seekTo(5);
    });

    expect(mockVideo.currentTime).toBe(5);
  });

  it('seekAndPlay seeks and plays', () => {
    const videoRef = { current: mockVideo };
    const { result } = renderHook(() => useVideoSync(videoRef));

    act(() => {
      result.current.seekAndPlay(10);
    });

    expect(mockVideo.currentTime).toBe(10);
    expect(mockVideo.play).toHaveBeenCalled();
  });

  it('play and pause call video methods', () => {
    const videoRef = { current: mockVideo };
    const { result } = renderHook(() => useVideoSync(videoRef));

    act(() => { result.current.play(); });
    expect(mockVideo.play).toHaveBeenCalled();

    act(() => { result.current.pause(); });
    expect(mockVideo.pause).toHaveBeenCalled();
  });

  it('handles null videoRef gracefully', () => {
    const videoRef = { current: null };
    const { result } = renderHook(() => useVideoSync(videoRef));

    // Should not throw
    act(() => {
      result.current.seekTo(5);
      result.current.play();
      result.current.pause();
    });
  });
});

describe('useProcessingStatus', () => {
  let mockGetApiUrl;

  beforeEach(() => {
    mockGetApiUrl = vi.fn((path) => path);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() =>
      useProcessingStatus({ getApiUrl: mockGetApiUrl })
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.stage).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('transitions to uploading on startUploading', () => {
    const { result } = renderHook(() =>
      useProcessingStatus({ getApiUrl: mockGetApiUrl })
    );

    act(() => {
      result.current.startUploading();
    });

    expect(result.current.status).toBe('uploading');
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it('transitions to error on setErrorState', () => {
    const { result } = renderHook(() =>
      useProcessingStatus({ getApiUrl: mockGetApiUrl })
    );

    act(() => {
      result.current.setErrorState('Something went wrong');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Something went wrong');
  });

  it('completeInstant sets status to complete', () => {
    const { result } = renderHook(() =>
      useProcessingStatus({ getApiUrl: mockGetApiUrl })
    );

    act(() => {
      result.current.startUploading();
    });
    act(() => {
      result.current.completeInstant();
    });

    expect(result.current.status).toBe('complete');
    expect(result.current.progress).toBe(100);
  });

  it('reset returns to idle', () => {
    const { result } = renderHook(() =>
      useProcessingStatus({ getApiUrl: mockGetApiUrl })
    );

    act(() => {
      result.current.startUploading();
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.stage).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('full lifecycle: idle -> uploading -> complete -> idle', () => {
    const { result } = renderHook(() =>
      useProcessingStatus({ getApiUrl: mockGetApiUrl })
    );

    expect(result.current.status).toBe('idle');

    act(() => result.current.startUploading());
    expect(result.current.status).toBe('uploading');

    act(() => result.current.completeInstant());
    expect(result.current.status).toBe('complete');

    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
  });
});
