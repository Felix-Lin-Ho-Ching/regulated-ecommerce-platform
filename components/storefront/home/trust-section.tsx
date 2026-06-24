const points = ["Responsible ownership", "Ships only where allowed", "Clear checkout eligibility", "Secure order handling"];

export function TrustSection() {
  return (
    <section className="grid gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[.8fr_1.2fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-[.2em] text-teal-900">Compliance trust</p>
        <h2 className="mt-2 text-3xl font-black">Responsible ownership starts before checkout.</h2>
        <p className="mt-3 text-slate-600">We keep ordering clear and calm, with eligibility reviewed before restricted items move forward.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {points.map((point) => (
          <div className="rounded-2xl border border-stone-200 p-4 font-black" key={point}>
            {point}
          </div>
        ))}
      </div>
    </section>
  );
}
