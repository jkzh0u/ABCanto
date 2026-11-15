import Link from "next/link";
import { Seal } from "./seal";
import { ThemeToggle } from "./theme-toggle";

export function Nav() {
  return (
    <header className="px-5 pt-5 sm:px-10 sm:pt-7">
      <nav className="flex items-center gap-3">
        <Link href="/" className="mr-auto flex items-center gap-2.5" aria-label="ABCanto home">
          <Seal text="粵" size={30} rotate={-3} />
          <span className="text-xl font-bold tracking-tight text-ink">ABCanto</span>
        </Link>
        <Link
          href="/about"
          className="rounded px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-seal"
        >
          About
        </Link>
        <ThemeToggle />
      </nav>
      <hr className="double-rule mt-4" />
    </header>
  );
}
