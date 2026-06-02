import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Aspekta — the primary typeface for the whole site (display, headings, body,
// UI). Self-hosted variable font (SIL OFL, weights 100–900).
const aspekta = localFont({
  src: "./fonts/AspektaVF.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

// IBM Plex Mono — technical/mono accent for section labels, indices and data
// figures. A Google Fonts substitute for the brand's "TG Frekuent Mono".
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carbon to Zero — The Shape of Global Emissions",
  description:
    "A data-driven portrait of where the world's CO₂ comes from, who emits it, and the long road to net zero. Built with D3.",
  applicationName: "Carbon to Zero",
};

export const viewport: Viewport = {
  themeColor: "#05060e",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${aspekta.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider delayDuration={120}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
