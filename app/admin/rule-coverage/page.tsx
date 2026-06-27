import { AdminShell, RuleCoverageMatrix, SectionHeader, AlertPanel } from "@/components/ui";
import { getRuleCoverageRows, getRuleCoverageSummary } from "@/lib/db/catalog";

export default async function RuleCoveragePage() {
  const [rows, summary] = await Promise.all([getRuleCoverageRows(), getRuleCoverageSummary()]);

  return (
    <AdminShell title="Rule coverage">
      <SectionHeader eyebrow="Launch readiness" title="Rule coverage matrix">
        Missing rules and unreviewed restricted-product states do not automatically allow checkout. Unknown states stay blocked until owner-entered and reviewed rules exist.
      </SectionHeader>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="card p-4"><p className="text-sm text-slate-500">Total expected states</p><p className="text-2xl font-black">{summary.expectedStates}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Total state rules found</p><p className="text-2xl font-black">{summary.totalStateRulesFound}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Missing count</p><p className="text-2xl font-black">{summary.missingCount}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">BLOCK count</p><p className="text-2xl font-black">{summary.blockCount}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">ALLOW count</p><p className="text-2xl font-black">{summary.allowCount}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Unsafe outcome count</p><p className="text-2xl font-black">{summary.unsafeOutcomeCount}</p></div>
      </div>
      {summary.allowCount > 0 ? <div className="mb-4"><AlertPanel title="ALLOW rules require review" tone="warning">At least one restricted destination is allowed. Confirm audit notes and legal/source notes before enabling launch gates.</AlertPanel></div> : null}
      {summary.allowWithoutNotesCount > 0 ? <div className="mb-4"><AlertPanel title="Launch gate blocked" tone="danger">One or more ALLOW rules are missing an audit note or legal/source note.</AlertPanel></div> : null}
      {summary.mockFallbackActive ? <div className="mb-4"><AlertPanel title="Mock fallback rules active" tone="danger">Database-backed restricted destination rules are unavailable. Production checkout must not rely on mock fallback rules.</AlertPanel></div> : null}
      <RuleCoverageMatrix rows={rows} />
    </AdminShell>
  );
}
