import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About · ABCanto",
  description: "Why ABCanto exists, and who made it.",
};

const strong = "font-semibold text-zinc-950 dark:text-zinc-50";

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          <span className={strong}>ABCanto</span> is a play on words: <span className={strong}>ABC</span>, for
          Asian-born Canadian, plus <span className={strong}>Canto</span>, for Cantonese.
        </p>
      </header>

      <section className="flex flex-col gap-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Why I built this</h2>
        <p>
          I grew up as an ABC in a Cantonese-speaking household. My parents are immigrants who don&apos;t speak a word
          of English, so I&apos;ve been the family translator for as long as I can remember: letters, documents,
          forms, and the occasional text message that needs a second look.
        </p>
        <p>
          Like a lot of ABCs, I can speak and understand Cantonese fluently, but reading and writing it is another
          story. I&apos;ll know exactly how a word sounds, then get completely stuck the moment I try to text it to my
          parents. Other times I know what something <em>literally</em> means in English (飛機 is literally a
          &ldquo;flying machine&rdquo;) but not how to say or write it.
        </p>
        <p>
          Google Translate is great, but it&apos;s built for translating sentences, not for finding the word
          that&apos;s on the tip of your tongue. So I built the tool I wanted. You can search three ways:
        </p>
        <ul className="flex flex-col gap-2 pl-5 marker:text-zinc-400 list-disc">
          <li>
            <span className={strong}>How it sounds</span>: type it the way you&apos;d spell it out, like{" "}
            <em>m goi</em> → <span lang="zh-HK">唔該</span>.
          </li>
          <li>
            <span className={strong}>What it means</span>: search in plain English, like &ldquo;thank you&rdquo;.
          </li>
          <li>
            <span className={strong}>Literal translation</span>: describe it word by word, like &ldquo;flying
            machine&rdquo; → <span lang="zh-HK">飛機</span>.
          </li>
        </ul>
        <p>If you&apos;re an ABC (or anyone, really) in the same boat, I hope it helps you too.</p>
      </section>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>
          Made by <span className="font-medium text-zinc-900 dark:text-zinc-100">Jackson Zhou</span>{" "}
          <span lang="zh-HK" className="text-zinc-700 dark:text-zinc-300">
            周子冸
          </span>
        </span>
        <a
          href="https://jkzhou.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          jkzhou.ca
        </a>
        <Link href="/" className="ml-auto underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
          Try it →
        </Link>
      </footer>
    </main>
  );
}
