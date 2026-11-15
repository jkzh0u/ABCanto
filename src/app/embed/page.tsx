import type { Metadata } from "next";
import { DataCredits } from "../_components/data-credits";
import { Seal } from "../_components/seal";
import { Search } from "../search";

export const metadata: Metadata = {
  title: "ABCanto",
  // Only meant to be seen inside an iframe on another site.
  robots: { index: false },
};

/**
 * A compact ABCanto to put on another site in an iframe:
 *
 *   <iframe src="https://<abcanto host>/embed" title="ABCanto" loading="lazy"
 *     style="width:100%;height:560px;border:0"></iframe>
 *
 * Add ?theme=light or ?theme=dark to match the host page; otherwise it follows the system.
 */
export default function Embed() {
  return (
    <main className="flex min-h-screen flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
      <header className="flex items-center gap-2.5">
        <Seal text="粵" size={26} rotate={-3} />
        <span className="text-lg font-bold tracking-tight text-ink">ABCanto</span>
        <span className="hidden text-sm text-ink-faint sm:inline">· find the Cantonese word</span>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="ml-auto text-sm font-medium text-ink-soft underline-offset-2 transition-colors hover:text-seal hover:underline"
        >
          Open full site ↗
        </a>
      </header>
      <Search autoFocus={false} limit={5} />
      <footer className="mt-auto pt-2 text-[11px] leading-relaxed text-ink-faint">
        <DataCredits />
      </footer>
    </main>
  );
}
