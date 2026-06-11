import { AppShell } from "@/components/ui";import { ProductDetail } from "@/components/store-products";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <AppShell><ProductDetail slug={slug}/></AppShell>}
