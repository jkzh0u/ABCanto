import { Seal } from "../_components/seal";
import { Search } from "../search";

export default function Home() {
  return (
    <main className="relative flex w-full flex-col gap-8 px-5 py-8 sm:px-10 sm:py-12">
      <header className="flex items-start gap-5">
        <div className="flex flex-1 flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Find the Cantonese word</h1>
          <p className="text-ink-soft">From how it sounds, what it means, or what it literally means.</p>
        </div>
        {/* A vertical inscription with a seal under it, like a scroll's colophon. */}
        <div className="hidden flex-col items-center gap-2 sm:flex" aria-hidden="true">
          <span lang="zh-HK" className="vertical text-lg font-semibold text-ink-soft">
            粵語搵字
          </span>
          <Seal text="粵語" variant="relief" size={34} rotate={2} />
        </div>
      </header>
      <Search />
    </main>
  );
}
