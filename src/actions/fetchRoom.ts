"use server";

import { prisma } from "./database";

export async function fetchRoomAction({ id }: { id: string }) {
  const room = await prisma.room.findUnique({
    where: {
      id: id,
    },
  });
  return room;
}

export async function fetchUserAction(ipId: string) {
  const user = await prisma.user.upsert({
    where: {
      ip: ipId,
    },
    create: {
      ip: ipId,
      name: "new",
    },
    update: {},
  });
  return user;
}

export async function fetchRoomMemberAction({
  memberId,
  roomId,
}: {
  roomId: string;
  memberId: string;
}) {
  const roomMember = await prisma.roomMember.upsert({
    where: {
      memberId_roomId: {
        memberId,
        roomId,
      },
    },
    create: {
      memberId,
      roomId,
    },
    update: {},
  });
  return roomMember;
}
