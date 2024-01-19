import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  console.log("request", request);
  const body = await request.url;
  console.log("body", body);
  // const rooms = await prisma.room.findUnique();

  return NextResponse.json({ data: "rooms" }, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { ip, username, channelName } = body;

  if (!ip || !username || !channelName) {
    return NextResponse.json(
      { error: "needed value not given" },
      { status: 500 },
    );
  }

  const user = await prisma.user.upsert({
    where: {
      ip,
    },
    create: {
      ip,
      name: username,
    },
    update: {
      ip,
      name: username,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "error fetching user" }, { status: 500 });
  }
  const room = await prisma.room.upsert({
    where: {
      ownerId_isActive: {
        ownerId: user.id,
        isActive: true,
      },
    },
    create: {
      ownerId: user.id,
      name: channelName,
    },
    update: {
      ownerId: user.id,
      name: channelName,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "error creating room" }, { status: 500 });
  }
  const roomMember = await prisma.roomMember.upsert({
    where: {
      memberId_roomId: {
        memberId: user.id,
        roomId: room.id,
      },
    },
    create: {
      memberId: user.id,
      roomId: room.id,
    },
    update: {
      memberId: user.id,
      roomId: room.id,
    },
  });

  if (!roomMember) {
    return NextResponse.json(
      { error: "error creating roomMember" },
      { status: 500 },
    );
  }
  return NextResponse.json({ user, room, roomMember }, { status: 200 });
}
