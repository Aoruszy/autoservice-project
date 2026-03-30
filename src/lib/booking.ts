import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activeBookingStatuses } from "@/lib/constants";
import { dateOnly, minutesToTime, overlaps, timeToMinutes } from "@/lib/utils";

export async function calculateBookingTotals(serviceIds: string[]) {
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      isActive: true,
    },
    include: {
      category: true,
    },
  });

  if (!services.length || services.length !== serviceIds.length) {
    throw new Error("Не удалось найти все выбранные услуги");
  }

  const totalDuration = services.reduce(
    (sum, service) => sum + service.durationMinutes,
    0,
  );
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

  return { services, totalDuration, totalPrice };
}

type AvailableSlotsOptions = {
  date: string;
  serviceIds: string[];
  excludeBookingId?: string;
};

export async function getAvailableSlots({
  date,
  serviceIds,
  excludeBookingId,
}: AvailableSlotsOptions) {
  const { totalDuration, totalPrice } = await calculateBookingTotals(serviceIds);
  const bookingDate = dateOnly(date);
  const weekday = bookingDate.getDay();

  const [workingHours, employees, bookings, blockedSlots] = await Promise.all([
    prisma.workingHours.findUnique({ where: { weekday } }),
    prisma.employee.findMany({ where: { isActive: true } }),
    prisma.booking.findMany({
      where: {
        bookingDate,
        status: { in: activeBookingStatuses },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: {
        id: true,
        employeeId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    }),
    prisma.blockedSlot.findMany({
      where: {
        date: bookingDate,
      },
    }),
  ]);

  if (!workingHours || !workingHours.isWorkingDay || !employees.length) {
    return { slots: [], totalDuration, totalPrice };
  }

  const startMinutes = timeToMinutes(workingHours.startTime);
  const endMinutes = timeToMinutes(workingHours.endTime);
  const slots: Array<{ time: string; availableEmployees: number; employeeIds: string[] }> = [];

  for (
    let cursor = startMinutes;
    cursor + totalDuration <= endMinutes;
    cursor += 30
  ) {
    const candidateEnd = cursor + totalDuration;

    const availableEmployees = employees.filter((employee) => {
      const employeeBookings = bookings.filter(
        (booking) => booking.employeeId === employee.id,
      );
      const employeeBlocks = blockedSlots.filter(
        (slot) => !slot.employeeId || slot.employeeId === employee.id,
      );

      const hasBookingConflict = employeeBookings.some((booking) =>
        overlaps(
          cursor,
          candidateEnd,
          timeToMinutes(booking.startTime),
          timeToMinutes(booking.endTime),
        ),
      );

      const hasBlockConflict = employeeBlocks.some((slot) =>
        overlaps(
          cursor,
          candidateEnd,
          timeToMinutes(slot.startTime),
          timeToMinutes(slot.endTime),
        ),
      );

      return !hasBookingConflict && !hasBlockConflict;
    });

    if (availableEmployees.length) {
      slots.push({
        time: minutesToTime(cursor),
        availableEmployees: availableEmployees.length,
        employeeIds: availableEmployees.map((employee) => employee.id),
      });
    }
  }

  return { slots, totalDuration, totalPrice };
}

export async function assignEmployeeForSlot(
  date: string,
  time: string,
  serviceIds: string[],
  excludeBookingId?: string,
) {
  const availability = await getAvailableSlots({ date, serviceIds, excludeBookingId });
  const slot = availability.slots.find((item) => item.time === time);

  if (!slot || !slot.employeeIds.length) {
    throw new Error("Выбранное время больше недоступно");
  }

  return slot.employeeIds[0];
}

export function statusAllowsCancellation(status: BookingStatus) {
  const cancellableStatuses: BookingStatus[] = [
    BookingStatus.NEW,
    BookingStatus.CONFIRMED,
    BookingStatus.RESCHEDULED,
  ];

  return cancellableStatuses.includes(status);
}

export async function createNotification(
  userId: string,
  type: string,
  text: string,
  bookingId?: string,
  tx: Prisma.TransactionClient = prisma,
) {
  await tx.notification.create({
    data: {
      userId,
      bookingId,
      type,
      text,
    },
  });
}
