import type { Metadata } from "next";
import { LXGW_WenKai_TC, Liu_Jian_Mao_Cao, Noto_Serif_HK } from "next/font/google";
import "./globals.css";
import "./transitions.css";
import { THEME_KEY } from "./_components/theme";

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

// Pick the theme before first paint so it doesn't flash. A ?theme=light|dark in the URL
// wins (so an embed can match the site it sits on), then a saved choice, otherwise follow
// the system setting (and keep following it if it changes).
const themeScript = `(function(){var d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)"),p=new URLSearchParams(location.search).get("theme");if(p!=="dark"&&p!=="light")p=null;function saved(){try{var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});return s==="dark"||s==="light"?s:null}catch(e){return null}}function apply(){d.dataset.theme=p||saved()||(m.matches?"dark":"light")}apply();m.addEventListener("change",apply)})()`;

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
        {children}
      </body>
    </html>
  );
}
