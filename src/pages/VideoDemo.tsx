import videoAsset from "@/assets/kiki-lesson1-demo.mp4.asset.json";

export default function VideoDemo() {
  const url = videoAsset.url;
  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center gap-6">
      <div className="max-w-3xl w-full space-y-4">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Kiki Lesson 1 — Demo Clip
        </h1>
        <p className="font-body text-muted-foreground text-sm">
          Temporary preview page. 10-second videogen test for the ages 6–9 stream.
        </p>
        <video
          src={url}
          controls
          playsInline
          className="w-full rounded-xl border border-border/40 bg-black"
        />
        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-copper px-5 py-3 text-sm uppercase tracking-wide"
          >
            Open direct link
          </a>
          <a
            href={url}
            download="kiki-lesson1-demo.mp4"
            className="rounded-lg bg-muted px-5 py-3 text-sm font-display font-medium uppercase tracking-wide hover:bg-muted/80 transition-colors"
          >
            Download MP4
          </a>
        </div>
        <p className="text-xs text-muted-foreground/70 font-body break-all pt-2">
          Direct URL: <code>{url}</code>
        </p>
      </div>
    </div>
  );
}
