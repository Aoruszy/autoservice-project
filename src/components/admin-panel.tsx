"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

type CategoryItem = {
  id: string;
  name: string;
};

type ServiceItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  category: {
    name: string;
  };
};

type BookingItem = {
  id: string;
  bookingDate: string | Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPrice: number;
  user: { name: string; phone: string };
  car: { brand: string; model: string; licensePlate: string };
  employee: { id: string; name: string } | null;
  review: { rating: number; comment: string | null } | null;
  bookingServices: Array<{ id: string; service: { name: string } }>;
};

type EmployeeItem = {
  id: string;
  name: string;
  specialization: string;
  isActive: boolean;
  bookings: Array<{ id: string }>;
};

type ClientItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cars: Array<{ id: string }>;
  bookings: Array<{ id: string }>;
};

type WorkingHourItem = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
};

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  user: {
    name: string;
  };
  car: {
    brand: string;
    model: string;
    year: number;
  };
  booking: {
    bookingDate: string | Date;
  };
};

type Props = {
  categories: CategoryItem[];
  services: ServiceItem[];
  bookings: BookingItem[];
  employees: EmployeeItem[];
  clients: ClientItem[];
  workingHours: WorkingHourItem[];
  stats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    revenue: number;
    averageRating: number;
    reviewCount: number;
  };
  statusBreakdown: Array<{ label: string; value: number }>;
  revenueByMonth: Array<{ label: string; value: number }>;
  topServices: Array<{ label: string; value: number }>;
  ratingDistribution: Array<{ label: string; value: number }>;
  recentReviews: ReviewItem[];
};

const defaultService = {
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  durationMinutes: 60,
  isActive: true,
};

