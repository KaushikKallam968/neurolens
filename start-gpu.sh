#!/bin/bash
# NeuroLens GPU Server — starts backend + Cloudflare tunnel
# Run this on your machine to enable real TribeV2 inference from anywhere.

set -e
cd "$(dirname "$0")"

SUPABASE_URL="https://hxevptffvdhslexjykgy.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZXZwdGZmdmRoc2xleGp5a2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzk0MTQsImV4cCI6MjA5MDY1NTQxNH0.463as0C1qodVIiejfsmdXdTD9koqkUPcTTOw0fSJ0kU"
GIST_ID="c0756beddf510325ee4f5bd730b91ca2"

# On exit, mark GPU as offline in both Supabase and Gist
trap 'curl -s -X PATCH "$SUPABASE_URL/rest/v1/gpu_status?id=eq.default" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"gpu_url\": null, \"status\": \"offline\", \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" ; \
  echo "{\"gpuUrl\":null,\"updatedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"offline\"}" | gh gist edit "$GIST_ID" -f gpu-url.json - 2>/dev/null ; \
  echo "GPU marked offline"' EXIT

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
  # Register GPU URL in Supabase (primary discovery)
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/gpu_status?id=eq.default" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"gpu_url\": \"$TUNNEL_URL\", \"status\": \"online\", \"engine\": \"tribev2\", \"updated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" && \
    echo "Registered GPU URL in Supabase (auto-discovery enabled)" || \
    echo "Warning: Could not register in Supabase"

  # Also update Gist as fallback
  echo '{"gpuUrl":"'"$TUNNEL_URL"'","updatedAt":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","status":"online"}' | \
    gh gist edit "$GIST_ID" -f gpu-url.json - 2>/dev/null && \
    echo "Also registered in Gist (fallback)" || \
    echo "Note: Gist update skipped"

  echo ""
  echo "============================================"
  echo "  NeuroLens GPU server is LIVE"
  echo "  Tunnel: $TUNNEL_URL"
  echo "  Engine: TribeV2 (real inference)"
  echo "  Discovery: Supabase + Gist"
  echo "============================================"
  echo ""
  echo "Open https://neurolens-kappa.vercel.app"
  echo "It will auto-connect to your GPU. No pasting needed."
  echo ""
  echo "Press Ctrl+C to stop."
else
  echo "Warning: Could not extract tunnel URL. Check /tmp/neurolens-tunnel.log"
fi

# Wait for either process to exit
wait $BACKEND_PID $TUNNEL_PID
