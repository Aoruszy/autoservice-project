"use client";

import { useMemo, useState, useTransition } from "react";
import { roleHome } from "@/lib/utils";

type Mode = "login" | "register";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const title = useMemo(
    () =>
      mode === "login"
        ? "Вход в личный кабинет"
        : "Регистрация клиента",
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback("");

      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : form;

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.error || "Не удалось выполнить запрос");
        return;
      }

      window.location.href = roleHome(data.user.role);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[32px] border border-white/10 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <div className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
          {mode === "login" ? "Быстрый вход" : "Новый аккаунт"}
        </div>
        <h1 className="mt-6 font-[family:var(--font-display)] text-4xl font-semibold leading-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-slate-300">
          После входа клиент получает доступ к автомобилям, статусам заявок и
          онлайн-записи, а администратор и мастер автоматически попадут в свои
          рабочие панели.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          {mode === "register" ? (
            <label className="grid gap-2 text-sm">
              Имя
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-sky-300"
                placeholder="Например, Илья Петров"
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-sky-300"
              placeholder="you@example.com"
            />
          </label>

          {mode === "register" ? (
            <label className="grid gap-2 text-sm">
              Телефон
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-sky-300"
                placeholder="+7 (900) 123-45-67"
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm">
            Пароль
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-sky-300"
              placeholder="Минимум 6 символов"
            />
          </label>

          {feedback ? (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {feedback}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-2xl bg-sky-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-70"
          >
            {isPending
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Демо-доступ
            </p>
            <h2 className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
              Можно тестировать сразу после запуска
            </h2>
          </div>

          <div className="space-y-3 rounded-3xl bg-slate-100 p-5 text-sm text-slate-700">
            <p>`admin@avtoslot.ru` / `Demo12345!`</p>
            <p>`client@avtoslot.ru` / `Demo12345!`</p>
            <p>`master1@avtoslot.ru` / `Demo12345!`</p>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFeedback("");
              }}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              Уже есть аккаунт
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setFeedback("");
              }}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              Я новый клиент
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
