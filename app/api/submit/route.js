import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = [
  "nombre",
  "email",
  "cargo",
  "departamento",
  "frecuencia",
  "tareas",
  "planActual",
  "tipoCuenta",
  "chocaLimites",
  "datosSensibles",
];

export async function POST(request) {
  try {
    const data = await request.json();

    // Validación de servidor
    for (const field of REQUIRED_FIELDS) {
      const value = data[field];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return NextResponse.json(
          { ok: false, error: `Campo requerido faltante: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    const ahorroHoras = Number(data.ahorroHoras);
    const nps = Number(data.nps);
    if (Number.isNaN(ahorroHoras) || ahorroHoras < 0 || ahorroHoras > 15) {
      return NextResponse.json(
        { ok: false, error: "Ahorro de horas fuera de rango" },
        { status: 400 }
      );
    }
    if (Number.isNaN(nps) || nps < 0 || nps > 10) {
      return NextResponse.json(
        { ok: false, error: "NPS fuera de rango" },
        { status: 400 }
      );
    }

    // Mapear a snake_case (esquema de Postgres)
    const row = {
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      cargo: data.cargo.trim(),
      departamento: data.departamento,
      frecuencia: data.frecuencia,
      tareas: data.tareas,
      ahorro_horas: ahorroHoras,
      plan_actual: data.planActual,
      tipo_cuenta: data.tipoCuenta,
      choca_limites: data.chocaLimites,
      nps,
      datos_sensibles: data.datosSensibles,
      bloqueadores: data.bloqueadores?.trim() || null,
      sugerencias: data.sugerencias?.trim() || null,
      submission_id: data.submissionId || null,
    };

    const { error } = await supabase.from("respuestas").insert(row);

    if (error) {
      // 23505 = unique_violation (Postgres). Significa que este submission_id
      // ya fue insertado → idempotente: respondemos OK sin duplicar.
      if (error.code === "23505") {
        console.info("[ALZAK] Submit idempotente ignorado:", row.submission_id);
        return NextResponse.json({ ok: true, deduped: true });
      }
      console.error("[ALZAK] Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: "No se pudo registrar la respuesta." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ALZAK] Error en /api/submit:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
