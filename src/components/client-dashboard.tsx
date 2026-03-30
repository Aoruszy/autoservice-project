"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";
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

type Props = {
  user: UserItem;
  cars: CarItem[];
  bookings: BookingItem[];
  notifications: NotificationItem[];
};

const emptyCar = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  licensePlate: "",
  vin: "",
  engineType: "",
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
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const upcoming = bookings.filter((booking) =>
    ["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"].includes(booking.status),
  );
  const history = bookings.filter(
    (booking) =>
      !["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"].includes(booking.status),
  );

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

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Аккаунт</p>
          <p className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
            {user.name}
          </p>
          <p className="mt-2 text-sm text-slate-500">С нами с {formatDate(user.createdAt)}</p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Автомобили</p>
          <p className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
            {cars.length}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Все машины доступны в форме онлайн-записи
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
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
        <div className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="grid gap-8">
          <form
            onSubmit={saveProfile}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
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
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                placeholder="Имя"
              />
              <input
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, email: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                placeholder="Email"
              />
              <input
                value={profile.phone}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, phone: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                placeholder="Телефон"
              />
            </div>
          </form>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                  placeholder="Марка"
                />
                <input
                  value={carForm.model}
                  onChange={(event) =>
                    setCarForm((current) => ({ ...current, model: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                  placeholder="Госномер"
                />
                <input
                  value={carForm.engineType}
                  onChange={(event) =>
                    setCarForm((current) => ({
                      ...current,
                      engineType: event.target.value,
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                  placeholder="Тип двигателя"
                />
                <input
                  value={carForm.vin}
                  onChange={(event) =>
                    setCarForm((current) => ({ ...current, vin: event.target.value }))
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                  placeholder="VIN"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
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
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
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
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-8">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">История</p>
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
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
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
                  <p className="text-sm text-slate-800">{notification.text}</p>
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
