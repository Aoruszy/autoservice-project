import { BookingStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { engineTypeOptions } from "@/lib/constants";

const currentYear = new Date().getFullYear();

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = normalizeWhitespace(value);
  return normalized === "" ? undefined : normalized;
}

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().max(max, `Максимум ${max} символов`).optional(),
  );

const emailSchema = z
  .string()
  .trim()
  .min(1, "Введите email")
  .max(254, "Email слишком длинный")
  .refine((value) => z.email().safeParse(value).success, "Введите корректный email")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Минимум 8 символов")
  .max(72, "Пароль слишком длинный")
  .refine((value) => /\p{L}/u.test(value), "Пароль должен содержать хотя бы одну букву")
  .refine((value) => /\d/.test(value), "Пароль должен содержать хотя бы одну цифру");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Введите телефон")
  .max(32, "Телефон слишком длинный")
  .refine(
    (value) => /^[+\d\s()-]+$/.test(value),
    "Телефон содержит недопустимые символы",
  )
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (digits) => digits.length >= 10 && digits.length <= 15,
    "Введите корректный номер телефона",
  )
  .transform((digits) => {
    if (digits.length === 10) {
      return `+7${digits}`;
    }

    if (digits.length === 11 && digits.startsWith("8")) {
      return `+7${digits.slice(1)}`;
    }

    return `+${digits}`;
  });

const bookingDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите корректную дату")
  .refine(
    (value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()),
    "Выберите корректную дату",
  )
  .refine((value) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${value}T00:00:00`) >= today;
  }, "Нельзя выбрать прошедшую дату");

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Некорректное время")
  .refine((value) => Number(value.split(":")[1]) % 30 === 0, "Время должно быть с шагом 30 минут");

const russianNameSchema = z
  .string()
  .trim()
  .min(2, "Введите имя")
  .max(80, "Имя слишком длинное")
  .transform(normalizeWhitespace)
  .refine(
    (value) => /^[\p{L}\s'.-]+$/u.test(value),
    "Имя может содержать только буквы, пробелы, дефис и апостроф",
  );

const carTextSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Укажите ${label}`)
    .max(60, "Поле слишком длинное")
    .transform(normalizeWhitespace)
    .refine(
      (value) => /^[\p{L}\d\s./()-]+$/u.test(value),
      `${label} содержит недопустимые символы`,
    );

const licensePlateSchema = z
  .string()
  .trim()
  .min(3, "Укажите госномер")
  .max(12, "Госномер слишком длинный")
  .transform(normalizeWhitespace)
  .refine(
    (value) => /^[\p{L}\d -]+$/u.test(value),
    "Госномер содержит недопустимые символы",
  )
  .transform((value) => value.toUpperCase());

const vinSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => /^[A-HJ-NPR-Z0-9]{17}$/u.test(value),
      "VIN должен состоять из 17 символов без I, O и Q",
    )
    .optional(),
);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль").max(72, "Пароль слишком длинный"),
});

export const registerSchema = z.object({
  name: russianNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: russianNameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export const carSchema = z.object({
  brand: carTextSchema("марку"),
  model: carTextSchema("модель"),
  year: z.coerce
    .number()
    .int("Год должен быть целым числом")
    .min(1980, "Год не может быть меньше 1980")
    .max(currentYear + 1, `Год не может быть больше ${currentYear + 1}`),
  licensePlate: licensePlateSchema,
  vin: vinSchema,
  engineType: z.enum(engineTypeOptions, {
    error: "Выберите тип двигателя из списка",
  }),
});

export const bookingCreateSchema = z.object({
  carId: z.string().trim().min(1, "Выберите автомобиль"),
  serviceIds: z
    .array(z.string().trim().min(1))
    .min(1, "Выберите хотя бы одну услугу")
    .refine((items) => new Set(items).size === items.length, "Нельзя выбрать одну услугу дважды"),
  date: bookingDateSchema,
  time: timeSchema,
  comment: optionalText(500),
});

export const cancelBookingSchema = z.object({
  reason: optionalText(300),
});

export const bookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  comment: optionalText(500),
});

export const bookingRescheduleSchema = z.object({
  date: bookingDateSchema,
  time: timeSchema,
});

export const bookingReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Оценка должна быть целым числом")
    .min(1, "Поставьте оценку от 1 до 5")
    .max(5, "Поставьте оценку от 1 до 5"),
  comment: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(10, "Добавьте хотя бы пару слов о визите")
      .max(500, "Отзыв слишком длинный")
      .transform(normalizeWhitespace)
      .optional(),
  ),
});

export const availableSlotsQuerySchema = z.object({
  date: bookingDateSchema,
  serviceIds: z
    .array(z.string().trim().min(1))
    .min(1, "Выберите хотя бы одну услугу")
    .refine((items) => new Set(items).size === items.length, "Нельзя выбрать одну услугу дважды"),
});

export const contactLeadSchema = z.object({
  name: russianNameSchema,
  contact: z
    .string()
    .trim()
    .min(1, "Укажите телефон или email")
    .max(254, "Контакт слишком длинный")
    .transform((value, ctx) => {
      const emailResult = emailSchema.safeParse(value);
      if (emailResult.success) {
        return emailResult.data;
      }

      const phoneResult = phoneSchema.safeParse(value);
      if (phoneResult.success) {
        return phoneResult.data;
      }

      ctx.addIssue({
        code: "custom",
        message: "Введите корректный телефон или email",
      });

      return z.NEVER;
    }),
  message: z
    .string()
    .trim()
    .min(10, "Опишите вопрос подробнее")
    .max(1000, "Сообщение слишком длинное")
    .transform(normalizeWhitespace),
  honeypot: z.string().trim().max(120).optional().default(""),
  sourcePage: z.string().trim().max(120).optional().default("/contacts"),
  submittedAt: z.coerce.number().int().positive(),
});

export const analyticsEventSchema = z.object({
  type: z.enum(["page_view", "booking_started", "contact_opened"]),
  path: z
    .string()
    .trim()
    .min(1, "Некорректный путь")
    .max(160, "Путь слишком длинный")
    .refine((value) => value.startsWith("/"), "Некорректный путь"),
  sessionId: z
    .string()
    .trim()
    .min(12, "Некорректная сессия")
    .max(80, "Некорректная сессия"),
  referrer: z.string().trim().max(200).optional(),
});

export const serviceSchema = z.object({
  categoryId: z.string().trim().min(1, "Выберите категорию"),
  name: z
    .string()
    .trim()
    .min(2, "Введите название")
    .max(100, "Название слишком длинное")
    .transform(normalizeWhitespace),
  description: z
    .string()
    .trim()
    .min(10, "Добавьте описание")
    .max(500, "Описание слишком длинное")
    .transform(normalizeWhitespace),
  price: z.coerce
    .number()
    .int("Цена должна быть целым числом")
    .min(0, "Цена не может быть отрицательной")
    .max(500_000, "Цена слишком большая"),
  durationMinutes: z.coerce
    .number()
    .int("Длительность должна быть целым числом")
    .min(15, "Минимум 15 минут")
    .max(24 * 60, "Длительность слишком большая"),
  isActive: z.boolean().default(true),
});

export const roleSchema = z.nativeEnum(UserRole);
