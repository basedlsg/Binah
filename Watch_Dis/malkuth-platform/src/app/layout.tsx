import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/styles/globals.css";
import NewHeader from "@/components/layout/NewHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MALKUTH",
  description: "Malkuth Platform - Foundation of Digital Reality",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-background text-foreground min-h-screen-dvh`}
      >
        <NewHeader />
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
