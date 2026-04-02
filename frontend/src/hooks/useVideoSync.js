import { useState, useCallback, useRef, useEffect } from 'react';

// 60fps video sync via rAF loop for smooth visualization updates
export function useVideoSync(videoRef) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef(null);

  // rAF loop for smooth time tracking
  useEffect(() => {
    function tick() {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        setIsPlaying(!videoRef.current.paused);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [videoRef]);

  const seekTo = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, [videoRef]);

  const play = useCallback(() => {
    if (videoRef.current) videoRef.current.play();
  }, [videoRef]);

  const pause = useCallback(() => {
    if (videoRef.current) videoRef.current.pause();
  }, [videoRef]);

  const seekAndPlay = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  }, [videoRef]);

  return {
    currentTime,
    isPlaying,
    duration,
    seekTo,
    seekAndPlay,
    play,
    pause,
    handleLoadedMetadata,
  };
}
