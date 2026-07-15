import { useState, type ReactNode } from "react";

let newKey = 0;
export function nextProductFormKey(prefix: string) {
  return `new-${prefix}-${newKey++}`;
}

export function RepeatableList<T extends { key: string; editing?: boolean; isNew?: boolean }>({
  title, help, addLabel, max, items, setItems, emptyLabel, makeItem, summary, children,
}: {
  title: string; help: string; addLabel: string; max: number; items: T[]; setItems: (items: T[]) => void; emptyLabel: string; makeItem: () => T; summary: (item: T, index: number) => string; children: (item: T, index: number) => ReactNode;
}) {
  const [status, setStatus] = useState<string>();
  const limitReached = items.length >= max;
  const showStatus = (message: string) => { setStatus(message); window.setTimeout(() => setStatus(undefined), 1800); };
  const move = (index: number, delta: number) => {
    const next = [...items]; const target = index + delta;
    if (target < 0 || target >= next.length) return;
    showStatus("Updating..."); [next[index], next[target]] = [next[target], next[index]]; setItems(next); showStatus("Updated. Save product to persist this order.");
  };
  const remove = (index: number) => {
    const item = items[index];
    if (!item.isNew && !window.confirm(`Remove ${summary(item, index)}? Existing saved items will be removed when you save the product.`)) return;
    showStatus("Removing..."); setItems(items.filter((_, i) => i !== index)); showStatus("Removed. Save product to persist this removal.");
  };
  const add = () => { showStatus("Adding..."); setItems([...items, makeItem()]); showStatus("Added. Fill in details, then save product."); };
  return (
    <section className="grid gap-3 rounded-2xl border border-stone-200 p-4 md:col-span-2">
      <div><h3 className="font-black text-slate-950">{title}</h3><p className="text-sm text-slate-600">{help}</p>{status ? <p className="mt-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800" role="status" aria-live="polite">{status}</p> : null}</div>
      {items.length === 0 ? <p className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-slate-600">{emptyLabel}</p> : null}
      <div className="grid gap-3">{items.map((item, index) => (
        <article className="rounded-2xl border border-stone-200 bg-white p-3" key={item.key}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">{index + 1}. {summary(item, index)}</p><div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary px-3 py-2" type="button" onClick={() => setItems(items.map((row, i) => i === index ? { ...row, editing: !row.editing } : row))}>{item.editing ? "Done" : "Edit"}</button>
            <button className="btn btn-secondary px-3 py-2" type="button" disabled={index === 0} onClick={() => move(index, -1)}>Move up</button>
            <button className="btn btn-secondary px-3 py-2" type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)}>Move down</button>
            <button className="btn btn-secondary px-3 py-2" type="button" onClick={() => remove(index)}>Remove</button>
          </div></div>
          <div className={item.editing ? "mt-3 grid gap-3 md:grid-cols-2" : "hidden"} aria-hidden={!item.editing}>{children(item, index)}</div>
        </article>
      ))}</div>
      {limitReached ? <p className="text-sm font-bold text-amber-700">Maximum reached: {max} items. Remove an item before adding another.</p> : <button className="btn btn-secondary w-fit" type="button" onClick={add}>{addLabel}</button>}
    </section>
  );
}
