"use server";

import { prisma } from "./database";

export async function createRoomAction(ipId: string) {
  console.log("ipId", ipId);
  const newUser = await prisma.user.upsert({
    where: {
      ip: ipId,
    },
    create: {
      ip: ipId,
      name: "username",
    },
    update: {
      ip: ipId,
      name: "username",
    },
  });

  const newRoom = await prisma.room.upsert({
    where: {
      ownerId_isActive: {
        ownerId: newUser.id,
        isActive: true,
      },
    },
    create: {
      ownerId: newUser.id,
      name: "channelName",
    },
    update: {
      ownerId: newUser.id,
      name: "channelName",
    },
  });

  const newRoomMember = await prisma.roomMember.upsert({
    where: {
      memberId_roomId: {
        memberId: newUser.id,
        roomId: newRoom.id,
      },
    },
    create: {
      memberId: newUser.id,
      roomId: newRoom.id,
    },
    update: {
      memberId: newUser.id,
      roomId: newRoom.id,
    },
  });

  return {
    newRoom,
    newUser,
    newRoomMember,
  };
}
