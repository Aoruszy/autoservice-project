import type { BookingStatus, UserRole } from "@prisma/client";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "AvtoSlot";

export const engineTypeOptions = [
  "Бензиновый",
  "Дизельный",
  "Гибрид",
  "Электрический",
  "Газ/бензин",
] as const;

export const publicNavigation = [
  { href: "/", label: "Главная" },
  { href: "/services", label: "Услуги" },
  { href: "/booking", label: "Онлайн-запись" },
  { href: "/about", label: "О сервисе" },
  { href: "/contacts", label: "Контакты" },
];

export const roleTitles: Record<UserRole, string> = {
  CLIENT: "Клиент",
  ADMIN: "Администратор",
  EMPLOYEE: "Мастер",
};

export const statusMeta: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  NEW: { label: "Новая", className: "bg-sky-500/15 text-sky-700 ring-sky-500/30" },
  CONFIRMED: {
    label: "Подтверждена",
    className: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30",
  },
  IN_PROGRESS: {
    label: "В работе",
    className: "bg-amber-500/15 text-amber-700 ring-amber-500/30",
  },
  COMPLETED: {
    label: "Завершена",
    className: "bg-slate-900 text-white ring-slate-900/10",
  },
  CANCELLED_BY_CLIENT: {
    label: "Отменена клиентом",
    className: "bg-rose-500/15 text-rose-700 ring-rose-500/30",
  },
  CANCELLED_BY_ADMIN: {
    label: "Отменена администратором",
    className: "bg-rose-500/15 text-rose-700 ring-rose-500/30",
  },
  RESCHEDULED: {
    label: "Перенесена",
    className: "bg-violet-500/15 text-violet-700 ring-violet-500/30",
  },
};

export const activeBookingStatuses: BookingStatus[] = [
  "NEW",
  "CONFIRMED",
  "IN_PROGRESS",
  "RESCHEDULED",
];

export function getStatusLabel(status: BookingStatus): string {
  return statusMeta[status].label;
}

export function translateNotificationText(text: string): string {
  return Object.entries(statusMeta).reduce((result, [status, meta]) => {
    const pattern = new RegExp(`\\b${status}\\b`, "g");
    return result.replace(pattern, meta.label);
  }, text);
}

export const dashboardQuickStats = [
  {
    label: "Сценарий MVP",
    value: "Клиент + мастер + админ",
  },
  {
    label: "Запись без звонка",
    value: "Пошаговая форма",
  },
  {
    label: "Уведомления",
    value: "В панели клиента",
  },
];
