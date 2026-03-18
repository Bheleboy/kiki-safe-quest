import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  fallbackUrl?: string;
  title: string;
  videoCredit?: string;
  durationMinutes?: number;
}

function ensureEmbedParams(url: string): string {
  try {
    const u = new URL(url);
    // Add origin for embed API access and rel=0 to keep related videos from same channel
    if (!u.searchParams.has("rel")) u.searchParams.set("rel", "0");
    if (!u.searchParams.has("modestbranding")) u.searchParams.set("modestbranding", "1");
    return u.toString();
  } catch {
    return url;
  }
}

function toFallbackUrl(videoUrl: string, fallbackUrl?: string): string | undefined {
  if (fallbackUrl) return fallbackUrl;
  // Derive watch URL from embed URL
  try {
    const u = new URL(videoUrl);
    const match = u.pathname.match(/\/embed\/([^/?]+)/);
    if (match) return `https://www.youtube.com/watch?v=${match[1]}`;
  } catch {}
  return undefined;
}

export function VideoPlayer({ videoUrl, fallbackUrl, title, videoCredit, durationMinutes }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const embedUrl = ensureEmbedParams(videoUrl);
  const watchUrl = toFallbackUrl(videoUrl, fallbackUrl);

  return (
    <div className="space-y-2">
      <div className="w-full rounded-xl overflow-hidden bg-muted aspect-video relative border border-border/40">
        {!error ? (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-muted">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full relative z-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false); }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <p className="font-body text-muted-foreground">Video couldn't load here.</p>
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-2 btn-copper px-6 py-3 text-sm uppercase tracking-wide"
              >
                Watch Video <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
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
        {watchUrl && !error && (
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
