"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function HelloDemo() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function sayHello() {
    const res = await api.api.hello.$get({ query: { name: name || "world" } });
    if (res.ok) {
      const data = await res.json();
      setMessage(data.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="rounded-md bg-foreground px-4 py-2 text-background"
          onClick={sayHello}
        >
          Say hello
        </button>
      </div>
      {message && <p className="font-medium">{message}</p>}
    </div>
  );
}
