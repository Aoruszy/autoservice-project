import { redirect } from "next/navigation";
import { ClientDashboard } from "@/components/client-dashboard";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requirePageUser(["CLIENT"]);

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      cars: {
        orderBy: { createdAt: "desc" },
      },
      bookings: {
        include: {
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
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!profile) {
    redirect("/auth");
  }

  return (
    <div className="page-shell">
      <section className="page-hero max-w-4xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Личный кабинет</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-slate-950">
          Управляйте автомобилями, записями и уведомлениями
        </h1>
      </section>

      <div className="mt-10">
        <ClientDashboard
          user={profile}
          cars={profile.cars}
          bookings={profile.bookings}
          notifications={profile.notifications}
        />
      </div>
    </div>
  );
}
