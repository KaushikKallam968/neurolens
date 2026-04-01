#!/bin/bash
# NeuroLens GPU Server — starts backend + Cloudflare tunnel
# Run this on your machine to enable real TribeV2 inference from anywhere.

set -e
cd "$(dirname "$0")"

echo "Starting NeuroLens GPU backend..."
NEUROLENS_MOCK=false python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
sleep 3

echo "Starting Cloudflare tunnel..."
./cloudflared.exe tunnel --url http://localhost:8001 2>&1 | tee /tmp/neurolens-tunnel.log &
TUNNEL_PID=$!
sleep 8

# Extract tunnel URL
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/neurolens-tunnel.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
  echo ""
  echo "============================================"
  echo "  NeuroLens GPU server is LIVE"
  echo "  Tunnel: $TUNNEL_URL"
  echo "  Engine: TribeV2 (real inference)"
  echo "============================================"
  echo ""
  echo "The Vercel frontend at neurolens-kappa.vercel.app"
  echo "will auto-connect to this GPU backend."
  echo ""
  echo "Press Ctrl+C to stop."
else
  echo "Warning: Could not extract tunnel URL. Check /tmp/neurolens-tunnel.log"
fi

# Wait for either process to exit
wait $BACKEND_PID $TUNNEL_PID
