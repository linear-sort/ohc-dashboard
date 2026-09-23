import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OHC Dashboard",
  description: "Lightweight OnlineHashCrack Private API dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${ibmMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
