import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import { PrismaClient, BookingStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const password = "Demo12345!";

function dayStart(base: Date) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

async function main() {
  await prisma.bookingReview.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.contactLead.deleteMany();
  await prisma.rateLimitBucket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.car.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: "Анна Смирнова",
      email: "admin@avtoslot.ru",
      phone: "+7 (900) 123-45-67",
      passwordHash: hash,
      role: UserRole.ADMIN,
    },
  });

  const client = await prisma.user.create({
    data: {
      name: "Илья Петров",
      email: "client@avtoslot.ru",
      phone: "+7 (911) 555-77-11",
      passwordHash: hash,
      role: UserRole.CLIENT,
    },
  });

  const employeeUserOne = await prisma.user.create({
    data: {
      name: "Максим Романов",
      email: "master1@avtoslot.ru",
      phone: "+7 (921) 111-33-55",
      passwordHash: hash,
      role: UserRole.EMPLOYEE,
    },
  });

  const employeeUserTwo = await prisma.user.create({
    data: {
      name: "Сергей Морозов",
      email: "master2@avtoslot.ru",
      phone: "+7 (921) 444-22-88",
      passwordHash: hash,
      role: UserRole.EMPLOYEE,
    },
  });

  const engineCategory = await prisma.serviceCategory.create({
    data: {
      name: "Диагностика",
      description: "Компьютерная и механическая диагностика ключевых узлов автомобиля.",
    },
  });

  const maintenanceCategory = await prisma.serviceCategory.create({
    data: {
      name: "Техническое обслуживание",
      description: "Плановые работы для надежной эксплуатации автомобиля.",
    },
  });

  const repairCategory = await prisma.serviceCategory.create({
    data: {
      name: "Ремонт и ходовая",
      description: "Сервисные работы по тормозной системе, подвеске и рулевому управлению.",
    },
  });

  const services = await Promise.all([
    prisma.service.create({
      data: {
        categoryId: maintenanceCategory.id,
        name: "Замена масла",
        description: "Замена моторного масла и масляного фильтра с базовой проверкой утечек.",
        price: 2300,
        durationMinutes: 60,
      },
    }),
    prisma.service.create({
      data: {
        categoryId: engineCategory.id,
        name: "Компьютерная диагностика",
        description: "Считывание ошибок, анализ датчиков и рекомендация по ремонту.",
        price: 1900,
        durationMinutes: 45,
      },
    }),
    prisma.service.create({
      data: {
        categoryId: repairCategory.id,
        name: "Ремонт тормозной системы",
        description: "Проверка, замена колодок и обслуживание тормозных механизмов.",
        price: 4800,
        durationMinutes: 120,
      },
    }),
    prisma.service.create({
      data: {
        categoryId: repairCategory.id,
        name: "Развал-схождение",
        description: "Настройка углов установки колес с выдачей результата.",
        price: 3200,
        durationMinutes: 90,
      },
    }),
    prisma.service.create({
      data: {
        categoryId: maintenanceCategory.id,
        name: "Замена аккумулятора",
        description: "Подбор, установка и проверка параметров нового аккумулятора.",
        price: 1500,
        durationMinutes: 30,
      },
    }),
  ]);

  const employeeOne = await prisma.employee.create({
    data: {
      userId: employeeUserOne.id,
      name: employeeUserOne.name,
      specialization: "ТО и диагностика",
      phone: employeeUserOne.phone,
      email: employeeUserOne.email,
    },
  });

  const employeeTwo = await prisma.employee.create({
    data: {
      userId: employeeUserTwo.id,
      name: employeeUserTwo.name,
      specialization: "Подвеска и тормозная система",
      phone: employeeUserTwo.phone,
      email: employeeUserTwo.email,
    },
  });

  await prisma.workingHours.createMany({
    data: [
      { weekday: 0, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
      { weekday: 1, startTime: "09:00", endTime: "19:00", isWorkingDay: true },
      { weekday: 2, startTime: "09:00", endTime: "19:00", isWorkingDay: true },
      { weekday: 3, startTime: "09:00", endTime: "19:00", isWorkingDay: true },
      { weekday: 4, startTime: "09:00", endTime: "19:00", isWorkingDay: true },
      { weekday: 5, startTime: "09:00", endTime: "19:00", isWorkingDay: true },
      { weekday: 6, startTime: "10:00", endTime: "16:00", isWorkingDay: true },
    ],
  });

  const clientCar = await prisma.car.create({
    data: {
      userId: client.id,
      brand: "Toyota",
      model: "Camry",
      year: 2018,
      licensePlate: "A123BC39",
      vin: "JTNB11HK603123456",
      engineType: "Бензиновый",
    },
  });

  const upcomingDate = addDays(dayStart(new Date()), 2);
  const completedDate = addDays(dayStart(new Date()), -7);
  const secondCompletedDate = addDays(dayStart(new Date()), -20);

  const upcomingBooking = await prisma.booking.create({
    data: {
      userId: client.id,
      carId: clientCar.id,
      employeeId: employeeOne.id,
      bookingDate: upcomingDate,
      startTime: "10:00",
      endTime: "11:45",
      totalPrice: services[0].price + services[1].price,
      totalDuration: services[0].durationMinutes + services[1].durationMinutes,
      status: BookingStatus.CONFIRMED,
      comment: "Проверить расход масла и ошибки по двигателю.",
      bookingServices: {
        create: [
          {
            serviceId: services[0].id,
            price: services[0].price,
            durationMinutes: services[0].durationMinutes,
          },
          {
            serviceId: services[1].id,
            price: services[1].price,
            durationMinutes: services[1].durationMinutes,
          },
        ],
      },
    },
  });

  const completedBooking = await prisma.booking.create({
    data: {
      userId: client.id,
      carId: clientCar.id,
      employeeId: employeeTwo.id,
      bookingDate: completedDate,
      startTime: "13:00",
      endTime: "15:00",
      totalPrice: services[2].price,
      totalDuration: services[2].durationMinutes,
      status: BookingStatus.COMPLETED,
      comment: "Замена передних тормозных колодок.",
      bookingServices: {
        create: [
          {
            serviceId: services[2].id,
            price: services[2].price,
            durationMinutes: services[2].durationMinutes,
          },
        ],
      },
    },
  });

  await prisma.bookingReview.create({
    data: {
      bookingId: completedBooking.id,
      userId: client.id,
      carId: clientCar.id,
      rating: 5,
      comment: "Работы выполнили вовремя, мастер все объяснил и дал рекомендации.",
    },
  });

  await prisma.booking.create({
    data: {
      userId: client.id,
      carId: clientCar.id,
      employeeId: employeeOne.id,
      bookingDate: secondCompletedDate,
      startTime: "11:00",
      endTime: "12:00",
      totalPrice: services[1].price,
      totalDuration: services[1].durationMinutes,
      status: BookingStatus.COMPLETED,
      comment: "Плановая диагностика перед дальней поездкой.",
      bookingServices: {
        create: [
          {
            serviceId: services[1].id,
            price: services[1].price,
            durationMinutes: services[1].durationMinutes,
          },
        ],
      },
    },
  });

  await prisma.blockedSlot.create({
    data: {
      employeeId: employeeOne.id,
      date: upcomingDate,
      startTime: "15:00",
      endTime: "17:00",
      reason: "Внутреннее обучение мастера",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: client.id,
        bookingId: upcomingBooking.id,
        type: "booking_confirmed",
        text: "Ваша запись на 10:00 подтверждена администратором.",
      },
      {
        userId: client.id,
        bookingId: upcomingBooking.id,
        type: "reminder",
        text: "Напоминание: через 2 дня вы записаны на обслуживание Toyota Camry.",
      },
      {
        userId: admin.id,
        bookingId: upcomingBooking.id,
        type: "new_booking",
        text: "Новая запись клиента ожидает контроля в панели администратора.",
      },
    ],
  });

  console.log("Seed completed");
  console.log("Admin:", admin.email, password);
  console.log("Client:", client.email, password);
  console.log("Employee:", employeeUserOne.email, password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
