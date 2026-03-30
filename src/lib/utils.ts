import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string) {
  return format(new Date(value), "d MMMM yyyy", { locale: ru });
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "d MMM yyyy, HH:mm", { locale: ru });
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return startA < endB && endA > startB;
}

export function dateOnly(value: Date | string) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function fullNameCar(car: { brand: string; model: string; year: number }) {
  return `${car.brand} ${car.model}, ${car.year}`;
}

export function roleHome(role: "CLIENT" | "ADMIN" | "EMPLOYEE") {
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYEE") return "/employee";
  return "/dashboard";
}
