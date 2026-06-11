import type { Metadata } from "next";
import { brand } from "@/lib/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} | Safety products and eligibility-aware checkout`,
  description: "Shop safety products with restricted-product notices and eligibility checks before payment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
