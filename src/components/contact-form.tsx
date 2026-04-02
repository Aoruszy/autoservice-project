"use client";

import { type FormEvent, useEffect, useState } from "react";

type FormState = {
  name: string;
  contact: string;
  message: string;
  honeypot: string;
};

const initialState: FormState = {
  name: "",
  contact: "",
  message: "",
  honeypot: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submittedAt, setSubmittedAt] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setSubmittedAt(Date.now());
  }, []);

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sourcePage: "/contacts",
          submittedAt,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error || "Не удалось отправить сообщение");
        return;
      }

      setSuccess(payload?.message || "Спасибо! Мы свяжемся с вами в рабочее время.");
      setForm(initialState);
      setSubmittedAt(Date.now());
    } catch {
      setError("Не удалось отправить сообщение. Попробуйте еще раз чуть позже.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
      <input
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
        className="theme-input rounded-2xl px-4 py-3 outline-none"
        placeholder="Ваше имя"
        autoComplete="name"
      />
      <input
        value={form.contact}
        onChange={(event) => updateField("contact", event.target.value)}
        className="theme-input rounded-2xl px-4 py-3 outline-none"
        placeholder="Телефон или email"
        autoComplete="email"
      />
      <textarea
        value={form.message}
        onChange={(event) => updateField("message", event.target.value)}
        rows={5}
        className="theme-input rounded-2xl px-4 py-3 outline-none"
        placeholder="Напишите, чем можем помочь"
      />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company-name">Не заполняйте это поле</label>
        <input
          id="company-name"
          tabIndex={-1}
          autoComplete="off"
          value={form.honeypot}
          onChange={(event) => updateField("honeypot", event.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm font-medium text-emerald-700">{success}</p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="accent-button rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Отправляем..." : "Отправить"}
      </button>
    </form>
  );
}
