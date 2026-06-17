import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://vysera.ai"),
  title: {
    default: "Vysera — AI Video Creation Platform",
    template: "%s | Vysera",
  },
  description:
    "Create stunning AI-powered videos with Vysera. Transform your content creation workflow with cutting-edge artificial intelligence.",
  keywords: [
    "AI video",
    "video creation",
    "AI content",
    "Vysera",
    "TikTok",
    "Reels",
    "Shorts",
    "video editor",
    "artificial intelligence",
  ],
  authors: [{ name: "Vysera" }],
  creator: "Vysera",
  publisher: "Vysera",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vysera.ai",
    siteName: "Vysera",
    title: "Vysera — AI Video Creation Platform",
    description:
      "Create stunning AI-powered videos with Vysera. Transform your content creation workflow.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vysera - AI Video Creation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vysera — AI Video Creation Platform",
    description:
      "Create stunning AI-powered videos with Vysera. Transform your content creation workflow.",
    images: ["/og-image.png"],
    creator: "@vysera",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/app-icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/site.webmanifest",
  applicationName: "Vysera",
  appleWebApp: {
    capable: true,
    title: "Vysera",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        style={{
          fontFamily: "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
