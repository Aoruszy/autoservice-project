"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState, useTransition } from "react";
import { publicNavigation } from "@/lib/constants";

type MobilePublicNavProps = {
  accountHref?: string;
  accountLabel?: string;
  isAuthenticated: boolean;
};

export function MobilePublicNav({
  accountHref,
  accountLabel,
  isAuthenticated,
}: MobilePublicNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setIsOpen((current) => !current)}
        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-[rgba(15,29,46,0.72)] text-white shadow-[0_18px_36px_rgba(16,38,59,0.28)] ring-1 ring-white/10 backdrop-blur transition hover:border-white/30 hover:bg-[rgba(23,46,71,0.88)]"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,38,58,0.98)_0%,rgba(11,23,38,0.98)_100%)] p-3 shadow-[0_24px_60px_rgba(11,23,38,0.4)] backdrop-blur">
          <nav className="grid gap-2">
            {publicNavigation.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setIsOpen(false);
                    setError("");
                  }}
                  className={clsx(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "border-[#fff7ef] bg-[#fff7ef] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(255,247,239,0.14)]"
                      : "border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/8",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 border-t border-white/10 pt-3">
            {isAuthenticated && accountHref && accountLabel ? (
              <div className="grid gap-2">
                <Link
                  href={accountHref}
                  onClick={() => {
                    setIsOpen(false);
                    setError("");
                  }}
                  className="accent-button rounded-2xl px-4 py-3 text-center text-sm font-semibold transition"
                >
                  {accountLabel}
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      setError("");
                      const response = await fetch("/api/auth/logout", {
                        method: "POST",
                      });

                      if (!response.ok) {
                        setError("Не удалось завершить сессию");
                        return;
                      }

                      window.location.href = "/";
                    })
                  }
                  className="rounded-2xl border border-white/16 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/28 hover:bg-white/10 disabled:opacity-60"
                  disabled={isPending}
                >
                  {isPending ? "Выходим..." : "Выйти"}
                </button>
                {error ? <p className="px-1 text-xs text-rose-300">{error}</p> : null}
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => {
                  setIsOpen(false);
                  setError("");
                }}
                className="accent-button block rounded-2xl px-4 py-3 text-center text-sm font-semibold transition"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
