import { HelloDemo } from "./hello-demo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">ABCanto</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Next.js frontend with a Hono API at <code>/api</code>.
      </p>
      <HelloDemo />
    </main>
  );
}
