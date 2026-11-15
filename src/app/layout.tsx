import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "./_components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABCanto",
  description: "Find the Cantonese word from what it means or how it sounds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
        <footer className="mx-auto mt-auto w-full max-w-2xl px-4 pb-8 pt-12 text-xs text-zinc-400">
          Dictionary data from{" "}
          <a className="underline" href="https://cantonese.org" target="_blank" rel="noopener noreferrer">
            CC-Canto
          </a>{" "}
          and{" "}
          <a className="underline" href="https://cc-cedict.org" target="_blank" rel="noopener noreferrer">
            CC-CEDICT
          </a>{" "}
          (CC BY-SA 3.0); word frequencies from HKCanCor (CC BY 4.0).
        </footer>
      </body>
    </html>
  );
}
