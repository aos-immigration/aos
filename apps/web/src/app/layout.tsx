import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RuntimeConfigProvider } from "./lib/runtimeConfigContext";
import { convexUrl, isClerkConfigured } from "./lib/runtimeConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AOS: Self-help forms for marriage-based green cards",
  description:
    "Self-help software. Not a law firm. Not affiliated with USCIS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}
      >
        <RuntimeConfigProvider clerk={isClerkConfigured()} convex={Boolean(convexUrl())}>
          {isClerkConfigured() ? (
            <ClerkProvider appearance={{ theme: dark }}>
              <Providers convexUrl={convexUrl()}>{children}</Providers>
            </ClerkProvider>
          ) : (
            children
          )}
        </RuntimeConfigProvider>
      </body>
    </html>
  );
}
