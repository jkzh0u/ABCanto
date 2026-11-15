import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-2xl items-center px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ABCanto
        </Link>
      </nav>
    </header>
  );
}
