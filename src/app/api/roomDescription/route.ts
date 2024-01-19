import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const body = await request.json();
  console.log("request", request);
  console.log("body", body);
  const roomId = "";

  const description = await prisma.description.findMany({
    where: {
      roomMember: {
        roomId,
      },
      dataType: body.dataType === "Answer" ? "Answer" : "Offer",
    },
  });

  return NextResponse.json({ description }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { roomMemberId, type, sdp, dataType } = body;

  if (!roomMemberId || !type || !sdp || !dataType) {
    return NextResponse.json(
      { error: "needed value not given" },
      { status: 500 },
    );
  }

  const description = await prisma.description.upsert({
    where: {
      roomMemberId_dataType: {
        roomMemberId,
        dataType,
      },
    },
    create: {
      roomMemberId,
      dataType,
      sdp,
      type,
    },
    update: {
      roomMemberId,
      dataType,
      sdp,
      type,
    },
  });
  if (!description) {
    return NextResponse.json({ error: "error fetching user" }, { status: 500 });
  }
  return NextResponse.json({ description }, { status: 200 });
}
