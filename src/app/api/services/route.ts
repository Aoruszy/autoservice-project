import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.serviceCategory.findMany({
    include: {
      services: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}
