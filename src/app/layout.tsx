import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Agentation } from "agentation";
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
  title: "Carbon to Zero — The CO₂ We Steer Out of the Grid",
  description:
    "How much carbon Companion Energy saves by steering customers' batteries — charging on clean power, discharging when the grid is dirtiest. Built with D3.",
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
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
