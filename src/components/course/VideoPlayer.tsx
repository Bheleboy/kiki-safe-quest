import { useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  fallbackUrl?: string;
  title: string;
  videoCredit?: string;
  durationMinutes?: number;
}

export function VideoPlayer({ videoUrl, fallbackUrl, title, videoCredit, durationMinutes }: VideoPlayerProps) {
  const [error, setError] = useState(false);

  return (
    <div className="space-y-2">
      <div className="w-full rounded-xl overflow-hidden bg-muted aspect-video relative border border-border/40">
        {!error ? (
          <iframe
            src={videoUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <p className="font-body text-muted-foreground">Video couldn't load here.</p>
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex items-center gap-2 btn-copper px-6 py-3 text-sm uppercase tracking-wide"
              >
                Watch Video
              </a>
            )}
          </div>
        )}
      </div>
      {(videoCredit || durationMinutes) && (
        <p className="text-[11px] font-body text-muted-foreground/70 px-1">
          {durationMinutes && <span>🎬 {durationMinutes} min</span>}
          {durationMinutes && videoCredit && <span> · </span>}
          {videoCredit && <span>📹 {videoCredit} · Used under Creative Commons licence</span>}
        </p>
      )}
    </div>
  );
}
