import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card } from './ui';
import ContentTypeSelector from './ContentTypeSelector';

export default function BatchUpload({ onUpload, campaignId, className = '' }) {
  const [files, setFiles] = useState([]); // { file, id, contentType, status, progress, error }
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const entries = Array.from(newFiles)
      .filter(f => f.type.startsWith('video/'))
      .map(file => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        contentType: 'custom',
        status: 'queued', // queued | uploading | processing | complete | error
        progress: 0,
        error: null,
      }));
    setFiles(prev => [...prev, ...entries]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateContentType = useCallback((id, contentType) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, contentType } : f));
  }, []);

  const startUpload = useCallback(async () => {
    for (const entry of files) {
      if (entry.status !== 'queued') continue;

      setFiles(prev => prev.map(f =>
        f.id === entry.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        await onUpload?.(entry.file, campaignId, entry.contentType);
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'complete', progress: 100 } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'error', error: err.message } : f
        ));
      }
    }
  }, [files, onUpload, campaignId]);

  const queuedCount = files.filter(f => f.status === 'queued').length;
  const hasFiles = files.length > 0;

  return (
    <Card className={className}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-[var(--radius-md)] p-8
          flex flex-col items-center gap-3 cursor-pointer transition-all
          ${dragOver ? 'border-primary bg-primary-dim' : 'border-border hover:border-border-active'}
        `}
        role="button"
        aria-label="Upload videos"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <Upload size={24} className={dragOver ? 'text-primary' : 'text-text-ghost'} />
        <p className="text-sm text-text-dim font-body">
          {dragOver ? 'Drop videos here' : 'Drag & drop videos or click to browse'}
        </p>
        <p className="text-xs text-text-ghost font-mono">MP4, MOV, WebM up to 50MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File queue */}
      {hasFiles && (
        <div className="mt-4 flex flex-col gap-2">
          <AnimatePresence>
            {files.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] bg-depth-2 border border-border"
              >
                <StatusIcon status={entry.status} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-main font-body truncate">{entry.file.name}</p>
                  <p className="text-xs text-text-ghost font-mono">
                    {(entry.file.size / (1024 * 1024)).toFixed(1)}MB
                  </p>
                </div>

                {entry.status === 'queued' && (
                  <ContentTypeSelector
                    value={entry.contentType}
                    onChange={(ct) => updateContentType(entry.id, ct)}
                  />
                )}

                {entry.error && (
                  <span className="text-xs text-score-low">{entry.error}</span>
                )}

                {(entry.status === 'queued' || entry.status === 'error') && (
                  <button
                    onClick={() => removeFile(entry.id)}
                    className="text-text-ghost hover:text-text-dim transition-colors"
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {queuedCount > 0 && (
            <Button variant="primary" onClick={startUpload} className="mt-2">
              Upload {queuedCount} video{queuedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function StatusIcon({ status }) {
  if (status === 'complete') return <CheckCircle size={16} className="text-score-high shrink-0" />;
  if (status === 'error') return <AlertCircle size={16} className="text-score-low shrink-0" />;
  if (status === 'uploading' || status === 'processing') return <Loader2 size={16} className="text-primary animate-spin shrink-0" />;
  return <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />;
}
