import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, Film, X } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
      className="flex flex-col items-center justify-center min-h-[80vh] px-6"
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-bold mb-3 tracking-tight"
      >
        <span className="text-text-primary">Neuro</span>
        <span className="text-nl-cyan">Lens</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-text-secondary text-lg mb-10"
      >
        See how the brain responds to your content
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative w-full max-w-xl rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 cursor-pointer group
          backdrop-blur-sm bg-card/30
          ${isDragging
            ? 'border-nl-cyan bg-nl-cyan/5 shadow-[0_0_30px_rgba(0,212,255,0.15)]'
            : 'border-card-border hover:border-nl-cyan/40 hover:bg-card/50'}
        `}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <DropZoneContent isDragging={isDragging} />
          ) : (
            <FilePreview file={file} onRemove={() => setFile(null)} />
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {file && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => onUpload(file)}
            className="
              mt-8 px-10 py-3.5 rounded-xl font-semibold text-base
              bg-nl-cyan text-background
              hover:shadow-[0_0_25px_rgba(0,212,255,0.4)]
              active:scale-[0.98] transition-all duration-200
            "
          >
            Analyze Video
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DropZoneContent({ isDragging }) {
  return (
    <motion.div
      key="dropzone"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className={`
        p-4 rounded-2xl transition-colors duration-300
        ${isDragging ? 'bg-nl-cyan/10' : 'bg-card/60 group-hover:bg-card'}
      `}>
        <UploadIcon
          size={40}
          className={`transition-colors duration-300
            ${isDragging ? 'text-nl-cyan' : 'text-text-muted group-hover:text-nl-cyan/70'}`}
        />
      </div>
      <div className="text-center">
        <p className="text-text-primary font-medium text-lg">
          Drop your video here
        </p>
        <p className="text-text-muted text-sm mt-1">
          Supports MP4, MOV, WebM — up to 100MB
        </p>
      </div>
    </motion.div>
  );
}

function FilePreview({ file, onRemove }) {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-4"
    >
      <div className="p-3 rounded-xl bg-nl-cyan/10">
        <Film size={28} className="text-nl-cyan" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-text-primary font-medium truncate">{file.name}</p>
        <p className="text-text-muted text-sm">{formatFileSize(file.size)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <X size={18} className="text-text-muted" />
      </button>
    </motion.div>
  );
}
