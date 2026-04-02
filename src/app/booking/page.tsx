import { BookingWizard } from "@/components/booking-wizard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{ service?: string }>;
};

export default async function BookingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const categories = await prisma.serviceCategory.findMany({
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const cars =
    user?.role === "CLIENT"
      ? await prisma.car.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <div className="page-shell">
      <section className="page-hero max-w-4xl">
        <p className="eyebrow text-sm uppercase tracking-[0.24em]">
          Онлайн-запись
        </p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-[var(--color-ink)]">
          Выберите услугу, дату и удобное время визита
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
          Покажем доступные окна записи, примерную длительность работ и итоговую
          стоимость еще до подтверждения визита.
        </p>
      </section>

      <div className="mt-10">
        <BookingWizard
          categories={categories}
          cars={cars}
          isClient={user?.role === "CLIENT"}
          initialServiceId={params.service}
        />
      </div>
    </div>
  );
}
