import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSS Clip Path Generator | Create Bezier Curves Online Free",
  description:
    "Free online CSS clip-path generator. Create complex polygon and bezier curve clip paths visually. Export ready-to-use CSS code for your web projects.",
  keywords: [
    "clip-path generator",
    "css clip path",
    "clip path curve",
    "bezier curve generator",
    "css polygon generator",
    "clip-path maker",
    "css shape generator",
    "clip path online",
  ],
  authors: [{ name: "Clip Path App" }],
  creator: "Clip Path App",
  metadataBase: new URL("https://clippath.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clippath.app",
    siteName: "Clip Path Generator",
    title: "CSS Clip Path Generator | Create Bezier Curves Online Free",
    description:
      "Free online CSS clip-path generator. Create complex polygon and bezier curve clip paths visually. Export ready-to-use CSS code.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CSS Clip Path Generator | Create Bezier Curves Online Free",
    description:
      "Free online CSS clip-path generator. Create complex polygon and bezier curve clip paths visually.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://clippath.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CSS Clip Path Generator",
  description:
    "Free online CSS clip-path generator. Create complex polygon and bezier curve clip paths visually. Export ready-to-use CSS code for your web projects.",
  url: "https://clippath.app",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Visual clip-path editor",
    "Bezier curve support",
    "Polygon shape creation",
    "Real-time CSS code generation",
    "Image preview",
    "Copy to clipboard",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
