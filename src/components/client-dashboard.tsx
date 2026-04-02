"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";
import { engineTypeOptions, translateNotificationText } from "@/lib/constants";
import { formatCurrency, formatDate, fullNameCar } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type CarItem = {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  engineType: string;
};

type BookingItem = {
  id: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  totalPrice: number;
  totalDuration: number;
  status: BookingStatus;
  comment: string | null;
  car: CarItem;
  employee: { name: string } | null;
  review: {
    rating: number;
    comment: string | null;
    createdAt: string | Date;
  } | null;
  bookingServices: Array<{
    id: string;
    service: { name: string };
  }>;
};

type NotificationItem = {
  id: string;
  type: string;
  text: string;
  createdAt: string | Date;
};

type UserItem = {
  name: string;
  email: string;
  phone: string;
  createdAt: string | Date;
};

type CarFormState = {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  engineType: string;
};

type Props = {
  user: UserItem;
  cars: CarItem[];
  bookings: BookingItem[];
  notifications: NotificationItem[];
};

const emptyCar: CarFormState = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  licensePlate: "",
  vin: "",
  engineType: engineTypeOptions[0],
};

export function ClientDashboard({ user, cars, bookings, notifications }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });
  const [carForm, setCarForm] = useState(emptyCar);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { rating: number; comment: string }>
  >({});
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const upcoming = bookings.filter((booking) =>
    ["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"].includes(booking.status),
  );
  const history = bookings.filter(
    (booking) =>
      !["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"].includes(booking.status),
  );
  const completedHistory = history.filter((booking) => booking.status === "COMPLETED");

  function refreshWithMessage(message: string) {
    setFeedback(message);
    startTransition(() => {
      router.refresh();
    });
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error || "Не удалось обновить профиль");
      return;
    }

    refreshWithMessage("Профиль обновлен.");
  }

  async function saveCar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(
      editingCarId ? `/api/cars/${editingCarId}` : "/api/cars",
      {
        method: editingCarId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carForm),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error || "Не удалось сохранить автомобиль");
      return;
    }

    setCarForm(emptyCar);
    setEditingCarId(null);
    refreshWithMessage(editingCarId ? "Автомобиль обновлен." : "Автомобиль добавлен.");
  }

  async function removeCar(id: string) {
    const response = await fetch(`/api/cars/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось удалить автомобиль");
      return;
    }

    refreshWithMessage("Автомобиль удален.");
  }

  async function cancelBooking(id: string) {
    const response = await fetch(`/api/bookings/${id}/cancel`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось отменить запись");
      return;
    }

    refreshWithMessage("Запись отменена.");
  }

  async function submitReview(bookingId: string) {
    const draft = reviewDrafts[bookingId] || { rating: 5, comment: "" };
    const response = await fetch(`/api/bookings/${bookingId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setFeedback(data?.error || "Не удалось отправить отзыв");
      return;
    }

    setReviewDrafts((current) => {
      const next = { ...current };
      delete next[bookingId];
      return next;
    });
    refreshWithMessage("Спасибо, отзыв сохранен.");
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Аккаунт</p>
          <p className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
            {user.name}
          </p>
          <p className="mt-2 text-sm text-slate-500">С нами с {formatDate(user.createdAt)}</p>
        </div>
        <div className="surface-card rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Автомобили</p>
          <p className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
            {cars.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Все машины доступны в форме онлайн-записи
          </p>
        </div>
        <div className="surface-card rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
            Активные заявки
          </p>
          <p className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
            {upcoming.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Следите за статусом без звонка администратору
          </p>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-[rgba(15,139,141,0.22)] bg-[rgba(15,139,141,0.1)] px-4 py-3 text-sm text-[var(--color-accent-strong)]">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="grid gap-8">
          <form
            onSubmit={saveProfile}
            className="surface-card rounded-[32px] p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Профиль
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
                  Личные данные
                </h2>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="accent-button rounded-2xl px-4 py-3 text-sm font-semibold transition"
              >
                Сохранить
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <input
                value={profile.name}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, name: event.target.value }))
                }
                className="theme-input rounded-2xl px-4 py-3 outline-none"
                placeholder="Имя"
              />
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, email: event.target.value }))
                }
                className="theme-input rounded-2xl px-4 py-3 outline-none"
                placeholder="Email"
              />
              <input
                value={profile.phone}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, phone: event.target.value }))
                }
                className="theme-input rounded-2xl px-4 py-3 outline-none"
                placeholder="Телефон"
              />
            </div>
          </form>

          <section className="surface-card rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Автомобили
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
                  Мой гараж
                </h2>
              </div>
            </div>

            <form onSubmit={saveCar} className="mt-6 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={carForm.brand}
                  onChange={(event) =>
                    setCarForm((current) => ({ ...current, brand: event.target.value }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Марка"
                />
                <input
                  value={carForm.model}
                  onChange={(event) =>
                    setCarForm((current) => ({ ...current, model: event.target.value }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Модель"
                />
                <input
                  type="number"
                  value={carForm.year}
                  onChange={(event) =>
                    setCarForm((current) => ({
                      ...current,
                      year: Number(event.target.value),
                    }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Год"
                />
                <input
                  value={carForm.licensePlate}
                  onChange={(event) =>
                    setCarForm((current) => ({
                      ...current,
                      licensePlate: event.target.value,
                    }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Госномер"
                />
                <select
                  value={carForm.engineType}
                  onChange={(event) =>
                    setCarForm((current) => ({
                      ...current,
                      engineType: event.target.value,
                    }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                >
                  {engineTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {!engineTypeOptions.includes(
                    carForm.engineType as (typeof engineTypeOptions)[number],
                  ) ? (
                    <option value={carForm.engineType}>{carForm.engineType}</option>
                  ) : null}
                </select>
                <input
                  value={carForm.vin}
                  onChange={(event) =>
                    setCarForm((current) => ({ ...current, vin: event.target.value }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="VIN"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="accent-button rounded-2xl px-4 py-3 text-sm font-semibold transition"
                >
                  {editingCarId ? "Сохранить изменения" : "Добавить автомобиль"}
                </button>
                {editingCarId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCarId(null);
                      setCarForm(emptyCar);
                    }}
                    className="secondary-button rounded-2xl px-4 py-3 text-sm font-semibold transition"
                  >
                    Отмена
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 grid gap-3">
              {cars.map((car) => (
                <div key={car.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{fullNameCar(car)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {car.licensePlate} • {car.engineType}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCarId(car.id);
                          setCarForm({
                            brand: car.brand,
                            model: car.model,
                            year: car.year,
                            licensePlate: car.licensePlate,
                            vin: car.vin || "",
                            engineType: car.engineType,
                          });
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCar(car.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      История обслуживания
                    </p>
                    <div className="mt-4 grid gap-3">
                      {completedHistory.filter((booking) => booking.car.id === car.id).length ? (
                        completedHistory
                          .filter((booking) => booking.car.id === car.id)
                          .map((booking) => (
                            <div
                              key={booking.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {formatDate(booking.bookingDate)} • {booking.startTime}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    {booking.bookingServices
                                      .map((item) => item.service.name)
                                      .join(", ")}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    Мастер: {booking.employee?.name || "не указан"}
                                  </p>
                                </div>
                                <p className="font-semibold text-slate-900">
                                  {formatCurrency(booking.totalPrice)}
                                </p>
                              </div>
                              {booking.comment ? (
                                <p className="mt-3 text-sm text-slate-600">{booking.comment}</p>
                              ) : null}
                              {booking.review ? (
                                <div className="mt-3 rounded-2xl bg-[rgba(31,157,141,0.08)] px-4 py-3 text-sm text-slate-700">
                                  <p className="font-semibold text-slate-900">
                                    Отзыв: {booking.review.rating}/5
                                  </p>
                                  <p className="mt-1">
                                    {booking.review.comment || "Клиент оставил оценку без текста."}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          По этой машине еще нет завершенных обслуживаний.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-8">
          <div className="surface-card rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Записи</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
              Предстоящие визиты
            </h2>

            <div className="mt-6 grid gap-4">
              {upcoming.length ? (
                upcoming.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-semibold text-slate-950">
                            {formatDate(booking.bookingDate)} • {booking.startTime} - {booking.endTime}
                          </p>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {booking.bookingServices.map((item) => item.service.name).join(", ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {fullNameCar(booking.car)} • мастер: {booking.employee?.name || "назначается"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-950">
                          {formatCurrency(booking.totalPrice)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{booking.totalDuration} мин</p>
                      </div>
                    </div>
                    {["NEW", "CONFIRMED", "RESCHEDULED"].includes(booking.status) ? (
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                      >
                        Отменить запись
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Пока нет предстоящих записей. Можно оформить новую запись через форму на сайте.
                </p>
              )}
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              История и отзывы
            </p>
            <div className="mt-6 grid gap-3">
              {history.length ? (
                history.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {formatDate(booking.bookingDate)} • {booking.startTime}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {booking.bookingServices.map((item) => item.service.name).join(", ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {fullNameCar(booking.car)}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    {booking.status === "COMPLETED" ? (
                      booking.review ? (
                        <div className="mt-4 rounded-2xl bg-[rgba(31,157,141,0.08)] px-4 py-3 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">
                            Ваша оценка: {booking.review.rating}/5
                          </p>
                          <p className="mt-1">
                            {booking.review.comment || "Вы оставили оценку без текста."}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() =>
                                  setReviewDrafts((current) => ({
                                    ...current,
                                    [booking.id]: {
                                      rating,
                                      comment: current[booking.id]?.comment || "",
                                    },
                                  }))
                                }
                                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                  (reviewDrafts[booking.id]?.rating || 5) === rating
                                    ? "bg-[var(--color-accent-strong)] text-white"
                                    : "border border-slate-200 bg-slate-50 text-slate-700"
                                }`}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={reviewDrafts[booking.id]?.comment || ""}
                            onChange={(event) =>
                              setReviewDrafts((current) => ({
                                ...current,
                                [booking.id]: {
                                  rating: current[booking.id]?.rating || 5,
                                  comment: event.target.value,
                                },
                              }))
                            }
                            className="theme-input rounded-2xl px-4 py-3 text-sm outline-none"
                            placeholder="Как прошел визит? Что понравилось или что можно улучшить"
                          />
                          <button
                            type="button"
                            onClick={() => submitReview(booking.id)}
                            className="accent-button rounded-2xl px-4 py-3 text-sm font-semibold transition"
                          >
                            Оставить отзыв
                          </button>
                        </div>
                      )
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Завершенных или отмененных визитов пока нет.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Уведомления</p>
            <div className="mt-6 grid gap-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-800">
                    {translateNotificationText(notification.text)}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
