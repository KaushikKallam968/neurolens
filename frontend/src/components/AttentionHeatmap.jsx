import { useRef, useEffect, useState, useCallback } from 'react';

// Thermal heatmap overlay on video player showing predicted attention areas
// In v2, this will use UNISAL saliency data. For now, generates a Gaussian
// approximation from the attention timeline data.
export default function AttentionHeatmap({
  videoRef,
  attentionData,
  currentTime = 0,
  mode = 'heatmap', // 'heatmap' | 'fog'
  visible = true,
  className = '',
}) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef?.current;
    if (!canvas || !video || !visible) return;

    const ctx = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;
    if (!videoWidth || !videoHeight) return;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Get attention value for current time
    const timeIndex = Math.floor(currentTime);
    const attention = attentionData?.[timeIndex] ?? 0.5;

    // Generate a simple center-weighted Gaussian heatmap
    // In SP4 full implementation, this will come from UNISAL saliency model
    const centerX = videoWidth * 0.5;
    const centerY = videoHeight * 0.4; // Slightly above center (face position bias)
    const radius = Math.max(videoWidth, videoHeight) * (0.3 + attention * 0.2);

    if (mode === 'heatmap') {
      // Thermal heatmap overlay
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `rgba(255, 59, 48, ${0.1 + attention * 0.4})`);
      gradient.addColorStop(0.3, `rgba(255, 149, 0, ${0.05 + attention * 0.2})`);
      gradient.addColorStop(0.6, `rgba(255, 204, 0, ${0.02 + attention * 0.1})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, videoWidth, videoHeight);
    } else {
      // Fog mode — everything obscured, clear where attention is
      ctx.fillStyle = 'rgba(6, 11, 20, 0.7)';
      ctx.fillRect(0, 0, videoWidth, videoHeight);

      // Clear the center of attention
      ctx.globalCompositeOperation = 'destination-out';
      const clearGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      clearGradient.addColorStop(0, `rgba(0, 0, 0, ${0.3 + attention * 0.7})`);
      clearGradient.addColorStop(0.5, `rgba(0, 0, 0, ${attention * 0.3})`);
      clearGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = clearGradient;
      ctx.fillRect(0, 0, videoWidth, videoHeight);
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [videoRef, attentionData, currentTime, mode, visible]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
