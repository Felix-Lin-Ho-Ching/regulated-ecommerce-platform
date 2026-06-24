import Link from "next/link";
import type { HomepageSlide } from "@/lib/storefront/homepage-slides";

export function HeroSlide({ slide, active }: { slide: HomepageSlide; active: boolean }) {
  const badges = [slide.badge1, slide.badge2, slide.badge3].filter(Boolean);
  return (
    <article className={`${active ? "opacity-100" : "pointer-events-none opacity-0"} absolute inset-0 transition-opacity duration-500`} aria-hidden={!active}>
      {slide.type === "VIDEO" ? (
        <video className="h-full w-full object-cover" muted loop playsInline autoPlay preload="metadata" poster={slide.thumbnailUrl} aria-label={slide.headline}>
          <source src={slide.url} />
        </video>
      ) : (
        <img className="h-full w-full object-cover" src={slide.url} alt={slide.alt ?? slide.headline} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-white/10" />
      <div className="absolute inset-0 flex items-end md:items-center">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-xl rounded-[2rem] border border-white/20 bg-slate-950/55 p-6 text-white shadow-2xl backdrop-blur md:ml-auto md:p-8">
            <p className="text-xs font-black uppercase tracking-[.28em] text-teal-100">Responsible preparedness</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">{slide.headline}</h1>
            <p className="mt-4 text-base leading-7 text-stone-100 md:text-lg">{slide.subheadline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link className="btn btn-primary" href={slide.ctaHref}>{slide.ctaLabel}</Link>
              <Link className="btn border-white/40 bg-white/10 text-white hover:bg-white/20" href="#how-ordering-works">How ordering works</Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge) => <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white" key={badge}>{badge}</span>)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
