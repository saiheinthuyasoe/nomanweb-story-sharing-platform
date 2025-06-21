import type { Metadata } from "next";
import { Inter, Merriweather, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ToastProvider } from "@/components/providers/ToastProvider";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalMainContent from "@/components/layout/ConditionalMainContent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "NoManWeb - Story Sharing Platform",
  description: "Share and discover amazing stories with our community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} ${openSans.variable} font-sans antialiased`}>
        <Providers>
          <ConditionalNavbar />
          <ConditionalMainContent>
            {children}
          </ConditionalMainContent>
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
