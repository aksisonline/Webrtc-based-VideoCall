"use server";

import { prisma } from "./database";
import { PCDescription } from "@/interface/room";

export async function addDescriptionAction({
  roomMemberId,
  description,
  dataType,
}: {
  roomMemberId: string;
  description: PCDescription;
  dataType: string;
}) {
  await prisma.description.upsert({
    where: {
      roomMemberId_dataType: {
        roomMemberId,
        dataType: dataType == "Answer" ? "Answer" : "Offer",
      },
    },
    create: {
      roomMemberId: roomMemberId,
      sdp: description.sdp ?? "",
      type: description.type,
      dataType: dataType == "Answer" ? "Answer" : "Offer",
    },
    update: {},
  });
}

export async function getDescriptionAction({
  roomId,
  dataType,
}: {
  roomId: string;
  dataType: string;
}) {
  return await prisma.description.findMany({
    where: {
      roomMember: {
        roomId: roomId,
      },
      dataType: dataType === "Answer" ? "Answer" : "Offer",
    },
  });
}
