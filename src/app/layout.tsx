import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { RegisterSW } from "../components/RegisterSW";

const inter = localFont({ src: "../../public/fonts/Inter-Regular.woff2" });

export const metadata: Metadata = {
  title: "SmritiSetu",
  description: "AI-Based Cognitive Engagement Platform for the North Eastern Region",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmritiSetu",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <OfflineIndicator />
        <RegisterSW />
      </body>
    </html>
  );
}
