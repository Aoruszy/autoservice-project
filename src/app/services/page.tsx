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
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6">
      <section className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Каталог услуг</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-slate-950">
          Все работы автосервиса в одном месте
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Клиент видит не только цену, но и примерную длительность работ. Из
          любой карточки можно сразу перейти в запись.
        </p>
      </section>

      <div className="mt-10 grid gap-8">
        {categories.map((category) => (
          <section
            key={category.id}
            className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8"
          >
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                {category.name}
              </p>
              {category.description ? (
                <p className="mt-3 text-sm text-slate-600">{category.description}</p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-950">{service.name}</h2>
                      <p className="mt-2 text-sm text-slate-600">{service.description}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {service.durationMinutes} мин
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">
                      {formatCurrency(service.price)}
                    </p>
                    <Link
                      href={`/booking?service=${service.id}`}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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
