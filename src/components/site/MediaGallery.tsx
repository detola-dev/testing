import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, ImageOff } from "lucide-react";
import type { MediaItem } from "@/lib/store";
import { cn } from "@/lib/utils";

function VideoSlide({ item, active, alt }: { item: MediaItem; active: boolean; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.muted = true;
      setMuted(true);
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [active]);

  if (failed)
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="h-6 w-6" />
      </div>
    );

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = ref.current!;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <video
        ref={ref}
        src={active ? item.url : undefined}
        poster={item.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        onError={() => active && setFailed(true)}
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-2 left-2 flex gap-1.5">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause video" : "Play video"} className="grid h-8 w-8 place-items-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const v = ref.current!;
            v.muted = !v.muted;
            setMuted(v.muted);
          }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="grid h-8 w-8 place-items-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function MediaGallery({ media, alt, className, controls = true }: { media: MediaItem[]; alt: string; className?: string; controls?: boolean }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: media.length > 1 });
  const [index, setIndex] = useState(0);
  const onSelect = useCallback(() => embla && setIndex(embla.selectedScrollSnap()), [embla]);
  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    return () => void embla.off("select", onSelect);
  }, [embla, onSelect]);

  if (!media.length)
    return (
      <div className={cn("flex aspect-[4/5] items-center justify-center bg-muted text-muted-foreground", className)}>
        <ImageOff className="h-6 w-6" />
      </div>
    );

  return (
    <div className={cn("group relative aspect-[4/5] overflow-hidden bg-muted", className)}>
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {media.map((m, i) => (
            <div key={m.url + i} className="h-full min-w-0 flex-[0_0_100%]">
              {m.type === "video" ? (
                <VideoSlide item={m} active={i === index} alt={`${alt} video ${i + 1}`} />
              ) : (
                <img src={m.url} alt={`${alt} photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>
      {media.length > 1 && (
        <>
          {controls && (
            <>
              <button type="button" aria-label="Previous" onClick={(e) => { e.stopPropagation(); embla?.scrollPrev(); }} className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-card/85 shadow-sm backdrop-blur group-hover:grid">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Next" onClick={(e) => { e.stopPropagation(); embla?.scrollNext(); }} className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-card/85 shadow-sm backdrop-blur group-hover:grid">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 right-3 flex gap-1">
            {media.map((_, i) => (
              <button key={i} type="button" aria-label={`Show item ${i + 1}`} onClick={(e) => { e.stopPropagation(); embla?.scrollTo(i); }} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-primary" : "w-1.5 bg-card/90")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
