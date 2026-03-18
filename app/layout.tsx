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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-gray-50 text-gray-900`}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-blue-700">Forecast Planner</Link>
          <Link href="/products" className="text-sm text-gray-600 hover:text-blue-600">Products</Link>
          <Link href="/forecast" className="text-sm text-gray-600 hover:text-blue-600">Forecast</Link>
          <Link href="/container" className="text-sm text-gray-600 hover:text-blue-600">Container</Link>
          <Link href="/production" className="text-sm text-gray-600 hover:text-blue-600">Production Split</Link>
          <Link href="/charts" className="text-sm text-gray-600 hover:text-blue-600">Charts</Link>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
