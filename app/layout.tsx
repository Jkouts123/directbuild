import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "directbuild | Vetted Tradies Australia-wide",
  description:
    "Australia's premier vetted tradie network. Solar, HVAC, Granny Flats, Landscaping & Roofing. Private. Verified. Australia-wide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-light bg-black-deep py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-text text-sm">
            &copy; {new Date().getFullYear()} directbuild. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
