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
  const [summary, setSummary] = useState({ totalPrice: 0, totalDuration: 0 });
  const [feedback, setFeedback] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const deferredServicesKey = useDeferredValue(selectedServices.join(","));
  const deferredDate = useDeferredValue(date);

  const selectedServiceObjects = useMemo(() => {
    const allServices = categories.flatMap((category) => category.services);
    return allServices.filter((service) => selectedServices.includes(service.id));
  }, [categories, selectedServices]);

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
        setSummary({ totalPrice: 0, totalDuration: 0 });
      } else {
        setSlots(data.slots);
        setSummary({
          totalPrice: data.totalPrice,
          totalDuration: data.totalDuration,
        });
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
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="grid gap-5 md:grid-cols-4">
          {["Выбор услуг", "Автомобиль", "Дата", "Свободный слот"].map(
            (label, index) => {
              const step = index + 1;
              return (
                <div
                  key={label}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    nextStep === step
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
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
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  1. Услуги
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
                  Соберите состав работ
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Можно выбрать сразу несколько услуг
              </p>
            </div>

            <div className="grid gap-5">
              {categories.map((category) => (
                <div key={category.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {category.name}
                    </h3>
                    {category.description ? (
                      <p className="mt-1 text-sm text-slate-500">
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
                                setSummary({ totalPrice: 0, totalDuration: 0 });
                              }

                              return next;
                            });
                          }}
                          className={`rounded-3xl border p-5 text-left transition ${
                            active
                              ? "border-sky-300 bg-sky-50 shadow-[0_14px_30px_rgba(56,189,248,0.18)]"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-slate-950">{service.name}</h4>
                            <span
                              className={`mt-1 h-4 w-4 rounded-full border ${
                                active
                                  ? "border-sky-400 bg-sky-400"
                                  : "border-slate-300"
                              }`}
                            />
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-700">
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
            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                2. Автомобиль
              </p>
              <div className="mt-4 grid gap-3">
                {isClient ? (
                  cars.length ? (
                    <select
                      value={carId}
                      onChange={(event) => setCarId(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300"
                    >
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {fullNameCar(car)} - {car.licensePlate}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                      Сначала добавьте автомобиль в{" "}
                      <Link href="/dashboard" className="font-semibold underline">
                        личном кабинете
                      </Link>
                      .
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    Для завершения записи нужно{" "}
                    <Link href="/auth" className="font-semibold underline">
                      войти или зарегистрироваться
                    </Link>
                    .
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
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
                    setSummary({ totalPrice: 0, totalDuration: 0 });
                  }
                }}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  4. Слот
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  Выберите подходящее время
                </h3>
              </div>
              {loadingSlots ? (
                <span className="text-sm text-slate-500">Считаем доступность...</span>
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
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {slot.time}
                  <span className="ml-2 text-xs font-medium text-slate-500">
                    {slot.availableEmployees} маст.
                  </span>
                </button>
              ))}
            </div>

            {!slots.length && deferredServicesKey && deferredDate && !loadingSlots ? (
              <p className="mt-4 text-sm text-slate-500">
                На выбранную дату нет свободных окон под этот набор услуг.
              </p>
            ) : null}

            <label className="mt-6 grid gap-2 text-sm text-slate-700">
              Комментарий к записи
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-300"
                placeholder="Например: шум при торможении, ошибка на панели, просьба проверить масло"
              />
            </label>
          </section>
        </div>
      </section>

      <aside className="h-fit rounded-[32px] border border-white/10 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">
          Резюме записи
        </p>
        <div className="mt-6 space-y-4">
          {selectedServiceObjects.length ? (
            selectedServiceObjects.map((service) => (
              <div key={service.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{service.name}</p>
                  <span className="text-sm text-slate-300">
                    {service.durationMinutes} мин
                  </span>
                </div>
                <p className="mt-2 text-sm text-sky-100">
                  {formatCurrency(service.price)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">
              Выберите хотя бы одну услугу, чтобы рассчитать длительность и цену.
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Длительность</span>
            <span className="font-semibold">{summary.totalDuration} мин</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Стоимость</span>
            <span className="font-semibold">{formatCurrency(summary.totalPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Дата и время</span>
            <span className="font-semibold">
              {date && time ? `${date}, ${time}` : "Не выбрано"}
            </span>
          </div>
        </div>

        {feedback ? (
          <div className="mt-6 rounded-2xl border border-sky-400/25 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
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
          className="mt-6 w-full rounded-2xl bg-sky-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
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
