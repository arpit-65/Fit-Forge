import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Logout route — clears Supabase session and redirects to home */
export async function GET() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase not configured — safe to ignore
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return NextResponse.redirect(`${baseUrl}/`);
}
