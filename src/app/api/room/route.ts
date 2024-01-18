import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const rooms = await prisma.room.findMany();

  return NextResponse.json({ data: rooms }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  console.log(body);
  const { ownerId, name } = body;

  if (!ownerId || !name) {
    return NextResponse.json(
      { error: "needed value not given" },
      { status: 500 },
    );
  }

  const room = await prisma.room.create({
    data: {
      ownerId,
      name,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "error creating room" }, { status: 500 });
  }

  return NextResponse.json({ data: room }, { status: 200 });
}
