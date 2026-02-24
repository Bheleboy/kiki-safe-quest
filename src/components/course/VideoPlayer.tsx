import { useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  fallbackUrl?: string;
  title: string;
}

export function VideoPlayer({ videoUrl, fallbackUrl, title }: VideoPlayerProps) {
  const [error, setError] = useState(false);

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-foreground/5 aspect-video relative">
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
          <span className="text-4xl">📺</span>
          <p className="font-body text-muted-foreground">Video couldn't load here.</p>
          {fallbackUrl && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display font-bold text-primary-foreground"
            >
              Watch Video ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
