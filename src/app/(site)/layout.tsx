import { DataCredits } from "../_components/data-credits";
import { Nav } from "../_components/nav";
import { Seal } from "../_components/seal";
import { Verse } from "../_components/verse";

/** The full site: the paper with calligraphy and collectors' seals, the nav, and the credits. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
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
          <DataCredits />
        </footer>
      </div>
    </div>
  );
}
