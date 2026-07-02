/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { HomepageHeroMedia } from "@/lib/storefront/homepage-media";

type Props = { media: HomepageHeroMedia | null };

const fallback = {
  title: "Prepared when the walk home feels different.",
  subtitle: "Compact self-defense tools for people who want one extra layer of protection, without overcomplicating it.",
  ctaLabel: "Shop devices",
  ctaHref: "/products",
};

function MediaPanel({ media }: Props) {
  if (media?.type === "VIDEO" && media.url) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-slate-900 shadow-2xl">
        <video className="aspect-[4/3] h-full w-full object-cover" muted loop playsInline autoPlay preload="metadata" poster={media.thumbnailUrl} aria-label={media.alt ?? "Homepage story video"}>
          <source src={media.url} />
        </video>
        {media.thumbnailUrl ? <img className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover" src={media.thumbnailUrl} alt="" /> : null}
      </div>
    );
  }
  if (media?.url) {
    return <img className="aspect-[4/3] w-full rounded-[2rem] border border-white/50 object-cover shadow-2xl" src={media.url} alt={media.alt ?? "Homepage story image"} />;
  }
  return (
    <div className="aspect-[4/3] rounded-[2rem] border border-white/50 bg-[radial-gradient(circle_at_25%_20%,rgba(20,184,166,.26),transparent_28%),linear-gradient(135deg,#123a42,#f3efe6)] shadow-2xl" aria-label="Calm prepared lifestyle visual" />
  );
}

export function HeroMedia({ media }: Props) {
  const title = media?.title || fallback.title;
  const subtitle = media?.subtitle || fallback.subtitle;
  const primaryLabel = media?.ctaLabel || fallback.ctaLabel;
  const primaryHref = media?.ctaHref || fallback.ctaHref;
  return (
    <section className="grid items-center gap-8 rounded-[2rem] bg-[#e9e3d7] p-5 md:grid-cols-2 md:p-10">
      <div className="order-2 md:order-1">
        <p className="text-sm font-black uppercase tracking-[.22em] text-teal-900">Responsible everyday preparedness</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">{subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href={primaryHref}>{primaryLabel}</Link>
          <Link className="btn btn-secondary" href="#how-ordering-works">How ordering works</Link>
        </div>
      </div>
      <div className="order-1 md:order-2"><MediaPanel media={media} /></div>
    </section>
  );
}
