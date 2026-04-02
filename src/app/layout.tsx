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
    default: `${APP_NAME} | Онлайн-запись в автосервис`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Онлайн-запись в автосервис, каталог услуг, история обслуживания автомобиля и удобный личный кабинет клиента.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="ru" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] antialiased">
        <AnalyticsTracker />
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(circle_at_top_left,_rgba(31,157,141,0.24),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(205,145,112,0.16),_transparent_26%),linear-gradient(180deg,_#13263b_0%,_#1b3550_68%,_transparent_100%)] md:h-[240px]" />

          <header className="relative z-10">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-6 md:px-6">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#34c3b0] font-[family:var(--font-display)] text-lg font-bold text-slate-950 shadow-[0_18px_36px_rgba(52,195,176,0.28)]">
                  A
                </span>
                <div>
                  <p className="font-[family:var(--font-display)] text-2xl text-white">
                    {APP_NAME}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                    Автосервис онлайн
                  </p>
                </div>
              </Link>

              <PublicNav />

              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Link
                      href={roleHome(user.role)}
                      className="rounded-full bg-[#fff7ef] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
                    >
                      {user.role === "ADMIN"
                        ? "Панель"
                        : user.role === "EMPLOYEE"
                          ? "Заказы"
                          : "Кабинет"}
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="accent-button rounded-full px-5 py-3 text-sm font-semibold transition"
                  >
                    Войти
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
                  Записывайтесь онлайн, выбирайте удобное время и следите за
                  историей обслуживания автомобиля в одном кабинете.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[var(--color-muted)] md:justify-items-end">
                <p>Калининград, Московский проспект, 184</p>
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
