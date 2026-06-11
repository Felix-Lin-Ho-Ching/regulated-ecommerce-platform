import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CivicGuard Commerce Prototype", description: "Static UX prototype for restricted-product ecommerce." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
