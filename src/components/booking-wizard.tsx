"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, fullNameCar } from "@/lib/utils";

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
};

type CategoryItem = {
  id: string;
  name: string;
  description: string | null;
  services: ServiceItem[];
};

type CarItem = {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
};

type SlotItem = {
  time: string;
  availableEmployees: number;
  employeeIds: string[];
};

type Props = {
  categories: CategoryItem[];
  cars: CarItem[];
  isClient: boolean;
  initialServiceId?: string | null;
};

export function BookingWizard({
  categories,
  cars,
  isClient,
  initialServiceId,
}: Props) {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialServiceId ? [initialServiceId] : [],
  );
  const [carId, setCarId] = useState(cars[0]?.id || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [comment, setComment] = useState("");
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const deferredServicesKey = useDeferredValue(selectedServices.join(","));
  const deferredDate = useDeferredValue(date);

  const selectedServiceObjects = useMemo(() => {
    const allServices = categories.flatMap((category) => category.services);
    return allServices.filter((service) => selectedServices.includes(service.id));
  }, [categories, selectedServices]);

  const summary = useMemo(
    () => ({
      totalPrice: selectedServiceObjects.reduce(
        (total, service) => total + service.price,
        0,
      ),
      totalDuration: selectedServiceObjects.reduce(
        (total, service) => total + service.durationMinutes,
        0,
      ),
    }),
    [selectedServiceObjects],
  );

  const nextStep =
    !selectedServices.length
      ? 1
      : !carId || !isClient
        ? 2
        : !date
          ? 3
          : !time
            ? 4
            : 5;

  useEffect(() => {
    if (!deferredServicesKey || !deferredDate) {
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setFeedback("");

      const response = await fetch(
        `/api/available-slots?date=${deferredDate}&serviceIds=${deferredServicesKey}`,
      );
      const data = await response.json();

      if (cancelled) return;

      if (!response.ok) {
        setFeedback(data.error || "Не удалось получить свободные слоты");
        setSlots([]);
      } else {
        setSlots(data.slots);
      }

      setLoadingSlots(false);
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [deferredDate, deferredServicesKey]);

  async function submitBooking() {
    if (!isClient) {
      window.location.href = "/auth";
      return;
    }

    setSaving(true);
    setFeedback("");

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        carId,
        serviceIds: selectedServices,
        date,
        time,
        comment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось создать запись");
      setSaving(false);
      return;
    }

    setSaving(false);
    setFeedback("Запись успешно создана. Она уже доступна в личном кабинете.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
      <section className="surface-card rounded-[32px] p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-4">
          {["Выбор услуг", "Автомобиль", "Дата", "Свободный слот"].map(
            (label, index) => {
              const step = index + 1;
              return (
                <div
                  key={label}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    nextStep === step
                      ? "border-[rgba(15,139,141,0.3)] bg-[rgba(15,139,141,0.1)] text-[var(--color-accent-strong)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-muted)]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[rgba(96,112,137,0.7)]">
                    Шаг {step}
                  </p>
                  <p className="mt-2 font-semibold">{label}</p>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-8 grid gap-8">
          <section className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-sm font-semibold uppercase tracking-[0.22em]">
                  1. Услуги
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-[var(--color-ink)]">
                  Соберите состав работ
                </h2>
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                Можно выбрать сразу несколько услуг
              </p>
            </div>

            <div className="grid gap-5">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-3xl border border-[var(--color-border)] p-5"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                      {category.name}
                    </h3>
                    {category.description ? (
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {category.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {category.services.map((service) => {
                      const active = selectedServices.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => {
                            setSelectedServices((current) => {
                              const next = current.includes(service.id)
                                ? current.filter((id) => id !== service.id)
                                : [...current, service.id];

                              setTime("");
                              if (!next.length) {
                                setSlots([]);
                              }

                              return next;
                            });
                          }}
                          className={`rounded-3xl border p-5 text-left transition ${
                            active
                              ? "border-[rgba(15,139,141,0.3)] bg-[rgba(15,139,141,0.1)] shadow-[0_14px_30px_rgba(15,139,141,0.12)]"
                              : "border-[var(--color-border)] bg-[var(--color-surface-soft)] hover:border-[rgba(25,49,74,0.18)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-[var(--color-ink)]">
                              {service.name}
                            </h4>
                            <span
                              className={`mt-1 h-4 w-4 rounded-full border ${
                                active
                                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                  : "border-[rgba(25,49,74,0.2)]"
                              }`}
                            />
                          </div>
                          <p className="mt-3 text-sm text-[var(--color-muted)]">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[var(--color-ink)]">
                            <span>{formatCurrency(service.price)}</span>
                            <span>{service.durationMinutes} мин</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-[var(--color-border)] p-5">
              <p className="eyebrow text-sm font-semibold uppercase tracking-[0.22em]">
                2. Автомобиль
              </p>
              <div className="mt-4 grid gap-3">
                {isClient ? (
                  cars.length ? (
                    <select
                      value={carId}
                      onChange={(event) => setCarId(event.target.value)}
                      className="theme-input rounded-2xl px-4 py-3 outline-none transition"
                    >
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {fullNameCar(car)} - {car.licensePlate}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-2xl border border-[rgba(193,133,96,0.28)] bg-[rgba(193,133,96,0.12)] px-4 py-4 text-sm text-[var(--color-ink)]">
                      Сначала добавьте автомобиль в{" "}
                      <Link href="/dashboard" className="font-semibold underline">
                        личном кабинете
                      </Link>
                      .
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-4 text-sm text-[var(--color-muted)]">
                    Для завершения записи нужно{" "}
                    <Link href="/auth" className="font-semibold underline">
                      войти или зарегистрироваться
                    </Link>
                    .
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] p-5">
              <p className="eyebrow text-sm font-semibold uppercase tracking-[0.22em]">
                3. Дата
              </p>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                  if (!event.target.value) {
                    setSlots([]);
                  }
                }}
                className="theme-input mt-4 w-full rounded-2xl px-4 py-3 outline-none transition"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--color-border)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-sm font-semibold uppercase tracking-[0.22em]">
                  4. Слот
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  Выберите подходящее время
                </h3>
              </div>
              {loadingSlots ? (
                <span className="text-sm text-[var(--color-muted)]">
                  Считаем доступность...
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setTime(slot.time)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    time === slot.time
                      ? "border-[rgba(15,139,141,0.3)] bg-[rgba(15,139,141,0.1)] text-[var(--color-accent-strong)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-ink)] hover:border-[rgba(25,49,74,0.18)]"
                  }`}
                >
                  {slot.time}
                  <span className="ml-2 text-xs font-medium text-[var(--color-muted)]">
                    {slot.availableEmployees} маст.
                  </span>
                </button>
              ))}
            </div>

            {!slots.length && deferredServicesKey && deferredDate && !loadingSlots ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                На выбранную дату нет свободных окон под этот набор услуг.
              </p>
            ) : null}

            <label className="mt-6 grid gap-2 text-sm text-[var(--color-ink)]">
              Комментарий к записи
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="theme-input rounded-2xl px-4 py-3 outline-none transition"
                placeholder="Например: шум при торможении, ошибка на панели, просьба проверить масло"
              />
            </label>
          </section>
        </div>
      </section>

      <aside className="dark-card h-fit rounded-[32px] border border-white/10 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#a7efe5]">
          Резюме записи
        </p>
        <div className="mt-6 space-y-4">
          {selectedServiceObjects.length ? (
            selectedServiceObjects.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{service.name}</p>
                  <span className="text-sm text-[rgba(244,250,255,0.72)]">
                    {service.durationMinutes} мин
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#b9f3eb]">
                  {formatCurrency(service.price)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[rgba(244,250,255,0.72)]">
              Выберите хотя бы одну услугу, чтобы рассчитать длительность и цену.
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[rgba(244,250,255,0.72)]">Длительность</span>
            <span className="font-semibold">{summary.totalDuration} мин</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[rgba(244,250,255,0.72)]">Стоимость</span>
            <span className="font-semibold">{formatCurrency(summary.totalPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[rgba(244,250,255,0.72)]">Дата и время</span>
            <span className="font-semibold">
              {date && time ? `${date}, ${time}` : "Не выбрано"}
            </span>
          </div>
        </div>

        {feedback ? (
          <div className="mt-6 rounded-2xl border border-[rgba(167,239,229,0.22)] bg-[rgba(167,239,229,0.08)] px-4 py-3 text-sm text-[#c7fff6]">
            {feedback}
          </div>
        ) : null}

        <button
          type="button"
          onClick={submitBooking}
          disabled={
            saving ||
            !selectedServices.length ||
            !date ||
            !time ||
            !carId ||
            (isClient && !cars.length)
          }
          className="accent-button mt-6 w-full rounded-2xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Создаем запись..."
            : isClient
              ? "Подтвердить запись"
              : "Войти для завершения"}
        </button>
      </aside>
    </div>
  );
}
