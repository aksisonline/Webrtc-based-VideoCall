import { RoomTypes } from "@/interface/members";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let clientData: SupabaseClient<any, "public", any>;

const rooms: RoomTypes = {};

export const getSupaBase = () => {
  if (clientData) return clientData;
  return setSupaBase();
};

export const setSupaBase = () => {
  clientData = createClient(SUPABASE_URL, SUPABASE_KEY);
  return clientData;
};

export const getRoom = async ({ roomId }: { roomId: string }) => {
  if (rooms[roomId]) return rooms[roomId];

  if (!clientData) setSupaBase();

  const currentRoom = await clientData.channel(roomId);
  rooms[roomId] = currentRoom;
  return currentRoom;
};
