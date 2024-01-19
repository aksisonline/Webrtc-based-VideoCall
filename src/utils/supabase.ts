import { RoomTypes } from "@/interface/members";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const clientData = createClient(SUPABASE_URL, SUPABASE_KEY);

const rooms: RoomTypes = {};

export const getSupaBase = () => {
  return clientData;
};

export const getRoom = ({ roomId }: { roomId: string }) => {
  if (rooms[roomId]) return rooms[roomId];

  const currentRoom = clientData.channel(roomId);
  rooms[roomId] = currentRoom;
  return currentRoom;
};
