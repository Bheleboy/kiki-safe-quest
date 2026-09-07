#!/bin/bash
set -e
cd /dev-server/remotion

# Ensure deps
bun install 2>&1 | tail -1

BROWSER=/opt/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell
mkdir -p out

# Configure git
git config user.email "renders@kiki-warrior.com"
git config user.name "Kiki Render Bot"

# All 30 composition IDs (hyphenated, matching Remotion composition names)
COMPOSITIONS=(
  ages-10-13-internet-safety-101
  ages-10-13-5-ways-to-stay-private
  ages-10-13-be-kind-online
  ages-10-13-being-a-good-digital-friend
  ages-10-13-catfish-and-fake-profiles
  ages-10-13-cookies-and-tracking
  ages-10-13-creating-strong-passwords
  ages-10-13-cyber-bullying-and-respect-building-a-positive-online-community
  ages-10-13-cyber-bullying-and-respect-how-to-block-and-report
  ages-10-13-cyber-bullying-and-respect-standing-up-for-others
  ages-10-13-cyber-bullying-and-respect-the-impact-of-words
  ages-10-13-cyber-bullying-and-respect-what-is-cyberbullying
  ages-10-13-digital-footprint
  ages-10-13-location-sharing
  ages-10-13-managing-your-online-reputation
  ages-10-13-mean-messages
  ages-10-13-online-vs-offline
  ages-10-13-privacy-settings-on-apps
  ages-10-13-scams-and-phishing-fake-websites
  ages-10-13-scams-and-phishing-in-game
  ages-10-13-scams-and-phishing-social-media-scams
  ages-10-13-scams-and-phishing-what-to-do-if-you-get-scammed
  ages-10-13-scams-and-phishing
  ages-10-13-screentime-and-well-being
  ages-10-13-sharing-photos-safely
  ages-10-13-think-before-you-post
  ages-10-13-two-factor-auth
  ages-10-13-what-is-cyberbullying
  ages-10-13-what-is-personal-info
  ages-10-13-your-rights-online
)

DONE=0
FAILED=0
SKIPPED=0

for comp in "${COMPOSITIONS[@]}"; do
  # Output filename uses underscores
  filename="${comp//-/_}.mp4"
  outpath="out/${filename}"
  
  # Skip if file already exists and is >0 bytes (from a previous git pull)
  if [ -s "$outpath" ]; then
    echo "SKIP (exists): $filename"
    SKIPPED=$((SKIPPED+1))
    continue
  fi
  
  echo "=== RENDERING: $comp ==="
  if npx remotion render "$comp" "$outpath" --codec h264 --crf 18 --browser-executable "$BROWSER" 2>&1 | tail -5; then
    if [ -s "$outpath" ]; then
      echo "SUCCESS: $filename ($(du -h "$outpath" | cut -f1))"
      # IMMEDIATELY commit and push to GitHub so sandbox resets don't lose it
      git add "$outpath"
      git commit -m "render: $filename"
      git push origin main
      DONE=$((DONE+1))
      echo "PUSHED to GitHub: $filename"
    else
      echo "FAILED (empty file): $filename"
      FAILED=$((FAILED+1))
    fi
  else
    echo "FAILED (render error): $filename"
    FAILED=$((FAILED+1))
  fi
done

echo "=== BATCH COMPLETE ==="
echo "Rendered: $DONE | Skipped: $SKIPPED | Failed: $FAILED"
echo "Total MP4s: $(ls out/*.mp4 2>/dev/null | wc -l)"
