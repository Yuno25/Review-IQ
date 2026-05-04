import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: { default: "ReviewIQ", template: "%s | ReviewIQ" },
  description: "AI-powered code review and PR assistant for engineering teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrains.variable} ${playfair.variable} font-mono bg-[#050505] text-[#E8FFE8] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
