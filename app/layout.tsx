import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forecast Planner",
  description: "AU + UK Production Forecasting & Container Optimisation",
};

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/forecast", label: "Forecast" },
  { href: "/container", label: "Container" },
  { href: "/production", label: "Production" },
  { href: "/charts", label: "Charts" },
  { href: "/export", label: "Export" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-[#f5f5f7] text-gray-900`}>
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-6 py-3 flex items-center gap-8 sticky top-0 z-50">
          <Link href="/" className="font-bold text-lg tracking-tight text-gray-900">
            Forecast Planner
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
