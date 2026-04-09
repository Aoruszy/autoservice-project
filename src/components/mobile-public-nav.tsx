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

  const closeMenu = () => {
    setIsOpen(false);
    setError("");
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setIsOpen((current) => !current)}
        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/18 bg-[rgba(20,40,62,0.78)] text-white shadow-[0_18px_36px_rgba(16,38,59,0.28)] ring-1 ring-white/10 backdrop-blur transition hover:border-white/30 hover:bg-[rgba(27,52,79,0.92)]"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-[rgba(9,18,29,0.22)] backdrop-blur-[2px]"
          />

          <div className="fixed inset-x-4 top-[5.25rem] z-50 overflow-hidden rounded-[28px] border border-[rgba(17,32,51,0.08)] bg-[rgba(255,250,244,0.98)] p-3 shadow-[0_28px_80px_rgba(17,32,51,0.18)] backdrop-blur">
            <nav className="grid gap-2">
              {publicNavigation.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "border-[rgba(15,139,141,0.2)] bg-[rgba(15,139,141,0.1)] text-[var(--color-accent-strong)]"
                        : "border-[rgba(17,32,51,0.08)] bg-white text-[var(--color-ink)] hover:border-[rgba(15,139,141,0.18)] hover:bg-[rgba(15,139,141,0.05)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-[rgba(17,32,51,0.08)] pt-3">
              {isAuthenticated && accountHref && accountLabel ? (
                <div className="grid gap-2">
                  <Link
                    href={accountHref}
                    onClick={closeMenu}
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
                    className="rounded-2xl border border-[rgba(17,32,51,0.08)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[rgba(17,32,51,0.14)] hover:bg-[rgba(15,139,141,0.04)] disabled:opacity-60"
                    disabled={isPending}
                  >
                    {isPending ? "Выходим..." : "Выйти"}
                  </button>
                  {error ? <p className="px-1 text-xs text-rose-600">{error}</p> : null}
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={closeMenu}
                  className="accent-button block rounded-2xl px-4 py-3 text-center text-sm font-semibold transition"
                >
                  Войти
                </Link>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
