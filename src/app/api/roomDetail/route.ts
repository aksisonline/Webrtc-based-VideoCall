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

  const iceCandidate = await prisma.candidate.findMany({
    where: {
      roomMember: {
        roomId,
      },
      dataType: body.dataType === "Answer" ? "Answer" : "Offer",
    },
  });

  return NextResponse.json({ description, iceCandidate }, { status: 200 });
}
