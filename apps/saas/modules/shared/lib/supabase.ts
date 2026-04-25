import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
	const ext = file.name.split(".").pop() || "jpg";
	const path = `${userId}/profile.${ext}`;

	const { error } = await supabase.storage
		.from("avatars")
		.upload(path, file, { upsert: true, contentType: file.type });

	if (error) throw new Error(error.message);

	const { data } = supabase.storage.from("avatars").getPublicUrl(path);
	// Add cache-bust to force refresh
	return `${data.publicUrl}?t=${Date.now()}`;
}
