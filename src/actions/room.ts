"use server";

import { getPrisma } from "@/utils/database";
import { Room, RoomMember } from "@prisma/client";

export const createRoomAction = async ({
  userId,
}: {
  userId: string;
}): Promise<{ room: Room; roomMember: RoomMember }> => {
  const prisma = getPrisma();
  const room = await prisma.room.create({
    data: {
      ownerId: userId,
    },
  });

  const roomMember = await prisma.roomMember.upsert({
    where: {
      memberId_roomId: {
        memberId: userId,
        roomId: room.id,
      },
    },
    create: {
      memberId: userId,
      roomId: room.id,
    },
    update: {
      memberId: userId,
      roomId: room.id,
    },
  });

  return {
    room,
    roomMember,
  };
};

export const deleteRoomAction = async ({ roomId }: { roomId: string }) => {
  const prisma = getPrisma();
  await prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      isActive: false,
    },
  });

  await prisma.candidate.deleteMany({
    where: {
      roomMember: {
        roomId: roomId,
      },
    },
  });

  await prisma.description.deleteMany({
    where: {
      roomMember: {
        roomId: roomId,
      },
    },
  });
};
