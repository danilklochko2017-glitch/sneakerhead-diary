import type { Metadata } from "next";
import { Unbounded, Bricolage_Grotesque } from "next/font/google";
import GlowEffect from "@/components/GlowEffect";
// JetBrains Mono removed — all data/numbers now use Bricolage Grotesque
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-unbounded",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sneakerhead Diary — GER40 Trading Journal",
  description: "Live GER40 trading journal. Real trades, real data, real accountability.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${bricolage.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GlowEffect />
        {children}
      </body>
    </html>
  );
}
