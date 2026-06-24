const situations = [
  ["Late-night walks", "Easy to keep nearby when walking alone or heading home after dark."],
  ["Parking lots", "A compact tool can stay accessible when returning to your car or loading bags."],
  ["Travel and errands", "Simple preparedness for commutes, hotel stays, and everyday routines."],
] as const;

export function SituationCards() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {situations.map(([title, body]) => (
        <article className="card p-5" key={title}>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 leading-7 text-slate-600">{body}</p>
        </article>
      ))}
    </section>
  );
}
