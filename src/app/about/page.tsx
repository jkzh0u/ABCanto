import type { Metadata } from "next";
import Link from "next/link";
import { Seal } from "../_components/seal";

export const metadata: Metadata = {
  title: "About · ABCanto",
  description: "Why ABCanto exists, and who made it.",
};

const strong = "font-semibold text-ink";

export default function AboutPage() {
  return (
    <main className="flex w-full flex-col gap-10 px-5 py-8 sm:px-10 sm:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">About</h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          <span className={strong}>ABCanto</span> is a play on words: <span className={strong}>ABC</span>, for
          Asian-born Canadian, plus <span className={strong}>Canto</span>, for Cantonese.
        </p>
      </header>

      <section className="flex flex-col gap-4 leading-relaxed text-ink-soft">
        <h2 className="text-xl font-bold text-ink">Why I built this</h2>
        <p>
          I grew up as an ABC in a Cantonese-speaking household. My parents are immigrants who don&apos;t speak a word
          of English, so I&apos;ve been the family translator for as long as I can remember: letters, documents, forms,
          and the occasional text message that needs a second look.
        </p>
        <p>
          Like a lot of ABCs, I can speak and understand Cantonese fluently, but reading and writing it is another
          story. I&apos;ll know exactly how a word sounds, then get completely stuck the moment I try to text it to my
          parents. Other times I know what something <em>literally</em> means in English (飛機 is literally a
          &ldquo;flying machine&rdquo;) but not how to say or write it.
        </p>
        <p>
          Google Translate is great, but it&apos;s built for translating sentences, not for finding the word that&apos;s
          on the tip of your tongue. So I built the tool I wanted. You can search three ways:
        </p>
        <ul className="flex flex-col gap-2 pl-5 marker:text-ink-faint list-disc">
          <li>
            <span className={strong}>How it sounds</span>: type it the way you&apos;d spell it out, like <em>m goi</em>{" "}
            → <span lang="zh-HK">唔該</span>.
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

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-2 text-sm text-ink-faint">
        <hr className="double-rule mb-3 w-full" />
        {/* A name seal, the way artists sign a scroll: 周子冸印 ("seal of 周子冸"). */}
        <Seal text="周子冸印" size={52} rotate={-2} title="Seal of 周子冸" />
        <span>
          Made by <span className="font-semibold text-ink">Jackson Zhou</span>{" "}
          <span lang="zh-HK" className="text-ink-soft">
            周子冸
          </span>
        </span>
        <a
          href="https://jkzhou.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-seal"
        >
          jkzhou.ca
        </a>
        <Link
          href="/"
          className="t-learn ml-auto inline-flex items-center gap-0.5 font-semibold text-ink-soft hover:text-seal"
        >
          Try it
          <span className="t-learn-chevron" aria-hidden="true">
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path className="t-learn-arm t-learn-arm-top" d="M6 4L10 8" />
              <path className="t-learn-arm t-learn-arm-bot" d="M10 8L6 12" />
            </svg>
          </span>
        </Link>
      </footer>
    </main>
  );
}
