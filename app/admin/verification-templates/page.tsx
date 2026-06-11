import { AdminShell, AdminDataTable } from "@/components/ui";import { verificationTemplates } from "@/lib/mock-data";
export default function Templates(){return <AdminShell title="Verification templates"><AdminDataTable columns={["Template","Category","Requirements"]} rows={verificationTemplates.map(t=>[t.name,t.category,t.requirements.join(", ")])}/></AdminShell>}
