import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · ABCanto",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight">About</h1>
      <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
        <strong className="font-semibold text-zinc-950 dark:text-zinc-50">ABCanto</strong> is a play on words:{" "}
        <strong className="font-semibold text-zinc-950 dark:text-zinc-50">ABC</strong>, for Asian-born Canadian, plus{" "}
        <strong className="font-semibold text-zinc-950 dark:text-zinc-50">Canto</strong>, for Cantonese.
      </p>
    </main>
  );
}
