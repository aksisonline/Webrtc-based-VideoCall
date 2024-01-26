"use server";

import { getPrisma } from "@/utils/database";

export async function fetchRoomAction({ roomId }: { roomId: string }) {
  const prisma = getPrisma();
  const room = await prisma.room.findUnique({
    where: {
      id: roomId,
    },
  });
  if (room?.isActive) return room;
  else return null;
}

export async function fetchRoomMemberAction({
  userId,
  roomId,
}: {
  userId: string;
  roomId: string;
}) {
  const prisma = getPrisma();
  const roomMember = await prisma.roomMember.upsert({
    where: {
      memberId_roomId: {
        memberId: userId,
        roomId,
      },
    },
    create: {
      memberId: userId,
      roomId,
    },
    update: {},
  });
  return roomMember;
}

export async function fetchRoomMembersAction({ roomId }: { roomId: string }) {
  const prisma = getPrisma();
  const roomMembers = await prisma.roomMember.findMany({
    where: {
      roomId,
    },
  });
  return roomMembers;
}
