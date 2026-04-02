import { redirect } from "next/navigation";
import { EmployeePanel } from "@/components/employee-panel";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmployeePage() {
  const user = await requirePageUser(["EMPLOYEE"]);

  if (!user.employee) {
    redirect("/auth");
  }

  const bookings = await prisma.booking.findMany({
    where: {
      employeeId: user.employee.id,
    },
    include: {
      user: true,
      car: true,
      bookingServices: {
        include: {
          service: true,
        },
      },
    },
    orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="page-shell">
      <EmployeePanel
        employeeName={user.employee.name}
        specialization={user.employee.specialization}
        bookings={bookings}
      />
    </div>
  );
}
