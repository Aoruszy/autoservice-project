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
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6">
      <section className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Онлайн-запись</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-slate-950">
          Пошаговое бронирование без звонка администратору
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Слоты формируются автоматически по графику, длительности услуг и
          занятости мастеров. Двойное бронирование исключено.
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
