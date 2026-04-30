import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("respuestas")
      .select("*")
      .order("enviado_en", { ascending: false });

    if (error) {
      console.error("[ALZAK admin] Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: "db_error" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (err) {
    console.error("[ALZAK admin] Error en /api/admin/respuestas:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