const weekdayMap = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function AdminPanel({
  categories,
  services,
  bookings,
  employees,
  clients,
  workingHours,
  stats,
  statusBreakdown,
  revenueByMonth,
  topServices,
  ratingDistribution,
  recentReviews,
}: Props) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    ...defaultService,
    categoryId: categories[0]?.id || "",
  });
  const [statusDrafts, setStatusDrafts] = useState<Record<string, BookingStatus>>(
    Object.fromEntries(bookings.map((booking) => [booking.id, booking.status])),
  );
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [rescheduleDrafts, setRescheduleDrafts] = useState<
    Record<string, { date: string; time: string }>
  >(
    Object.fromEntries(
      bookings.map((booking) => [
        booking.id,
        {
          date: new Date(booking.bookingDate).toISOString().slice(0, 10),
          time: booking.startTime,
        },
      ]),
    ),
  );
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
  });
  const deferredSearch = useDeferredValue(filters.search);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesStatus =
          filters.status === "ALL" || booking.status === filters.status;
        const haystack = `${booking.user.name} ${booking.car.licensePlate} ${booking.bookingServices
          .map((item) => item.service.name)
          .join(" ")}`.toLowerCase();
        const matchesSearch = haystack.includes(deferredSearch.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [bookings, deferredSearch, filters.status],
  );

  async function handleStatusUpdate(id: string) {
    const response = await fetch(`/api/admin/bookings/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: statusDrafts[id],
        comment: commentDrafts[id] || "",
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось обновить статус");
      return;
    }

    setFeedback("Статус заявки обновлен.");
    router.refresh();
  }

  async function handleReschedule(id: string) {
    const draft = rescheduleDrafts[id];
    const response = await fetch(`/api/admin/bookings/${id}/reschedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(draft),
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось перенести запись");
      return;
    }

    setFeedback("Запись перенесена.");
    router.refresh();
  }

  async function submitService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(
      editingServiceId ? `/api/admin/services/${editingServiceId}` : "/api/admin/services",
      {
        method: editingServiceId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceForm),
      },
    );
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось сохранить услугу");
      return;
    }

    setFeedback(editingServiceId ? "Услуга обновлена." : "Услуга добавлена.");
    setEditingServiceId(null);
    setServiceForm({ ...defaultService, categoryId: categories[0]?.id || "" });
    router.refresh();
  }

  async function archiveService(id: string) {
    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || "Не удалось удалить услугу");
      return;
    }

    setFeedback(data.archived ? "Услуга скрыта из каталога." : "Услуга удалена.");
    router.refresh();
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Все заявки" value={stats.totalBookings.toString()} />
        <StatCard label="Завершено" value={stats.completedBookings.toString()} />
        <StatCard label="Отмены" value={stats.cancelledBookings.toString()} />
        <StatCard label="Выручка" value={formatCurrency(stats.revenue)} />
        <StatCard
          label="Средняя оценка"
          value={stats.reviewCount ? `${stats.averageRating.toFixed(1)} / 5` : "Нет отзывов"}
        />
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-[rgba(15,139,141,0.22)] bg-[rgba(15,139,141,0.1)] px-4 py-3 text-sm text-[var(--color-accent-strong)]">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Структура заявок"
          subtitle="Текущее распределение по статусам"
          items={statusBreakdown}
          valueFormatter={(value) => `${value}`}
        />
        <ChartCard
          title="Выручка по месяцам"
          subtitle="Последние шесть месяцев по завершенным работам"
          items={revenueByMonth}
          valueFormatter={(value) => formatCurrency(value)}
        />
        <ChartCard
          title="Популярные услуги"
          subtitle="Что чаще всего доходит до завершения"
          items={topServices}
          valueFormatter={(value) => `${value} заказ${value === 1 ? "" : value < 5 ? "а" : "ов"}`}
        />
        <ChartCard
          title="Оценки клиентов"
          subtitle="Распределение отзывов по рейтингу"
          items={ratingDistribution}
          valueFormatter={(value) => `${value}`}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-8">
          <div className="surface-card rounded-[32px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Заявки
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
                  Контроль загрузки сервиса
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 text-sm outline-none"
                  placeholder="Клиент, номер, услуга"
                />
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, status: event.target.value }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 text-sm outline-none"
                >
                  <option value="ALL">Все статусы</option>
                  <option value="NEW">Новая</option>
                  <option value="CONFIRMED">Подтверждена</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELLED_BY_CLIENT">Отменена клиентом</option>
                  <option value="CANCELLED_BY_ADMIN">Отменена администратором</option>
                  <option value="RESCHEDULED">Перенесена</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-slate-950">
                          {booking.user.name} • {formatDate(booking.bookingDate)} • {booking.startTime}
                        </p>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {booking.car.brand} {booking.car.model} • {booking.car.licensePlate}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.bookingServices.map((item) => item.service.name).join(", ")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Мастер: {booking.employee?.name || "автоназначение"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950">
                        {formatCurrency(booking.totalPrice)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{booking.user.phone}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="grid gap-3">
                      <select
                        value={statusDrafts[booking.id]}
                        onChange={(event) =>
                          setStatusDrafts((current) => ({
                            ...current,
                            [booking.id]: event.target.value as BookingStatus,
                          }))
                        }
                        className="theme-input rounded-2xl bg-[rgba(255,250,244,0.94)] px-4 py-3 text-sm outline-none"
                      >
                        <option value="NEW">Новая</option>
                        <option value="CONFIRMED">Подтверждена</option>
                        <option value="IN_PROGRESS">В работе</option>
                        <option value="COMPLETED">Завершена</option>
                        <option value="CANCELLED_BY_ADMIN">Отменена администратором</option>
                        <option value="RESCHEDULED">Перенесена</option>
                      </select>
                      <textarea
                        rows={3}
                        value={commentDrafts[booking.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({
                            ...current,
                            [booking.id]: event.target.value,
                          }))
                        }
                        className="theme-input rounded-2xl bg-[rgba(255,250,244,0.94)] px-4 py-3 text-sm outline-none"
                        placeholder="Комментарий администратора"
                      />
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(booking.id)}
                        className="accent-button rounded-2xl px-4 py-3 text-sm font-semibold transition"
                      >
                        Обновить статус
                      </button>
                    </div>

                    <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Перенос записи
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="date"
                          value={rescheduleDrafts[booking.id]?.date || ""}
                          onChange={(event) =>
                            setRescheduleDrafts((current) => ({
                              ...current,
                              [booking.id]: {
                                ...current[booking.id],
                                date: event.target.value,
                              },
                            }))
                          }
                          className="theme-input rounded-2xl px-4 py-3 text-sm outline-none"
                        />
                        <input
                          type="time"
                          value={rescheduleDrafts[booking.id]?.time || ""}
                          onChange={(event) =>
                            setRescheduleDrafts((current) => ({
                              ...current,
                              [booking.id]: {
                                ...current[booking.id],
                                time: event.target.value,
                              },
                            }))
                          }
                          className="theme-input rounded-2xl px-4 py-3 text-sm outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReschedule(booking.id)}
                        className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900"
                      >
                        Перенести заявку
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Клиенты</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {clients.map((client) => (
                <div key={client.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{client.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{client.email}</p>
                  <p className="mt-1 text-sm text-slate-500">{client.phone}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Авто: {client.cars.length} • Заявок: {client.bookings.length}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Отзывы клиентов
            </p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
              Последние оценки по выполненным работам
            </h2>

            <div className="mt-6 grid gap-3">
              {recentReviews.length ? (
                recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{review.user.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {review.car.brand} {review.car.model}, {review.car.year}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {review.comment || "Клиент оставил оценку без текста."}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(review.booking.bookingDate)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Пока нет отзывов. Они появятся после завершенных работ и оценок от клиентов.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-8">
          <form
            onSubmit={submitService}
            className="surface-card rounded-[32px] p-6"
          >
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Услуги</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-2xl text-slate-950">
              Каталог и цены
            </h2>

            <div className="mt-6 grid gap-3">
              <select
                value={serviceForm.categoryId}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="theme-input rounded-2xl px-4 py-3 outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, name: event.target.value }))
                }
                className="theme-input rounded-2xl px-4 py-3 outline-none"
                placeholder="Название услуги"
              />
              <textarea
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="theme-input rounded-2xl px-4 py-3 outline-none"
                placeholder="Описание услуги"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      price: Number(event.target.value),
                    }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Цена"
                />
                <input
                  type="number"
                  value={serviceForm.durationMinutes}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      durationMinutes: Number(event.target.value),
                    }))
                  }
                  className="theme-input rounded-2xl px-4 py-3 outline-none"
                  placeholder="Длительность"
                />
              </div>
              <label className="theme-input flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--color-ink)]">
                <input
                  type="checkbox"
                  checked={serviceForm.isActive}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Активна в каталоге
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="accent-button rounded-2xl px-4 py-3 text-sm font-semibold"
                >
                  {editingServiceId ? "Сохранить услугу" : "Добавить услугу"}
                </button>
                {editingServiceId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingServiceId(null);
                      setServiceForm({ ...defaultService, categoryId: categories[0]?.id || "" });
                    }}
                    className="secondary-button rounded-2xl px-4 py-3 text-sm font-semibold"
                  >
                    Отмена
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {services.map((service) => (
                <div key={service.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{service.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{service.category.name}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        service.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {service.isActive ? "Активна" : "Скрыта"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{service.description}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCurrency(service.price)} • {service.durationMinutes} мин
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingServiceId(service.id);
                          setServiceForm({
                            categoryId: service.categoryId,
                            name: service.name,
                            description: service.description,
                            price: service.price,
                            durationMinutes: service.durationMinutes,
                            isActive: service.isActive,
                          });
                        }}
                        className="secondary-button rounded-xl px-3 py-2 text-sm font-semibold"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveService(service.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </form>

          <div className="surface-card rounded-[32px] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Мастера и график
            </p>
            <div className="mt-6 grid gap-3">
              {employees.map((employee) => (
                <div key={employee.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{employee.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{employee.specialization}</p>
                  <p className="mt-3 text-sm text-slate-600">
                    Активных заявок: {employee.bookings.length}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {workingHours.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold">{weekdayMap[item.weekday]}</p>
                  <p className="mt-1">
                    {item.isWorkingDay ? `${item.startTime} - ${item.endTime}` : "Выходной"}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-[28px] p-6">
      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 font-[family:var(--font-display)] text-3xl text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  items,
  valueFormatter,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number }>;
  valueFormatter: (value: number) => string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="surface-card rounded-[32px] p-6">
      <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

      <div className="mt-6 grid gap-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-500">{valueFormatter(item.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[rgba(20,40,61,0.08)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#1f9d8d_0%,#34c3b0_100%)]"
                  style={{
                    width:
                      item.value === 0
                        ? "0%"
                        : `${Math.max(12, (item.value / maxValue) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Пока недостаточно данных для графика.</p>
        )}
      </div>
    </div>
  );
}
