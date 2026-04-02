import { useState, useCallback } from 'react';
import { Copy, Check, Link, Download } from 'lucide-react';
import { Modal, Button, Input } from './ui';

const VISIBILITY_OPTIONS = [
  { value: 'full', label: 'Full Report' },
  { value: 'scores_only', label: 'Scores Only' },
];

export default function ShareDialog({ open, onClose, analysisId, neuralScore }) {
  const [visibility, setVisibility] = useState('full');
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = useCallback(async () => {
    setLoading(true);
    try {
      // In v2, this calls POST /api/share to create a share token
      // For now, generate a mock share URL
      const token = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
    } catch (err) {
      console.error('Failed to generate share link:', err);
    } finally {
      setLoading(false);
    }
  }, [analysisId, visibility]);

  const copyToClipboard = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
    }
  }, [shareUrl]);

  return (
    <Modal open={open} onClose={onClose} title="Share Analysis">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-dim font-body">
          Generate a public link to share this analysis. Recipients can view without signing in.
        </p>

        {/* Visibility selector */}
        <div className="flex gap-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVisibility(opt.value)}
              className={`
                px-3 py-1.5 text-xs font-mono rounded-[var(--radius-sm)] border transition-all
                ${visibility === opt.value
                  ? 'border-primary bg-primary-dim text-primary'
                  : 'border-border text-text-dim hover:border-border-active'}
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Generate button or URL display */}
        {!shareUrl ? (
          <Button variant="primary" onClick={generateLink} disabled={loading}>
            <Link size={14} />
            {loading ? 'Generating...' : 'Generate Share Link'}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-depth-2 border border-border rounded-[var(--radius-sm)]
                px-3 py-2 text-xs font-mono text-text-main"
            />
            <Button variant="secondary" size="sm" onClick={copyToClipboard}>
              {copied ? <Check size={14} className="text-score-high" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}

        {/* PDF Export */}
        <div className="border-t border-border pt-4 mt-2">
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Download size={14} />
            Export as PDF
          </Button>
          <p className="text-[10px] text-text-ghost mt-1">
            Use browser print dialog with "Save as PDF" for a structured report.
          </p>
        </div>
      </div>
    </Modal>
  );
}
