import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function ServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      services: {
        where: { isActive: true },
        orderBy: [{ name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page-shell">
      <section className="page-hero max-w-4xl">
        <p className="eyebrow text-sm uppercase tracking-[0.24em]">
          Каталог услуг
        </p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-[var(--color-ink)]">
          Все работы автосервиса в одном месте
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
          Клиент видит не только цену, но и примерную длительность работ. Из
          любой карточки можно сразу перейти в запись.
        </p>
      </section>

      <div className="mt-10 grid gap-8">
        {categories.map((category) => (
          <section
            key={category.id}
            className="surface-card rounded-[36px] p-6 md:p-8"
          >
            <div className="max-w-2xl">
              <p className="eyebrow text-sm uppercase tracking-[0.22em]">
                {category.name}
              </p>
              {category.description ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  {category.description}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className="flex h-full flex-col rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 font-semibold text-[var(--color-ink)]">
                      {service.name}
                    </h2>
                    <span className="shrink-0 rounded-full bg-[rgba(255,250,244,0.95)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
                      {service.durationMinutes} мин
                    </span>
                  </div>

                  <p className="mt-3 min-h-[52px] text-sm text-[var(--color-muted)]">
                    {service.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                    <p className="font-semibold text-[var(--color-ink)]">
                      {formatCurrency(service.price)}
                    </p>
                    <Link
                      href={`/booking?service=${service.id}`}
                      className="accent-button inline-flex min-w-[148px] items-center justify-center self-end rounded-full px-5 py-2.5 text-sm font-semibold transition"
                    >
                      Записаться
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
