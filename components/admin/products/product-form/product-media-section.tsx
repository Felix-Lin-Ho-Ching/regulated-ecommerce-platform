import { useState } from "react";
import { maxProductMediaRows } from "@/lib/products/validation";
import type { AdminProductDetail } from "@/lib/products/service";
import { Field } from "./form-controls";
import { nextProductFormKey, RepeatableList } from "./repeatable-list";
import type { MediaItem } from "./product-form-types";

export function ProductMediaSection({
  product,
}: {
  product?: AdminProductDetail;
}) {
  const [items, setItems] = useState<MediaItem[]>(() =>
    (product?.media ?? []).map((media, index) => ({
      key: `media-${index}`,
      type: media.type === "YOUTUBE" ? "YOUTUBE" : "IMAGE",
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      alt: media.alt,
      title: media.title,
      editing: false,
    })),
  );

  if (!product) {
    return (
      <section className="grid gap-3 rounded-2xl border border-stone-200 p-4 md:col-span-2">
        <div>
          <h3 className="font-black text-slate-950">Product media</h3>
          <p className="text-sm text-slate-600">
            Save the product as draft before adding images or YouTube videos.
          </p>
        </div>
        <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-600">
          Media controls are disabled until this draft has a product record.
        </p>
      </section>
    );
  }

  return (
    <>
      <input type="hidden" name="mediaSubmitted" value="1" />
      <RepeatableList
        title="Product media"
        help="Current media list. Use Add media for add image or add YouTube link, then edit media, remove media, or move up/down. Limits: 8 images, 2 YouTube videos, 10 total media items."
        addLabel="+ Add media"
        max={maxProductMediaRows}
        items={items}
        setItems={setItems}
        emptyLabel="No product media yet. Add media when you are ready."
        makeItem={(): MediaItem => ({
          key: nextProductFormKey("media"),
          type: "IMAGE",
          alt: product?.name,
          title: product?.name,
          editing: true,
          isNew: true,
        })}
        summary={(item) =>
          item.title ||
          item.alt ||
          (item.type === "YOUTUBE" ? "YouTube video" : "Image media")
        }
      >
        {(item, index) => (
          <>
            <input
              type="hidden"
              name={`mediaSortOrder${index}`}
              value={index}
            />
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Media kind
              <select
                className="input"
                name={`mediaType${index}`}
                value={item.type}
                onChange={(event) =>
                  setItems(
                    items.map((row) =>
                      row.key === item.key
                        ? {
                            ...row,
                            type: event.target.value as "IMAGE" | "YOUTUBE",
                          }
                        : row,
                    ),
                  )
                }
              >
                <option value="IMAGE">Upload image</option>
                <option value="YOUTUBE">Add YouTube video link</option>
              </select>
            </label>
            {item.type === "IMAGE" ? (
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                Image URL
                <input
                  className="input"
                  name={`mediaUrl${index}`}
                  defaultValue={item.url ?? ""}
                />
                <span className="text-xs font-medium text-slate-500">
                  Or upload a product image below.
                </span>
                <input
                  className="input"
                  name={`mediaUpload${index}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                />
              </label>
            ) : (
              <Field
                label="YouTube video URL"
                name={`mediaYoutubeUrl${index}`}
                defaultValue={item.url}
                placeholder="https://www.youtube.com/watch?v=..."
                hint="Paste a normal YouTube or youtu.be link. Video files are not uploaded."
              />
            )}
            {item.type === "YOUTUBE" ? (
              <Field
                label="Thumbnail URL"
                name={`mediaThumbnailUrl${index}`}
                defaultValue={item.thumbnailUrl}
                hint="Optional thumbnail shown before playback when supported."
              />
            ) : null}
            <Field
              label="Alt text"
              name={`mediaAlt${index}`}
              defaultValue={item.alt ?? product?.name}
              placeholder="Front view of StunFry compact safety device."
              hint="Describe the image for accessibility and SEO. Example: Front view of StunFry compact safety device."
            />
            <Field
              label="Title / aria label"
              name={`mediaTitle${index}`}
              defaultValue={item.title ?? product?.name}
              placeholder="Product demonstration video"
              hint="Short title used for accessibility. Example: Product demonstration video."
            />
          </>
        )}
      </RepeatableList>
    </>
  );
}
