import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardErrorBoundary } from "../components/DashboardErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Customer Intelligence Dashboard",
  description: "AI-powered customer health monitoring and intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          Skip-to-content link — visually hidden until focused via keyboard.
          Satisfies WCAG 2.1 SC 2.4.1 (Bypass Blocks) and the production spec
          requirement for a skip link that moves focus to <main>.
        */}
        <a
          href="#main-content"
          className={[
            'sr-only focus:not-sr-only',
            'focus:fixed focus:top-4 focus:left-4 focus:z-50',
            'focus:inline-flex focus:items-center focus:px-4 focus:py-2',
            'focus:bg-blue-600 focus:text-white focus:text-sm focus:font-medium',
            'focus:rounded-lg focus:shadow-lg',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600',
          ].join(' ')}
        >
          Skip to main content
        </a>

        <DashboardErrorBoundary>
          {children}
        </DashboardErrorBoundary>
      </body>
    </html>
  );
}
