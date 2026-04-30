import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, PlayCircle } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  fallbackUrl?: string;
  title: string;
  videoCredit?: string;
  durationMinutes?: number;
}

function getVideoId(url: string): string | undefined {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return m[1];
    const v = u.searchParams.get("v");
    if (v) return v;
  } catch {}
  return undefined;
}

function ensureEmbedParams(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("rel")) u.searchParams.set("rel", "0");
    if (!u.searchParams.has("modestbranding")) u.searchParams.set("modestbranding", "1");
    return u.toString();
  } catch {
    return url;
  }
}

function toFallbackUrl(videoUrl: string, fallbackUrl?: string): string | undefined {
  if (fallbackUrl) return fallbackUrl;
  const id = getVideoId(videoUrl);
  return id ? `https://www.youtube.com/watch?v=${id}` : undefined;
}

const LOAD_TIMEOUT_MS = 6000;

export function VideoPlayer({ videoUrl, fallbackUrl, title, videoCredit, durationMinutes }: VideoPlayerProps) {
  const videoId = getVideoId(videoUrl);
  const embedUrl = ensureEmbedParams(videoUrl);
  const watchUrl = toFallbackUrl(videoUrl, fallbackUrl);
  // YouTube returns a tiny "default.jpg" (120x90) for missing/private videos
  // and a full-resolution image for available ones, so we can probe availability.
  const thumbProbeUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined;

  const [available, setAvailable] = useState<boolean | null>(null);
  const [activated, setActivated] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Probe video availability via thumbnail dimensions (no API key required).
  useEffect(() => {
    setAvailable(null);
    setActivated(false);
    setIframeLoaded(false);
    setIframeFailed(false);
    if (!thumbProbeUrl) {
      setAvailable(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      // Real videos have mqdefault width >= 320. Missing ones return a 120px placeholder.
      setAvailable(img.naturalWidth >= 200);
    };
    img.onerror = () => setAvailable(false);
    img.src = thumbProbeUrl;
  }, [thumbProbeUrl]);

  // Fail-fast: if iframe doesn't load quickly after activation, show fallback CTA.
  useEffect(() => {
    if (!activated) return;
    timeoutRef.current = window.setTimeout(() => {
      if (!iframeLoaded) setIframeFailed(true);
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [activated, iframeLoaded]);

  const showUnavailable = available === false || iframeFailed;
  const posterUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;

  return (
    <div className="space-y-2">
      <div className="w-full rounded-xl overflow-hidden bg-muted aspect-video relative border border-border/40">
        {showUnavailable ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center bg-muted">
            <p className="font-body text-foreground font-medium">
              This video can't play here.
            </p>
            <p className="text-sm font-body text-muted-foreground max-w-sm">
              The video owner has restricted embedding, or the video is no longer available on YouTube. You can still watch it on YouTube.
            </p>
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-2 btn-copper px-6 py-3 text-sm uppercase tracking-wide mt-1"
              >
                Watch on YouTube <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : !activated ? (
          // Show poster + play button until user clicks. Avoids loading broken iframes
          // and keeps the page fast on mobile.
          <button
            type="button"
            onClick={() => setActivated(true)}
            className="group absolute inset-0 w-full h-full flex items-center justify-center"
            aria-label={`Play ${title}`}
          >
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <PlayCircle
              className="relative w-20 h-20 text-white drop-shadow-lg group-hover:scale-110 transition-transform"
              strokeWidth={1.25}
            />
            {available === null && (
              <Loader2 className="absolute top-3 right-3 w-5 h-5 text-white/80 animate-spin" />
            )}
          </button>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-muted">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <iframe
              src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`}
              title={title}
              className="w-full h-full relative z-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeFailed(true)}
            />
          </>
        )}
      </div>
      <div className="flex items-center justify-between px-1">
        {(videoCredit || durationMinutes) && (
          <p className="text-[11px] font-body text-muted-foreground/70">
            {durationMinutes && <span>🎬 {durationMinutes} min</span>}
            {durationMinutes && videoCredit && <span> · </span>}
            {videoCredit && <span>📹 {videoCredit} · Used under Creative Commons licence</span>}
          </p>
        )}
        {watchUrl && (
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-body text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0 ml-2"
          >
            Open on YouTube <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
