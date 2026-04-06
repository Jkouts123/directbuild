import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "directbuild | Vetted tradies, direct to your door",
  description:
    "Australia's private network of rigorously vetted tradies. Solar, HVAC, granny flats, landscaping and roofing — no marketplaces, no bidding wars.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable} antialiased`}>
      <body className="min-h-[100dvh] flex flex-col font-sans bg-black-deep text-white">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-light/50 bg-navy-deep py-10">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-text text-sm">
            <p>&copy; {new Date().getFullYear()} directbuild</p>
            <div className="flex gap-6 text-xs">
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
