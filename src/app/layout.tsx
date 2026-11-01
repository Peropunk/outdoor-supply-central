import type { Metadata, Viewport } from "next";
import { Inter, Jost } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Outdoor Supply Central · Buy and sell used outdoor gear",
    template: "%s · Outdoor Supply Central",
  },
  description:
    "Camping, hiking, fishing and survival gear from fellow outdoor people. Give your gear a second life. #GetOutMore",
};

export const viewport: Viewport = {
  themeColor: "#2e5a1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${inter.variable} antialiased`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only z-50 bg-paper px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
