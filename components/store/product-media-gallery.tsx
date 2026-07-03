"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import type { CatalogProductMedia } from "@/lib/db/catalog";

function MediaViewer({ media, productName }: { media: CatalogProductMedia; productName: string }) {
  if (media.type === "YOUTUBE" && media.youtubeVideoId) {
    return <div className="aspect-video w-full overflow-hidden rounded-[1.75rem] bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${media.youtubeVideoId}`} title={media.title ?? `${productName} YouTube video`} aria-label={media.title ?? `${productName} YouTube video`} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>;
  }
  if (media.type === "VIDEO") {
    return <video className="aspect-video w-full rounded-[1.75rem] bg-black object-contain" controls poster={media.thumbnailUrl} preload="metadata"><source src={media.url} />Your browser does not support video playback.</video>;
  }
  return <div className="overflow-hidden rounded-[1.75rem] bg-stone-100">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="max-h-[34rem] w-full object-cover" src={media.url} alt={media.alt ?? productName} /></div>;
}

export function ProductMediaGallery({ media, productName }: { media: CatalogProductMedia[]; productName: string }) {
  const orderedMedia = useMemo(() => [...media].sort((a, b) => a.sortOrder - b.sortOrder), [media]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = orderedMedia[activeIndex];

  if (!active) {
    return <div className="card min-h-96 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-teal-950 to-amber-200 p-8 text-white"><p className="text-sm font-black uppercase tracking-[.25em]">Product media</p><p className="mt-28 text-3xl font-black">{productName}</p></div>;
  }

  return (
    <section className="card grid gap-4 p-4" aria-label="Product media gallery">
      <MediaViewer media={active} productName={productName} />
      {active.title || active.alt ? <p className="px-1 text-sm font-bold text-slate-600">{active.title ?? active.alt}</p> : null}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5" role="list" aria-label="Product media thumbnails">
        {orderedMedia.map((item, index) => (
          <button className={`relative overflow-hidden rounded-2xl border-2 bg-stone-100 p-1 text-left focus-ring ${activeIndex === index ? "border-teal-800" : "border-transparent"}`} key={`${item.url}-${item.sortOrder}`} onClick={() => setActiveIndex(index)} type="button">
            {item.type !== "IMAGE" ? <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-black uppercase text-white">{item.type === "YOUTUBE" ? "YouTube" : "Video"}</span> : null}
            <img className="aspect-square w-full rounded-xl object-cover" src={item.thumbnailUrl ?? (item.type === "YOUTUBE" && item.youtubeVideoId ? `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg` : item.url)} alt={item.alt ?? `${productName} media ${index + 1}`} />
          </button>
        ))}
      </div>
    </section>
  );
}
