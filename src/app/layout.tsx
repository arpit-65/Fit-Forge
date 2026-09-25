import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/nav/Navbar";
import { MotionProvider } from "@/components/MotionProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Inter for body and general UI
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

// Playfair Display for hero headline and section titles ONLY
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const APP_URL =
  (rawAppUrl && rawAppUrl.length > 0)
    ? rawAppUrl
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://fitforge.vercel.app";

let safeMetadataBase: URL;
try {
  safeMetadataBase = new URL(APP_URL.startsWith("http") ? APP_URL : `https://${APP_URL}`);
} catch {
  safeMetadataBase = new URL("https://fitforge.vercel.app");
}

export const metadata: Metadata = {
  title: {
    default: "FitForge — Campus Fitness Dropout Prevention",
    template: "%s | FitForge",
  },
  description:
    "FitForge helps campus fitness programs identify at-risk students, build squads, and run challenges to prevent dropout — SIH PS 26196.",
  keywords: [
    "campus fitness",
    "dropout prevention",
    "squads",
    "challenges",
    "SIH",
    "student wellness",
    "fitness tracker",
  ],
  metadataBase: safeMetadataBase,
  // Open Graph (social preview cards)
  openGraph: {
    title: "FitForge — Campus Fitness Dropout Prevention",
    description:
      "Identifies at-risk students before they quit. Built for SIH PS 26196.",
    url: APP_URL,
    siteName: "FitForge",
    locale: "en_IN",
    type: "website",
  },
  // Twitter / X card
  twitter: {
    card: "summary_large_image",
    title: "FitForge — Campus Fitness Dropout Prevention",
    description:
      "Identifies at-risk students before they quit. Built for SIH PS 26196.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  // Canonical URL
  alternates: {
    canonical: APP_URL,
  },
};

export const viewport: Viewport = {
  // Proper mobile viewport
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom (accessibility)
  themeColor: "#0B0F14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen bg-[var(--ff-bg-primary)] text-[var(--ff-text-primary)]`}
      >
        {/*
          Skip-to-content link: keyboard users can jump past the Navbar
          immediately. Visually hidden until focused.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded-md focus:bg-[var(--ff-accent)] focus:px-4 focus:py-2 focus:text-[var(--ff-bg-primary)] focus:font-semibold focus:outline-none focus:shadow-lg"
        >
          Skip to main content
        </a>

        <Navbar />

        <main
          id="main-content"
          className="relative min-h-[calc(100vh-4rem)]"
          tabIndex={-1}
        >
          <MotionProvider>{children}</MotionProvider>
        </main>

        {/* Real-time Vercel Analytics & Web Vitals tracking */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
