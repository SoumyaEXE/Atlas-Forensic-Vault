import type { Metadata } from "next";
import { Special_Elite, JetBrains_Mono, VT323, Courier_Prime } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/components/layout/AudioProvider";

const specialElite = Special_Elite({
  weight: "400",
  variable: "--font-special-elite",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  weight: "400",
  variable: "--font-courier-prime",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Detective Mongo D. Bane - Repo-to-Podcast",
  description: "Transform any GitHub repository into a True Crime-style audio investigation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${specialElite.variable} ${jetbrainsMono.variable} ${vt323.variable} ${courierPrime.variable} antialiased bg-[#050505] text-[#e7e5e4]`}
        suppressHydrationWarning
      >
        {/* Global Film Grain Overlay */}
        <div className="fixed inset-0 pointer-events-none z-9999 opacity-[0.05] mix-blend-overlay bg-[url('/grain.gif')]"></div>
        
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
