import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ExportButton({ targetRef, score }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!targetRef?.current || exporting) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#060B14',
        scale: 2,
        ignoreElements: (el) => el.tagName === 'CANVAS',
      });
      const link = document.createElement('a');
      link.download = `neurolens-report-${score || 0}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-text-dim text-xs font-mono hover:border-border-active hover:text-text-main transition-all disabled:opacity-50"
    >
      {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {exporting ? 'Exporting...' : 'Export'}
    </button>
  );
}
