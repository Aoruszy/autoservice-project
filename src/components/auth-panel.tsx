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
    () => (mode === "login" ? "Вход в личный кабинет" : "Регистрация клиента"),
    [mode],
  );

  async function readJsonSafely(response: Response) {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as { error?: string; user?: { role: Parameters<typeof roleHome>[0] } };
    } catch {
      return null;
    }
  }

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

      const data = await readJsonSafely(response);

      if (!response.ok) {
        setFeedback(data?.error || "Не удалось выполнить запрос");
        return;
      }

      if (!data?.user?.role) {
        setFeedback("Сервер вернул пустой ответ. Попробуйте еще раз.");
        return;
      }

      window.location.href = roleHome(data.user.role);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="dark-card rounded-[32px] border border-white/10 p-8">
        <div className="inline-flex rounded-full border border-[rgba(167,239,229,0.22)] bg-[rgba(167,239,229,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#a7efe5]">
          {mode === "login" ? "Быстрый вход" : "Новый аккаунт"}
        </div>
        <h1 className="mt-6 font-[family:var(--font-display)] text-4xl font-semibold leading-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(244,250,255,0.78)]">
          Записывайтесь онлайн, добавляйте автомобили, следите за статусом
          записи и храните историю обслуживания в одном кабинете.
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
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-[rgba(167,239,229,0.36)]"
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
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-[rgba(167,239,229,0.36)]"
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
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-[rgba(167,239,229,0.36)]"
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
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 outline-none transition focus:border-[rgba(167,239,229,0.36)]"
              placeholder="Минимум 6 символов"
            />
          </label>

          {feedback ? (
            <p className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {feedback}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="accent-button mt-2 rounded-2xl px-5 py-3 font-semibold transition disabled:opacity-70"
          >
            {isPending
              ? "Подождите..."
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>
      </section>

      <section className="surface-card rounded-[32px] p-8">
        <div className="grid gap-4">
          <div>
            <p className="eyebrow text-sm font-semibold uppercase tracking-[0.22em]">
              Личный кабинет
            </p>
            <h2 className="mt-3 font-[family:var(--font-display)] text-3xl text-[var(--color-ink)]">
              Все, что нужно клиенту, в одном месте
            </h2>
          </div>

          <div className="space-y-3 rounded-3xl bg-[var(--color-surface-soft)] p-5 text-sm leading-7 text-[var(--color-muted)]">
            <p>Запись на обслуживание без звонка и ожидания ответа.</p>
            <p>Хранение автомобилей и истории прошлых визитов.</p>
            <p>Статусы записи и вся информация о визите в одном кабинете.</p>
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
                  ? "dark-card border border-white/10"
                  : "secondary-button"
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
                  ? "dark-card border border-white/10"
                  : "secondary-button"
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
