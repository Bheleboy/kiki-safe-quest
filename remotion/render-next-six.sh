#!/bin/bash
set -u

cd /dev-server/remotion || exit 1

BROWSER=/opt/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell
LIMIT=${1:-6}
RENDERED=0

mkdir -p out

for f in src/configs/*.json; do
  [ "$RENDERED" -ge "$LIMIT" ] && break

  id=$(basename "$f" .json)
  comp="${id//_/-}"

  if [ -s "out/${id}.mp4" ]; then
    echo "skip $id"
    continue
  fi

  echo "=== Rendering $comp $(date -u +%H:%M:%S) ==="
  if npx remotion render "$comp" "out/${id}.mp4" --codec h264 --crf 18 --browser-executable "$BROWSER"; then
    if [ -s "out/${id}.mp4" ]; then
      RENDERED=$((RENDERED + 1))
      echo "OK: ${id} $(du -h "out/${id}.mp4" | cut -f1) [$RENDERED/$LIMIT]"
    else
      echo "FAILED: $id (no output file)"
    fi
  else
    echo "FAILED: $id"
    rm -f "out/${id}.mp4"
  fi
done

echo "=== SIX-LESSON BATCH DONE ==="
echo "New renders: $RENDERED"
echo "Total saved: $(find out -maxdepth 1 -type f -name '*.mp4' -size +0c | wc -l)"