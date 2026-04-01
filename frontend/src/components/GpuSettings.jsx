import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Check, X, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'neurolens_gpu_url';

export default function GpuSettings({ gpuUrl, setGpuUrl }) {
  const [open, setOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(gpuUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'ok' | 'fail' | null
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Sync input when gpuUrl changes externally
  useEffect(() => {
    setInputUrl(gpuUrl || '');
  }, [gpuUrl]);

  const testConnection = useCallback(async () => {
    const url = inputUrl.replace(/\/+$/, '');
    if (!url) return;
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        setTestResult('ok');
      } else {
        setTestResult('fail');
      }
    } catch (err) {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  }, [inputUrl]);

  const handleSave = useCallback(() => {
    const url = inputUrl.replace(/\/+$/, '');
    if (!url) return;
    localStorage.setItem(STORAGE_KEY, url);
    setGpuUrl(url);
    setOpen(false);
  }, [inputUrl, setGpuUrl]);

  const handleDisconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGpuUrl(null);
    setInputUrl('');
    setTestResult(null);
    setOpen(false);
  }, [setGpuUrl]);

  const connected = !!gpuUrl;

  return (
    <div className="relative" ref={panelRef}>
      {/* Header trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-mono hover:border-border-active transition-all"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            connected
              ? 'bg-score-high animate-[pulse-ring_3s_ease-in-out_infinite]'
              : 'bg-score-mid'
          }`}
          style={connected ? { boxShadow: '0 0 6px rgba(0, 229, 160, 0.5)' } : {}}
        />
        <Cpu size={13} className={connected ? 'text-score-high' : 'text-text-dim'} />
        <span className={connected ? 'text-score-high' : 'text-text-dim'}>
          {connected ? 'GPU' : 'Mock'}
        </span>
      </button>

      {/* Settings panel dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-[380px] bg-depth-2 border border-border-active rounded-lg p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm text-text-bright">
                Connect GPU
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-text-ghost hover:text-text-dim transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected
                    ? 'bg-score-high animate-[pulse-ring_3s_ease-in-out_infinite]'
                    : 'bg-score-mid'
                }`}
                style={connected ? { boxShadow: '0 0 6px rgba(0, 229, 160, 0.5)' } : {}}
              />
              <span className={`text-xs font-body ${connected ? 'text-score-high' : 'text-score-mid'}`}>
                {connected ? 'Connected to GPU' : 'Using mock mode'}
              </span>
            </div>

            {/* URL input */}
            <label className="block text-xs text-text-dim font-body mb-1.5">
              Tunnel URL
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://your-tunnel-url.ngrok.io"
              className="w-full bg-depth-3 border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-main placeholder:text-text-ghost outline-none focus:border-border-active transition-colors"
            />

            {/* Test result message */}
            <AnimatePresence>
              {testResult && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-xs mt-2 ${
                    testResult === 'ok' ? 'text-score-high' : 'text-score-low'
                  }`}
                >
                  {testResult === 'ok'
                    ? 'Connection successful — backend is reachable.'
                    : 'Connection failed — check the URL and make sure the tunnel is running.'}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={testConnection}
                disabled={testing || !inputUrl.trim()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all disabled:opacity-40 ${
                  testResult === 'ok'
                    ? 'border-score-high text-score-high'
                    : 'border-border text-text-dim hover:border-border-active hover:text-text-main'
                }`}
              >
                {testing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : testResult === 'ok' ? (
                  <Check size={13} />
                ) : null}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleSave}
                disabled={!inputUrl.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-void font-display font-semibold text-xs transition-all hover:brightness-110 disabled:opacity-40"
              >
                Save
              </button>

              {connected && (
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg text-score-low text-xs font-mono hover:bg-score-low/10 transition-all ml-auto"
                >
                  Disconnect
                </button>
              )}
            </div>

            <p className="text-[10px] text-text-ghost mt-4 font-body leading-relaxed">
              Run ngrok, Cloudflare Tunnel, or similar to expose your local GPU backend, then paste the URL here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
