import type { Metadata } from "next";
import { LXGW_WenKai_TC, Liu_Jian_Mao_Cao, Noto_Serif_HK } from "next/font/google";
import "./globals.css";
import "./transitions.css";
import { Nav } from "./_components/nav";
import { Seal } from "./_components/seal";
import { THEME_KEY } from "./_components/theme";
import { Verse } from "./_components/verse";

// Classical Ming-style serif with full traditional Chinese coverage.
// Chinese glyphs load on demand in small unicode-range slices.
const notoSerifHK = Noto_Serif_HK({
  variable: "--font-noto-serif-hk",
  subsets: ["latin"],
  weight: "variable",
});

// Brush-style regular script (楷書) for the red annotations.
const wenKai = LXGW_WenKai_TC({
  variable: "--font-lxgw-wenkai-tc",
  subsets: ["latin"],
  weight: "700",
  preload: false,
});

// Wild cursive script (草書) for the calligraphy written across the page.
const maoCao = Liu_Jian_Mao_Cao({
  variable: "--font-liu-jian-mao-cao",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

export const metadata: Metadata = {
  title: "ABCanto",
  description: "Find the Cantonese word from what it means or how it sounds.",
};

// Pick the theme before first paint so it doesn't flash: a saved choice wins,
// otherwise follow the system setting (and keep following it if it changes).
const themeScript = `(function(){var d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)");function saved(){try{var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});return s==="dark"||s==="light"?s:null}catch(e){return null}}function apply(){d.dataset.theme=saved()||(m.matches?"dark":"light")}apply();m.addEventListener("change",apply)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${notoSerifHK.variable} ${wenKai.variable} ${maoCao.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <div className="relative flex min-h-screen flex-col overflow-x-clip">
          <Verse />
          {/* Collectors' seals stamped over the paper, like those on old scrolls. */}
          <div className="collector-seal" style={{ top: "38%", left: "3%" }}>
            <Seal text="搵字" shape="tall" size={64} rotate={-2} className="opacity-70" />
          </div>
          {/* 飲水思源: "when drinking water, remember its source" (remember your roots). */}
          <div className="collector-seal" style={{ top: 96, right: "4%" }}>
            <Seal text="飲水思源" size={54} rotate={3} />
          </div>
          {/* 學無止境: "learning has no end". */}
          <div className="collector-seal" style={{ bottom: 70, left: "6%" }}>
            <Seal text="學無止境" variant="relief" size={48} rotate={-4} />
          </div>

          <div className="page-content mx-auto flex w-full max-w-3xl flex-1 flex-col">
            <Nav />
            {children}
            <footer className="mt-auto px-5 pb-8 pt-12 text-xs leading-relaxed text-ink-faint sm:px-10">
              <hr className="double-rule mb-4" />
              Dictionary data from{" "}
              <a
                className="underline underline-offset-2 hover:text-seal"
                href="https://cantonese.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                CC-Canto
              </a>{" "}
              and{" "}
              <a
                className="underline underline-offset-2 hover:text-seal"
                href="https://cc-cedict.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                CC-CEDICT
              </a>{" "}
              (CC BY-SA 3.0); word frequencies from HKCanCor (CC BY 4.0).
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
