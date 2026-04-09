import type { Metadata } from "next";
import Link from "next/link";
import { Exo_2, Manrope } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { PublicNav } from "@/components/public-nav";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { MobilePublicNav } from "@/components/mobile-public-nav";

const displayFont = Exo_2({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | РћРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ РІ Р°РІС‚РѕСЃРµСЂРІРёСЃ`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "РћРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ РІ Р°РІС‚РѕСЃРµСЂРІРёСЃ, РєР°С‚Р°Р»РѕРі СѓСЃР»СѓРі, РёСЃС‚РѕСЂРёСЏ РѕР±СЃР»СѓР¶РёРІР°РЅРёСЏ Р°РІС‚РѕРјРѕР±РёР»СЏ Рё СѓРґРѕР±РЅС‹Р№ Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚ РєР»РёРµРЅС‚Р°.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const accountLabel = user
    ? user.role === "ADMIN"
      ? "РџР°РЅРµР»СЊ"
      : user.role === "EMPLOYEE"
        ? "Р—Р°РєР°Р·С‹"
        : "РљР°Р±РёРЅРµС‚"
    : undefined;

  return (
    <html lang="ru" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] antialiased">
        <AnalyticsTracker />
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[190px] bg-[radial-gradient(circle_at_top_left,_rgba(31,157,141,0.24),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(205,145,112,0.16),_transparent_26%),linear-gradient(180deg,_#13263b_0%,_#1b3550_68%,_transparent_100%)] md:h-[240px]" />

          <header className="relative z-40">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-6">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#34c3b0] font-[family:var(--font-display)] text-lg font-bold text-slate-950 shadow-[0_18px_36px_rgba(52,195,176,0.28)]">
                  A
                </span>
                <div className="min-w-0">
                  <p className="truncate font-[family:var(--font-display)] text-[1.95rem] leading-none text-white md:text-2xl">
                    {APP_NAME}
                  </p>
                  <p className="mt-1 truncate text-[0.7rem] uppercase tracking-[0.22em] text-slate-300 md:text-xs md:tracking-[0.24em]">
                    РђРІС‚РѕСЃРµСЂРІРёСЃ РѕРЅР»Р°Р№РЅ
                  </p>
                </div>
              </Link>

              <PublicNav />

              <div className="flex shrink-0 items-center gap-3">
                <MobilePublicNav
                  isAuthenticated={Boolean(user)}
                  accountHref={user ? roleHome(user.role) : undefined}
                  accountLabel={accountLabel}
                />
                {user ? (
                  <div className="hidden items-center gap-3 md:flex">
                    <Link
                      href={roleHome(user.role)}
                      className="rounded-full bg-[#fff7ef] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
                    >
                      {accountLabel}
                    </Link>
                    <LogoutButton />
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="accent-button hidden rounded-full px-5 py-3 text-sm font-semibold transition md:inline-flex"
                  >
                    Р’РѕР№С‚Рё
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="relative z-10 flex-1">{children}</main>

          <footer className="relative z-10 mt-auto border-t border-[rgba(25,49,74,0.1)] bg-[rgba(255,250,244,0.9)] backdrop-blur">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-6">
              <div>
                <p className="font-[family:var(--font-display)] text-2xl text-[var(--color-ink)]">
                  {APP_NAME}
                </p>
                <p className="mt-3 max-w-xl text-sm text-[var(--color-muted)]">
                  Р—Р°РїРёСЃС‹РІР°Р№С‚РµСЃСЊ РѕРЅР»Р°Р№РЅ, РІС‹Р±РёСЂР°Р№С‚Рµ СѓРґРѕР±РЅРѕРµ РІСЂРµРјСЏ Рё СЃР»РµРґРёС‚Рµ Р·Р°
                  РёСЃС‚РѕСЂРёРµР№ РѕР±СЃР»СѓР¶РёРІР°РЅРёСЏ Р°РІС‚РѕРјРѕР±РёР»СЏ РІ РѕРґРЅРѕРј РєР°Р±РёРЅРµС‚Рµ.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[var(--color-muted)] md:justify-items-end">
                <p>РљР°Р»РёРЅРёРЅРіСЂР°Рґ, РњРѕСЃРєРѕРІСЃРєРёР№ РїСЂРѕСЃРїРµРєС‚, 184</p>
                <p>+7 (4012) 99-45-45</p>
                <p>service@avtoslot.ru</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

