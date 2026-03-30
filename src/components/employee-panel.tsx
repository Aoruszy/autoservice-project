"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type BookingItem = {
  id: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  comment: string | null;
  user: {
    name: string;
    phone: string;
  };
  car: {
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    engineType: string;
  };
  bookingServices: Array<{
    id: string;
    service: {
      name: string;
    };
  }>;
};

type Props = {
  employeeName: string;
  specialization: string;
  bookings: BookingItem[];
};

export function EmployeePanel({
  employeeName,
  specialization,
  bookings,
}: Props) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [drafts, setDrafts] = useState<
    Record<string, { status: BookingStatus; comment: string }>
  >(
    Object.fromEntries(
      bookings.map((booking) => [
        booking.id,
        {
          status: booking.status,
          comment: "",
        },
      ]),
    ),
  );

  async function saveStatus(id: string) {
    const response = await fetch(`/api/employee/bookings/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(drafts[id]),
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось обновить статус");
      return;
    }

    setFeedback("Статус работ обновлен.");
    router.refresh();
  }

  return (
    <div className="grid gap-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <p className="text-sm uppercase tracking-[0.22em] text-sky-200">
          Панель мастера
        </p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-4xl">
          {employeeName}
        </h1>
        <p className="mt-3 text-slate-300">{specialization}</p>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
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
                  Клиент: {booking.user.name} • {booking.user.phone}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {booking.car.brand} {booking.car.model}, {booking.car.year} •{" "}
                  {booking.car.licensePlate}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {booking.bookingServices.map((item) => item.service.name).join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[0.6fr_1.4fr_auto]">
              <select
                value={drafts[booking.id]?.status || booking.status}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [booking.id]: {
                      ...current[booking.id],
                      status: event.target.value as BookingStatus,
                    },
                  }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300"
              >
                <option value="CONFIRMED">Подтверждена</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="COMPLETED">Завершена</option>
              </select>
              <textarea
                rows={3}
                value={drafts[booking.id]?.comment || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [booking.id]: {
                      ...current[booking.id],
                      comment: event.target.value,
                    },
                  }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300"
                placeholder="Комментарий по работам"
              />
              <button
                type="button"
                onClick={() => saveStatus(booking.id)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Сохранить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
