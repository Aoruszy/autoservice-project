"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { publicNavigation } from "@/lib/constants";

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-2 rounded-full border border-white/15 bg-[rgba(15,29,46,0.72)] p-2 shadow-[0_18px_40px_rgba(16,38,59,0.28)] ring-1 ring-white/10 backdrop-blur md:flex">
      {publicNavigation.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "border-[#fff7ef] bg-[#fff7ef] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(255,247,239,0.22)]"
                : "border-white/25 bg-white/92 text-[var(--color-ink)] hover:border-white hover:bg-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
