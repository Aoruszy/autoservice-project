import Link from "next/link";
import { Wrench, ShieldCheck, CalendarDays, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

const reviews = [
  {
    name: "Артем Б.",
    text: "Записался ночью, утром уже подтвердили. В кабинете сразу видно статус и комментарии по машине.",
  },
  {
    name: "Светлана К.",
    text: "Сервис выглядит современно, запись понятная, а администратор быстро перенесла время без звонков.",
  },
  {
    name: "Николай Р.",
    text: "Удобно, что можно выбрать несколько услуг сразу и система сама считает длительность визита.",
  },
];

export default async function HomePage() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      services: {
        where: { isActive: true },
        take: 4,
        orderBy: { price: "asc" },
      },
    },
    take: 3,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
      <section className="grid gap-12 pb-18 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-18">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
            Онлайн-запись для автосервиса нового поколения
          </div>
          <h1 className="mt-6 font-[family:var(--font-display)] text-5xl font-semibold leading-[1.02] text-white md:text-7xl">
            Автосервис, в который записываются без звонков и ожидания.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            AvtoSlot помогает клиенту выбрать услугу, слот и автомобиль за пару
            минут, а команде сервиса дает живую панель заявок, мастеров и
            текущей загрузки.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/booking"
              className="rounded-full bg-sky-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            >
              Записаться онлайн
            </Link>
            <Link
              href="/services"
              className="rounded-full border border-white/15 px-6 py-4 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/5"
            >
              Смотреть услуги
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[36px] border border-white/10 bg-white/10 p-5 backdrop-blur">
          <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(8,18,35,0.45)]">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-200">
              Что есть в MVP
            </p>
            <div className="mt-6 grid gap-4">
              {[
                ["Клиентская запись", "пошаговый сценарий с автоподбором слота"],
                ["Личный кабинет", "автомобили, история, уведомления и статусы"],
                ["Админ-панель", "управление услугами, заявками и расписанием"],
                ["Панель мастера", "свои записи, статусы и комментарии по работам"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-2 text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          {
            title: "Умное бронирование",
            text: "Система сама исключает занятые и нерабочие интервалы.",
            icon: CalendarDays,
          },
          {
            title: "Контроль качества",
            text: "Клиент видит статус заявки и комментарии по работам.",
            icon: ShieldCheck,
          },
          {
            title: "Каталог услуг",
            text: "Категории, длительность, цены и запись прямо из карточки.",
            icon: Wrench,
          },
          {
            title: "Работа команды",
            text: "Администратор и мастер используют свои роли без лишнего шума.",
            icon: Users,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
          >
            <item.icon className="h-8 w-8 text-sky-600" />
            <h2 className="mt-5 font-[family:var(--font-display)] text-2xl text-slate-950">
              {item.title}
            </h2>
            <p className="mt-3 text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-18">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Популярные услуги
            </p>
            <h2 className="mt-3 font-[family:var(--font-display)] text-4xl text-slate-950">
              Каталог, который сразу ведет в запись
            </h2>
          </div>
          <Link href="/services" className="text-sm font-semibold text-slate-700 underline">
            Все услуги
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                {category.name}
              </p>
              <div className="mt-5 grid gap-3">
                {category.services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/booking?service=${service.id}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-950">{service.name}</p>
                      <span className="text-sm text-slate-500">
                        {service.durationMinutes} мин
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                    <p className="mt-4 text-sm font-semibold text-slate-800">
                      {formatCurrency(service.price)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-18 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[36px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_70px_rgba(8,18,35,0.35)]">
          <p className="text-sm uppercase tracking-[0.24em] text-sky-200">
            Почему это удобно
          </p>
          <div className="mt-8 grid gap-6">
            {[
              "Клиент больше не зависит от телефона и графика администратора.",
              "Каждая запись привязана к авто, услугам, мастеру и статусу выполнения.",
              "Панель администратора уже готова под дальнейший рост: CRM, SMS, оплата.",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-base text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="h-11 w-11 rounded-2xl bg-sky-100" />
              <p className="mt-5 text-sm leading-6 text-slate-600">{review.text}</p>
              <p className="mt-6 font-semibold text-slate-950">{review.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
