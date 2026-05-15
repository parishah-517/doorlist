import { nanoid } from "nanoid";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const newId = () => nanoid(10);

export type EventRow = {
  id: string;
  created_at: string;
  title: string;
  hosts: string[];
  start_at: string;
  end_at: string | null;
  location: string;
  description: string;
  effect_index: number;
  thumbnail_index: number;
  cover_url: string | null;
};

export type EventInsert = Omit<EventRow, "created_at">;

export async function getEvent(id: string): Promise<EventRow | null> {
  const { data } = await supabase.from("events").select("*").eq("id", id).single();
  return (data as EventRow) ?? null;
}

export async function uploadCoverImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${newId()}.${ext}`;
  const { error } = await supabase.storage.from("event-covers").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("event-covers").getPublicUrl(path);
  return data.publicUrl;
}
