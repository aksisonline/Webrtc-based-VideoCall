"use server";

import { getPrisma } from "@/utils/database";
import { Room, RoomMember } from "@prisma/client";

export const createRoomAction = async ({
  userId,
}: {
  userId: string;
}): Promise<{ room: Room; roomMember: RoomMember }> => {
  const prisma = getPrisma();
  const room = await prisma.room.upsert({
    where: {
      ownerId_isActive: {
        ownerId: userId,
        isActive: true,
      },
    },
    create: {
      ownerId: userId,
    },
    update: {
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
