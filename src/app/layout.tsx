import type { Metadata } from "next";
import Link from "next/link";
import { Exo_2, Manrope } from "next/font/google";
import "./globals.css";
import { APP_NAME, publicNavigation } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

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
    "AvtoSlot — русскоязычный MVP автосервиса с онлайн-записью, кабинетом клиента, панелью администратора и интерфейсом мастера.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="ru" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-slate-950 antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(248,113,113,0.18),_transparent_30%),linear-gradient(180deg,_#081223_0%,_rgba(8,18,35,0.96)_32%,_transparent_32%)]" />
          <header className="relative z-10">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-6 md:px-6">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-400 font-[family:var(--font-display)] text-lg font-bold text-slate-950 shadow-[0_18px_36px_rgba(56,189,248,0.35)]">
                  A
                </span>
                <div>
                  <p className="font-[family:var(--font-display)] text-2xl text-white">
                    {APP_NAME}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Smart Service Booking
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-6 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur md:flex">
                {publicNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-slate-200 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Link
                      href={roleHome(user.role)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                    >
                      {user.role === "ADMIN"
                        ? "Панель"
                        : user.role === "EMPLOYEE"
                          ? "Мои заказы"
                          : "Кабинет"}
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                  >
                    Войти
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="relative z-10">{children}</main>

          <footer className="relative z-10 mt-20 border-t border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-6">
              <div>
                <p className="font-[family:var(--font-display)] text-2xl text-slate-950">
                  {APP_NAME}
                </p>
                <p className="mt-3 max-w-xl text-sm text-slate-600">
                  MVP-платформа для автосервиса: онлайн-запись, личный кабинет,
                  аналитика для администратора и рабочее место мастера.
                </p>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 md:justify-items-end">
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
