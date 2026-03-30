"use client";

import { useState, useTransition } from "react";

export function LogoutButton() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            setError("");
            const response = await fetch("/api/auth/logout", { method: "POST" });

            if (!response.ok) {
              setError("Не удалось завершить сессию");
              return;
            }

            window.location.href = "/";
          })
        }
        className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10 disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Выходим..." : "Выйти"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
