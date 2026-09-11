import { Footprints } from "lucide-react";

import { cn } from "@/lib/utils";

type ShoeImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
};

function ShoeImage({ src, alt, className, imageClassName }: ShoeImageProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-surface",
        className,
      )}
    >
      {src ? (
        // Catalog image hosts are data-managed and cannot be enumerated in next.config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-contain", imageClassName)}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 text-center text-muted-foreground">
          <Footprints className="h-8 w-8 text-primary" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.14em]">
            Image unavailable
          </span>
        </div>
      )}
    </div>
  );
}

export { ShoeImage, type ShoeImageProps };

