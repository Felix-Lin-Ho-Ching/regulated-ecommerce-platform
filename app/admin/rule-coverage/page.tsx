import { AdminShell, RuleCoverageMatrix, SectionHeader } from "@/components/ui";
import { getRuleCoverageRows } from "@/lib/db/catalog";

export default async function RuleCoveragePage() {
  const rows = await getRuleCoverageRows();

  return (
    <AdminShell title="Rule coverage">
      <SectionHeader eyebrow="Launch readiness" title="Rule coverage matrix">
        Missing rules and unreviewed restricted-product states do not automatically allow checkout. Unknown states stay manual review until owner-entered and reviewed rules exist.
      </SectionHeader>
      <RuleCoverageMatrix rows={rows} />
    </AdminShell>
  );
}
