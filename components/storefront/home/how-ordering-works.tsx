const steps = ["Choose your device", "We verify shipping eligibility at checkout", "Eligible orders are sent for fulfillment"];

export function HowOrderingWorks() {
  return (
    <section id="how-ordering-works" className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-3xl font-black">How ordering works</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div className="rounded-2xl border border-stone-200 p-4" key={step}>
            <span className="badge">{index + 1}</span>
            <p className="mt-3 font-bold">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
