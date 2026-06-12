import type { Metadata } from "next";
import { brand } from "@/lib/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${brand.name} | Responsible self-defense ecommerce`,
  description: `${brand.name} storefront for restricted-product shopping with eligibility checks before payment.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
