import { useEffect, useCallback } from 'react';

// Video playback shortcuts:
// J/K/L — rewind/pause/forward (YouTube convention)
// Left/Right arrows — frame step (1 second)
// Space — play/pause
// 1-9 — jump to key moments
export function useKeyboardShortcuts({ videoRef, keyMoments = [], onSeek }) {
  const handleKeyDown = useCallback((e) => {
    // Don't capture when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    const video = videoRef?.current;
    if (!video) return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        if (video.paused) video.play();
        else video.pause();
        break;
      case 'j':
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 10);
        break;
      case 'l':
        e.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 1);
        break;
      default:
        // Number keys 1-9 → jump to key moments
        if (e.key >= '1' && e.key <= '9') {
          const index = parseInt(e.key) - 1;
          if (keyMoments[index]) {
            e.preventDefault();
            const timestamp = keyMoments[index].timestamp;
            if (onSeek) onSeek(timestamp);
            else video.currentTime = timestamp;
          }
        }
    }
  }, [videoRef, keyMoments, onSeek]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
