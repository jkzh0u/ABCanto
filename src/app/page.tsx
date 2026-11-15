import { Search } from "./search";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Find the Cantonese word</h1>
        <p className="text-zinc-600 dark:text-zinc-400">From how it sounds, what it means, or what it literally means.</p>
      </header>
      <Search />
    </main>
  );
}
