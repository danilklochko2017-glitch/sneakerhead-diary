import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import GlowEffect from "@/components/GlowEffect";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sneakerhead Diary — GER40 Trading Journal",
  description: "Live GER40 trading journal. Real trades, real data, real accountability.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body>
        <GlowEffect />
        {children}
      </body>
    </html>
  );
}
