#!/bin/bash

# Manual News Refresh Script
# This script manually triggers the latest automotive news fetch

echo "🔄 Manually fetching latest automotive news..."
echo "📡 Server: http://localhost:5016"
echo "⏰ Started at: $(date)"
echo ""

# Trigger manual news fetch
echo "🚀 Triggering news fetch..."
curl -X POST http://localhost:5016/api/automotive/admin/fetch-news \
  -H "Content-Type: application/json" \
  -w "\n\n📊 Response Time: %{time_total}s\n" \
  -s

echo ""
echo "✅ Manual news fetch triggered!"
echo "📰 Check your dashboard at http://localhost:3000 to see the latest articles"
echo "⏰ Completed at: $(date)"
