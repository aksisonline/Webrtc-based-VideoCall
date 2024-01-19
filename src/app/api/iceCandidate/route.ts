import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const body = await request.json();
  console.log("request", request);
  console.log("body", body);
  const roomId = "";

  const description = await prisma.candidate.findMany({
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
  const {
    roomMemberId,
    candidate,
    sdpMLineIndex,
    sdpMid,
    dataType,
    usernameFragment,
  } = body;

  if (
    !roomMemberId ||
    !candidate ||
    !sdpMLineIndex ||
    !sdpMid ||
    !dataType ||
    !usernameFragment
  ) {
    return NextResponse.json(
      { error: "needed value not given" },
      { status: 500 },
    );
  }

  const description = await prisma.candidate.upsert({
    where: {
      roomMemberId_candidate: {
        roomMemberId,
        candidate,
      },
    },
    create: {
      roomMemberId,
      candidate,
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      dataType,
    },
    update: {
      roomMemberId,
      candidate,
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      dataType,
    },
  });
  if (!description) {
    return NextResponse.json({ error: "error fetching user" }, { status: 500 });
  }
  return NextResponse.json({ description }, { status: 200 });
}
