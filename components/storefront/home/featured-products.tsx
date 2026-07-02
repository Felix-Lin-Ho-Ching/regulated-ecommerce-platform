/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { CatalogProduct } from "@/lib/db/catalog";
import { money } from "@/lib/utils";

function ProductImage({ product }: { product: CatalogProduct }) {
  const image = product.media.find((media) => media.type === "IMAGE") ?? product.media[0];

  if (image?.url) {
    return <img className="h-48 w-full rounded-2xl object-cover" src={image.url} alt={image.alt ?? product.name} />;
  }

  return <div className="h-48 rounded-2xl bg-gradient-to-br from-slate-100 to-teal-100" />;
}

export function FeaturedProducts({ products }: { products: CatalogProduct[] }) {
  return (
    <section id="featured-products">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">Featured products</p>
          <h2 className="text-3xl font-black">Preparedness picks</h2>
        </div>
        <Link className="btn btn-secondary" href="/products">
          View all
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <article className="card flex flex-col p-4" key={product.id}>
            <ProductImage product={product} />
            <h3 className="mt-4 font-black">{product.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
            {product.restricted ? (
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-teal-900">Restricted item · verified at checkout</p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-3 pt-4">
              <div>
                <strong>{money(product.price)}</strong>
                <p className="text-xs text-slate-500">{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</p>
              </div>
              <Link className="btn btn-secondary" href={`/products/${product.slug}`}>
                View product
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
