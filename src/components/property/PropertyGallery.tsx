import { useState, useEffect } from "react";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

/** Mobile-first swipeable image gallery with thumbnail strip on larger screens. */
export function PropertyGallery({ images, title, city }: { images: string[]; title: string; city?: string | null }) {
  const altBase = city ? `${title} en ${city}` : title;
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground sm:aspect-[16/9]">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-7 w-7" />
          <span className="text-sm">Sin imágenes disponibles</span>
        </div>
      </div>
    );
  }

  // Keep the active index in sync with swipes/clicks.
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    setCurrent(api.selectedScrollSnap());

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="space-y-3">
      <Carousel
        setApi={setApi}
        opts={{
          loop: images.length > 1,
          watchDrag: (_api, event) => event.type !== "mousedown",
        }}
        className="overflow-hidden rounded-xl border border-border"
      >
        <CarouselContent className="ml-0">
          {images.map((src, i) => (
            <CarouselItem key={i} className="pl-0">
              <img
                src={src}
                alt={`${altBase} — imagen ${i + 1}`}
                className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={() => api?.scrollPrev()}
              className="absolute left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition hover:bg-background sm:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={() => api?.scrollNext()}
              className="absolute right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition hover:bg-background sm:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 z-10 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow backdrop-blur">
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver imagen ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === current ? "border-primary" : "border-transparent opacity-70",
              )}
            >
              <img
                src={src}
                alt={`${altBase} — miniatura ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
