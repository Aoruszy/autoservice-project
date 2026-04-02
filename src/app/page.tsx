import Link from "next/link";
import { CalendarDays, ShieldCheck, BellRing, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

const reviews = [
  {
    name: "Артем Б.",
    text: "Удобно, что можно выбрать время без звонка и сразу понять, сколько займет обслуживание.",
  },
  {
    name: "Светлана К.",
    text: "Записалась вечером, утром уже приехала точно ко времени. Все понятно и без лишней суеты.",
  },
  {
    name: "Николай Р.",
    text: "Нравится, что в кабинете хранится история визитов и легко повторно записаться на обслуживание.",
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
    <div className="page-shell">
      <section>
        <div className="grid gap-8 rounded-[40px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_28px_90px_rgba(17,32,51,0.1)] backdrop-blur md:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-10">
          <div className="max-w-3xl">
            <div className="eyebrow inline-flex rounded-full border border-[rgba(15,139,141,0.18)] bg-[rgba(15,139,141,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
              Запись онлайн 24/7
            </div>
            <h1 className="mt-6 font-[family:var(--font-display)] text-4xl font-semibold leading-[1.02] text-[var(--color-ink)] md:text-6xl">
              Обслуживание автомобиля без очередей и лишних звонков
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Выберите услугу, дату и удобное время за пару минут. Мы заранее
              подготовим заказ, а вы будете видеть статус записи в личном
              кабинете.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="accent-button rounded-full px-6 py-4 text-sm font-semibold transition"
              >
                Записаться онлайн
              </Link>
              <Link
                href="/services"
                className="secondary-button rounded-full px-6 py-4 text-sm font-semibold transition"
              >
                Смотреть услуги
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Пн-Пт: 09:00 - 19:00",
                "Сб: 10:00 - 16:00",
                "Подтверждение записи онлайн",
              ].map((item) => (
                <div
                  key={item}
                  className="theme-chip rounded-full px-4 py-2 text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="dark-card rounded-[32px] p-6">
            <div className="grid gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#a7efe5]">
                  Сегодня в сервисе
                </p>
                <h2 className="mt-3 font-[family:var(--font-display)] text-3xl leading-tight">
                  Быстрая запись и понятные условия
                </h2>
              </div>

              <div className="grid gap-3">
                {[
                  ["Телефон", "+7 (4012) 99-45-45"],
                  ["Адрес", "Калининград, Московский проспект, 184"],
                  ["Ближайшие услуги", "Замена масла, диагностика, развал-схождение"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white">{value}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/contacts"
                className="accent-button rounded-2xl px-4 py-3 text-center text-sm font-semibold transition"
              >
                Контакты и схема проезда
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Быстрый подбор времени",
            text: "Свободные окна рассчитываются автоматически без пересечений и очередей.",
            icon: CalendarDays,
          },
          {
            title: "Понятные цены",
            text: "До записи видно стоимость, длительность работ и состав выбранных услуг.",
            icon: Wrench,
          },
          {
            title: "Статусы и история",
            text: "В личном кабинете удобно следить за визитами и прошлым обслуживанием автомобиля.",
            icon: ShieldCheck,
          },
          {
            title: "Напоминания о визите",
            text: "Запись подтверждается онлайн, а важные изменения отображаются в кабинете клиента.",
            icon: BellRing,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="surface-card rounded-[28px] p-6"
          >
            <item.icon className="h-8 w-8 text-[var(--color-accent)]" />
            <h2 className="mt-5 font-[family:var(--font-display)] text-2xl text-[var(--color-ink)]">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-18">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-sm font-semibold uppercase tracking-[0.24em]">
              Популярные услуги
            </p>
            <h2 className="mt-3 font-[family:var(--font-display)] text-4xl text-[var(--color-ink)]">
              Выберите подходящую услугу и сразу переходите к записи
            </h2>
          </div>
          <Link href="/services" className="text-sm font-semibold text-[var(--color-accent-strong)] underline">
            Все услуги
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="surface-card rounded-[32px] p-6"
            >
              <p className="eyebrow text-sm uppercase tracking-[0.22em]">
                {category.name}
              </p>
              <div className="mt-5 grid gap-3">
                {category.services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/booking?service=${service.id}`}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 transition hover:border-[rgba(15,139,141,0.26)] hover:bg-[rgba(15,139,141,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-[var(--color-ink)]">{service.name}</p>
                      <span className="text-sm text-[var(--color-muted)]">
                        {service.durationMinutes} мин
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                      {service.description}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">
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
        <div className="dark-card rounded-[36px] border border-white/10 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-[#a7efe5]">
            Почему выбирают нас
          </p>
          <div className="mt-8 grid gap-6">
            {[
              "Работаем по записи, чтобы вы приезжали к назначенному времени без долгого ожидания.",
              "Услуги, стоимость и длительность обслуживания видны заранее еще до подтверждения визита.",
              "История посещений и информация по автомобилю всегда под рукой в личном кабинете.",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-base leading-7 text-[rgba(244,250,255,0.9)]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="surface-card flex h-full min-h-[320px] flex-col rounded-[30px] p-6"
            >
              <div className="h-11 w-11 rounded-2xl bg-[rgba(15,139,141,0.12)]" />
              <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">{review.text}</p>
              <p className="mt-auto pt-6 font-semibold text-[var(--color-ink)]">{review.name}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
