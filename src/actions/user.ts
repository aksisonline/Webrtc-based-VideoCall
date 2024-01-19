"use server";

import { getPrisma } from "@/utils/database";

export async function createUserAction({
  deviceId,
  name,
}: {
  deviceId: string;
  name: string;
}) {
  const prisma = getPrisma();
  const user = await prisma.user.upsert({
    where: {
      deviceId,
    },
    create: {
      deviceId,
      name,
    },
    update: {
      deviceId,
      name,
    },
  });

  console.log("user", user);
  return user;
}

export async function fetchUserAction({ deviceId }: { deviceId: string }) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: {
      deviceId,
    },
  });
  return user;
}
