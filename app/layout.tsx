import type { Metadata } from "next";
import GlowEffect from "@/components/GlowEffect";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sneakerhead Diary — GER40 Trading Journal",
  description: "Live GER40 trading journal. Real trades, real data, real accountability.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlowEffect />
        {children}
      </body>
    </html>
  );
}
