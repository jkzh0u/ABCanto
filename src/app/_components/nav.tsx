import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-2xl items-center px-4 py-3">
        <Link href="/" className="mr-auto text-lg font-semibold tracking-tight">
          ABCanto
        </Link>
        <Link
          href="/about"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          About
        </Link>
      </nav>
    </header>
  );
}
