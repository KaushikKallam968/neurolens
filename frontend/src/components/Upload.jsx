import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, Film, X } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CIRCLE_SIZE = 280;
const CIRCLE_R = CIRCLE_SIZE / 2 - 4;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

export default function Upload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(selectedFile.type)) return;
    if (selectedFile.size > 100 * 1024 * 1024) return;
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-[85vh] px-6"
    >
      {/* Circular drop zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        className="relative cursor-pointer group"
        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {/* SVG circular border */}
        <svg
          viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
          className="absolute inset-0 w-full h-full"
        >
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={CIRCLE_R}
            fill="none"
            stroke={file ? '#6C9FFF' : isDragging ? 'rgba(108, 159, 255, 0.5)' : 'rgba(58, 74, 99, 0.4)'}
            strokeWidth={file ? 2 : 1.5}
            strokeDasharray={file ? 'none' : '8 6'}
            style={{
              transition: 'stroke 0.3s ease, stroke-width 0.3s ease, stroke-dasharray 0.3s ease',
              animation: !file && !isDragging ? 'pulse-ring 3s ease-in-out infinite' : 'none',
              filter: isDragging ? 'drop-shadow(0 0 12px rgba(108, 159, 255, 0.3))' : file ? 'drop-shadow(0 0 8px rgba(108, 159, 255, 0.2))' : 'none',
            }}
          />
        </svg>

        {/* Circle inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <UploadIcon
                  size={40}
                  className="text-text-ghost transition-colors duration-300 group-hover:text-text-dim"
                />
              </motion.div>
            ) : (
              <motion.div
                key="file-info"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-2 px-6"
              >
                <Film size={36} className="text-primary" />
                <p className="text-text-bright text-sm font-body font-medium text-center truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-text-dim text-xs font-mono">
                  {formatFileSize(file.size)}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-1 p-1 rounded-full hover:bg-depth-3/50 transition-colors"
                >
                  <X size={14} className="text-text-ghost hover:text-text-dim" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Text below circle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="font-display text-lg text-text-bright mt-8"
      >
        Drop a video. See what the brain sees.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-text-dim text-xs mt-2 font-body"
      >
        MP4, MOV, WebM — up to 100MB
      </motion.p>

      {/* Scan button */}
      <AnimatePresence>
        {file && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => onUpload(file)}
            className="mt-8 px-10 py-3 rounded-full font-display font-semibold text-base text-void bg-primary tracking-wide hover:glow-primary active:scale-[0.98] transition-all duration-200"
            style={{ boxShadow: '0 0 20px rgba(108, 159, 255, 0.15)' }}
            whileHover={{ boxShadow: '0 0 30px rgba(108, 159, 255, 0.3)' }}
          >
            Scan
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
