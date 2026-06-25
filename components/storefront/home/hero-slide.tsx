import Link from "next/link";
import type { HomepageSlide } from "@/lib/storefront/homepage-slides";

export function HeroSlide({ slide, active }: { slide: HomepageSlide; active: boolean }) {
  return (
    <article className={`${active ? "opacity-100" : "pointer-events-none opacity-0"} absolute inset-0 transition-opacity duration-500`} aria-hidden={!active}>
      {slide.type === "VIDEO" ? (
        <video className="h-full w-full object-cover" muted loop playsInline autoPlay preload="metadata" poster={slide.thumbnailUrl} aria-label={slide.headline}>
          <source src={slide.url} />
        </video>
      ) : (
        <img className="h-full w-full object-cover" src={slide.url} alt={slide.alt ?? slide.headline} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/25 to-transparent" />
      {slide.ctaHref ? (
        <Link className="absolute inset-0 z-0" href={slide.ctaHref} aria-label={`${slide.ctaLabel}: ${slide.headline}`}>
          <span className="sr-only">{slide.ctaLabel}</span>
        </Link>
      ) : null}
    </article>
  );
}
