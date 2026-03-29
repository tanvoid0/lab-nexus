import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "@/components/providers/app-providers";
import { ResponsiveToaster } from "@/components/providers/responsive-toaster";
import { NEXT_THEMES_INIT_SCRIPT } from "@/lib/settings/theme-init";
import "@/lib/fontawesome";
import "@fortawesome/fontawesome-svg-core/styles.css";
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
  title: "Lab Nexus — Vehicle Computing Lab",
  description: "Laboratory inventory and equipment checkout",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <Script
          id="next-themes-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: NEXT_THEMES_INIT_SCRIPT }}
        />
        <AppProviders>
          {children}
          <ResponsiveToaster />
        </AppProviders>
      </body>
    </html>
  );
}
