import { BookingStatus, UserRole } from "@prisma/client";
import { z } from "zod";

const phoneSchema = z
  .string()
  .min(10, "Введите телефон")
  .max(32, "Телефон слишком длинный");

export const loginSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.email("Введите корректный email"),
  phone: phoneSchema,
  password: z.string().min(6, "Минимум 6 символов"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.email("Введите корректный email"),
  phone: phoneSchema,
});

export const carSchema = z.object({
  brand: z.string().min(1, "Укажите марку"),
  model: z.string().min(1, "Укажите модель"),
  year: z.coerce.number().min(1980).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(3, "Укажите госномер"),
  vin: z.string().max(32).optional().or(z.literal("")),
  engineType: z.string().min(2, "Укажите тип двигателя"),
});

export const bookingCreateSchema = z.object({
  carId: z.string().min(1, "Выберите автомобиль"),
  serviceIds: z.array(z.string()).min(1, "Выберите хотя бы одну услугу"),
  date: z.string().min(1, "Выберите дату"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Некорректное время"),
  comment: z.string().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

export const bookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  comment: z.string().max(500).optional(),
});

export const bookingRescheduleSchema = z.object({
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const serviceSchema = z.object({
  categoryId: z.string().min(1, "Выберите категорию"),
  name: z.string().min(2, "Введите название"),
  description: z.string().min(10, "Добавьте описание"),
  price: z.coerce.number().min(0, "Цена не может быть отрицательной"),
  durationMinutes: z.coerce.number().min(15, "Минимум 15 минут"),
  isActive: z.boolean().default(true),
});

export const roleSchema = z.nativeEnum(UserRole);
