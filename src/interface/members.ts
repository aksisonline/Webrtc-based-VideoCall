import { RoomMember } from "@prisma/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export type RoomMembers = {
  [id: string]: RoomMember;
};

export type RoomTypes = {
  [id: string]: RealtimeChannel;
};
