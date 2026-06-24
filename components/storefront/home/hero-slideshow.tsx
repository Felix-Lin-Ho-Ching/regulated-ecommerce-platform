"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HomepageSlide } from "@/lib/storefront/homepage-slides";
import { HeroSlide } from "@/components/storefront/home/hero-slide";

function FallbackHero() {
  return <section className="rounded-[2rem] bg-slate-950 px-6 py-20 text-white md:px-12"><p className="text-sm font-black uppercase tracking-[.25em] text-teal-100">Responsible preparedness</p><h1 className="mt-4 max-w-3xl text-4xl font-black md:text-6xl">Prepared when the walk home feels different.</h1><div className="mt-8 flex flex-wrap gap-3"><Link className="btn btn-primary" href="/products">Shop devices</Link><Link className="btn btn-secondary" href="#how-ordering-works">How ordering works</Link></div></section>;
}

export function HeroSlideshow({ slides }: { slides: HomepageSlide[] }) {
  const activeSlides = slides.filter((slide) => slide.enabled).slice(0, 3);
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [activeSlides.length]);
  if (activeSlides.length === 0) return <FallbackHero />;
  const go = (next: number) => setIndex((next + activeSlides.length) % activeSlides.length);
  return (
    <section className="group relative min-h-[620px] overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl" aria-roledescription="carousel" aria-label="Homepage hero slideshow" onMouseEnter={(event) => event.currentTarget.setAttribute("data-paused", "true")}>
      <div className="absolute inset-0">{activeSlides.map((slide, slideIndex) => <HeroSlide key={slide.id} slide={slide} active={slideIndex === index} />)}</div>
      {activeSlides.length > 1 ? <>
        <button className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-slate-950 shadow" type="button" aria-label="Previous hero slide" onClick={() => go(index - 1)}>‹</button>
        <button className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl font-black text-slate-950 shadow" type="button" aria-label="Next hero slide" onClick={() => go(index + 1)}>›</button>
        <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center gap-2">
          {activeSlides.map((slide, slideIndex) => <button key={slide.id} className={`h-3 rounded-full transition-all ${slideIndex === index ? "w-9 bg-white" : "w-3 bg-white/50"}`} type="button" aria-label={`Show slide ${slideIndex + 1}`} aria-current={slideIndex === index} onClick={() => setIndex(slideIndex)} />)}
        </div>
      </> : null}
    </section>
  );
}
