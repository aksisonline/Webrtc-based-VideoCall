import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const users = await prisma.user.findMany();

  return NextResponse.json({ data: users }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  console.log("body", body);
  const { ip, name } = body;

  if (!ip || !name) {
    return NextResponse.json(
      { error: "needed value not given" },
      { status: 500 },
    );
  }

  const room = await prisma.user.upsert({
    where: {
      ip,
    },
    create: {
      ip,
      name,
    },
    update: {
      ip,
      name,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "error creating user" }, { status: 500 });
  }

  return NextResponse.json({ data: room }, { status: 200 });
}
