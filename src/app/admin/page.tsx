import { AdminPanel } from "@/components/admin-panel";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requirePageUser(["ADMIN"]);

  const [
    categories,
    services,
    bookings,
    employees,
    clients,
    workingHours,
    reviews,
  ] =
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
          review: true,
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
      prisma.bookingReview.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          user: {
            select: {
              name: true,
            },
          },
          car: {
            select: {
              brand: true,
              model: true,
              year: true,
            },
          },
          booking: {
            select: {
              bookingDate: true,
            },
          },
        },
      }),
    ]);

  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED");
  const cancelledBookings = bookings.filter((booking) =>
    ["CANCELLED_BY_CLIENT", "CANCELLED_BY_ADMIN"].includes(booking.status),
  );

  const statusBreakdown = [
    { label: "Новые", value: bookings.filter((booking) => booking.status === "NEW").length },
    {
      label: "Подтвержденные",
      value: bookings.filter((booking) => booking.status === "CONFIRMED").length,
    },
    {
      label: "В работе",
      value: bookings.filter((booking) => booking.status === "IN_PROGRESS").length,
    },
    { label: "Завершенные", value: completedBookings.length },
    { label: "Отмененные", value: cancelledBookings.length },
  ];

  const revenueByMonthMap = completedBookings.reduce<Record<string, number>>((acc, booking) => {
    const date = new Date(booking.bookingDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] || 0) + booking.totalPrice;
    return acc;
  }, {});

  const revenueByMonth = Object.entries(revenueByMonthMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, value]) => ({
      label: month,
      value,
    }));

  const topServicesMap = completedBookings.flatMap((booking) =>
    booking.bookingServices.map((item) => item.service.name),
  ).reduce<Record<string, number>>((acc, serviceName) => {
    acc[serviceName] = (acc[serviceName] || 0) + 1;
    return acc;
  }, {});

  const topServices = Object.entries(topServicesMap)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    label: `${rating}/5`,
    value: reviews.filter((review) => review.rating === rating).length,
  }));

  const stats = {
    totalBookings: bookings.length,
    completedBookings: completedBookings.length,
    cancelledBookings: cancelledBookings.length,
    revenue: completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    averageRating,
    reviewCount: reviews.length,
  };

  return (
    <div className="page-shell">
      <section className="page-hero max-w-4xl">
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
          statusBreakdown={statusBreakdown}
          revenueByMonth={revenueByMonth}
          topServices={topServices}
          ratingDistribution={ratingDistribution}
          recentReviews={reviews}
        />
      </div>
    </div>
  );
}
