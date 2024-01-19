"use server";

import { IceCandidate } from "@/interface/room";
import { getPrisma } from "@/utils/database";

export async function addIceCandidateAction({
  roomMemberId,
  candidate,
  dataType,
}: {
  roomMemberId: string;
  candidate: IceCandidate;
  dataType: string;
}) {
  const prisma = getPrisma();
  await prisma.candidate.upsert({
    where: {
      roomMemberId_candidate: {
        roomMemberId,
        candidate: candidate.candidate,
      },
    },
    create: {
      roomMemberId: roomMemberId,
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid,
      usernameFragment: candidate.usernameFragment,
      dataType: dataType == "Answer" ? "Answer" : "Offer",
    },
    update: {},
  });
}

export async function getIceCandidateAction({
  roomId,
  dataType,
}: {
  roomId: string;
  dataType: string;
}) {
  const prisma = getPrisma();
  return await prisma.candidate.findMany({
    where: {
      roomMember: {
        roomId: roomId,
      },
      dataType: dataType === "Answer" ? "Answer" : "Offer",
    },
  });
}
