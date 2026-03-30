import { AdminPanel } from "@/components/admin-panel";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requirePageUser(["ADMIN"]);

  const [categories, services, bookings, employees, clients, workingHours] =
    await Promise.all([
      prisma.serviceCategory.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.service.findMany({
        include: {
          category: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.booking.findMany({
        include: {
          user: true,
          car: true,
          employee: true,
          bookingServices: {
            include: {
              service: true,
            },
          },
        },
        orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      }),
      prisma.employee.findMany({
        include: {
          bookings: {
            where: {
              status: {
                in: ["NEW", "CONFIRMED", "IN_PROGRESS", "RESCHEDULED"],
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "CLIENT" },
        include: {
          cars: true,
          bookings: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workingHours.findMany({
        orderBy: { weekday: "asc" },
      }),
    ]);

  const stats = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter((booking) => booking.status === "COMPLETED").length,
    cancelledBookings: bookings.filter((booking) =>
      ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"].includes(booking.status),
    ).length,
    revenue: bookings
      .filter((booking) => booking.status === "COMPLETED")
      .reduce((sum, booking) => sum + booking.totalPrice, 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6">
      <section className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Панель администратора</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-slate-950">
          Управление заявками, мастерами и каталогом услуг
        </h1>
      </section>

      <div className="mt-10">
        <AdminPanel
          categories={categories}
          services={services}
          bookings={bookings}
          employees={employees}
          clients={clients}
          workingHours={workingHours}
          stats={stats}
        />
      </div>
    </div>
  );
}
