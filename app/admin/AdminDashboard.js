"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ClaudeLogo from "../_components/ClaudeLogo";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#003B5C",
  primarySoft: "#0A4F79",
  accent: "#00A65E",
  accentDark: "#008C4F",
  accentLight: "#7FE0B4",
  warn: "#D97757",
  red: "#DC2626",
  slate: "#94A3B8",
};

const PIE_PALETTE = [
  COLORS.primary,
  COLORS.accent,
  COLORS.primarySoft,
  COLORS.accentDark,
  COLORS.accentLight,
  COLORS.warn,
];

const FREQ_LABELS = {
  diario: "Diario",
  semanal: "Semanal",
  ocasional: "Ocasional",
  nunca: "No lo usa",
};
const PLAN_LABELS = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
  ninguno: "Sin cuenta",
};
const ACCOUNT_LABELS = {
  corporativa: "Corporativa",
  personal: "Personal",
  ninguna: "Sin cuenta",
};
const LIMITS_LABELS = {
  si: "Sí",
  aveces: "A veces",
  no: "No",
  na: "N/A",
};
const SENSITIVE_LABELS = {
  nunca: "Nunca",
  aveces: "A veces",
  frecuentemente: "Frecuentemente",
};

const POLL_INTERVAL_MS = 10_000;

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    departamento: "",
    plan: "",
    search: "",
    desde: "",
    hasta: "",
  });
  const cancelRef = useRef(false);

  const loadRows = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/respuestas", {
        credentials: "include",
        cache: "no-store",
      });
      const body = await res.json();
      if (cancelRef.current) return;
      if (!body.ok) throw new Error(body.error || "error");
      setRows(body.rows);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      if (!cancelRef.current) setError(e.message);
    } finally {
      if (!cancelRef.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    cancelRef.current = false;
    loadRows();
    const id = setInterval(() => loadRows({ silent: true }), POLL_INTERVAL_MS);
    return () => {
      cancelRef.current = true;
      clearInterval(id);
    };
  }, [loadRows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.departamento && r.departamento !== filters.departamento) return false;
      if (filters.plan && r.plan_actual !== filters.plan) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [r.nombre, r.email, r.cargo].some((v) =>
          (v || "").toLowerCase().includes(q)
        );
        if (!hay) return false;
      }
      if (filters.desde) {
        if (new Date(r.enviado_en) < new Date(filters.desde)) return false;
      }
      if (filters.hasta) {
        const end = new Date(filters.hasta);
        end.setHours(23, 59, 59, 999);
        if (new Date(r.enviado_en) > end) return false;
      }
      return true;
    });
  }, [rows, filters]);

  return (
    <main className="min-h-screen w-full">
      <div className="h-1.5 w-full bg-alzak-gradient" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <AdminHeader total={filtered.length} totalAll={rows.length} />

        {loading && <Loader />}
        {error && <ErrorBox message={error} />}

        {!loading && !error && (
          <>
            <LiveStatus
              lastUpdated={lastUpdated}
              refreshing={refreshing}
              onRefresh={() => loadRows({ silent: true })}
            />

            <Filters
              filters={filters}
              setFilters={setFilters}
              rows={rows}
            />

            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <Kpis rows={filtered} />
                <Charts rows={filtered} />
                <ResponsesTable rows={filtered} />
                <ExportSection rows={filtered} />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─────────────────── Live status ─────────────────── */

function LiveStatus({ lastUpdated, refreshing, onRefresh }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : 0;

  const label = !lastUpdated
    ? "—"
    : seconds < 5
      ? "ahora mismo"
      : seconds < 60
        ? `hace ${seconds}s`
        : `hace ${Math.floor(seconds / 60)}m`;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alzak-accent opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-alzak-accent" />
        </span>
        <span className="font-medium">En vivo · actualizado {label}</span>
        {refreshing && <span className="text-alzak-accent">· sincronizando...</span>}
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 transition hover:border-alzak-accent hover:text-alzak-accent-dark disabled:opacity-50"
      >
        <svg
          className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Actualizar
      </button>
    </div>
  );
}

/* ─────────────────── Header ─────────────────── */

function AdminHeader({ total, totalAll }) {
  return (
    <>
      <ConfidentialBanner />
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/logos/alzak.webp"
            alt="ALZAK Foundation"
            width={140}
            height={70}
            priority
            className="h-9 w-auto"
          />
          <span className="text-lg font-light text-slate-300">×</span>
          <ClaudeLogo height={28} />
          <div className="ml-3 hidden sm:block border-l border-slate-200 pl-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-alzak-accent">
              Panel administrativo
            </div>
            <h1 className="text-lg font-bold text-alzak-primary">
              Evaluación de Claude AI
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-alzak-primary">{total}</span>
            {total !== totalAll && <span> de {totalAll}</span>} respuestas
          </span>
        </div>
      </header>
    </>
  );
}

function ConfidentialBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-alzak-accent/30 bg-alzak-accent-tint px-4 py-3">
      <svg
        className="h-5 w-5 flex-shrink-0 text-alzak-accent-dark mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <div className="text-xs leading-relaxed text-alzak-accent-dark">
        <strong className="text-alzak-primary">Confidencial · Uso interno.</strong>{" "}
        Esta vista contiene respuestas individuales con datos personales (nombres,
        emails, comentarios). No comparta este enlace fuera del equipo de gerencia
        de ALZAK Foundation.
      </div>
    </div>
  );
}

/* ─────────────────── Filters ─────────────────── */

function Filters({ filters, setFilters, rows }) {
  const departamentos = useMemo(
    () => [...new Set(rows.map((r) => r.departamento))].sort(),
    [rows]
  );
  const planes = useMemo(
    () => [...new Set(rows.map((r) => r.plan_actual))].sort(),
    [rows]
  );

  const update = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () =>
    setFilters({ departamento: "", plan: "", search: "", desde: "", hasta: "" });

  const hasFilters = Object.values(filters).some((v) => v);

  return (
    <div className="mb-6 rounded-2xl bg-white shadow-card p-4 sm:p-5 border border-slate-100">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div className="col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Buscar
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder="Nombre, email o cargo..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-alzak-primary placeholder-slate-400 focus:border-alzak-accent focus:outline-none focus:ring-2 focus:ring-alzak-accent/20"
          />
        </div>
        <FilterSelect
          label="Departamento"
          value={filters.departamento}
          onChange={(v) => update("departamento", v)}
          options={departamentos}
        />
        <FilterSelect
          label="Plan"
          value={filters.plan}
          onChange={(v) => update("plan", v)}
          options={planes}
          format={(v) => PLAN_LABELS[v] || v}
        />
        <FilterDate
          label="Desde"
          value={filters.desde}
          onChange={(v) => update("desde", v)}
        />
        <FilterDate
          label="Hasta"
          value={filters.hasta}
          onChange={(v) => update("hasta", v)}
        />
      </div>
      {hasFilters && (
        <button
          onClick={clear}
          className="mt-3 text-xs font-semibold text-alzak-accent hover:text-alzak-accent-dark transition"
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, format }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-alzak-primary focus:border-alzak-accent focus:outline-none focus:ring-2 focus:ring-alzak-accent/20"
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format ? format(o) : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterDate({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-alzak-primary focus:border-alzak-accent focus:outline-none focus:ring-2 focus:ring-alzak-accent/20"
      />
    </div>
  );
}

/* ─────────────────── KPIs ─────────────────── */

function Kpis({ rows }) {
  const total = rows.length;
  const adopcion = rows.filter((r) => r.frecuencia !== "nunca").length;
  const adopcionPct = total ? Math.round((adopcion / total) * 100) : 0;

  const ahorroTotal = rows.reduce((acc, r) => acc + (r.ahorro_horas || 0), 0);
  const ahorroProm = total ? (ahorroTotal / total).toFixed(1) : "0";

  const npsTotal = rows.reduce((acc, r) => acc + (r.nps || 0), 0);
  const npsProm = total ? (npsTotal / total).toFixed(1) : "0";

  const personales = rows.filter((r) => r.tipo_cuenta === "personal").length;
  const personalesPct = total ? Math.round((personales / total) * 100) : 0;

  const sensiblesRiesgo = rows.filter((r) =>
    ["aveces", "frecuentemente"].includes(r.datos_sensibles)
  ).length;
  const sensiblesPct = total ? Math.round((sensiblesRiesgo / total) * 100) : 0;

  const chocaLimites = rows.filter((r) =>
    ["si", "aveces"].includes(r.choca_limites)
  ).length;

  return (
    <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        label="Total respuestas"
        value={total}
        sub={`${adopcionPct}% usa Claude AI`}
        accent="primary"
      />
      <KpiCard
        label="Ahorro promedio"
        value={ahorroProm}
        unit="h/sem"
        sub={`${ahorroTotal} h totales`}
        accent="accent"
      />
      <KpiCard
        label="NPS promedio"
        value={npsProm}
        unit="/10"
        sub="Recomendación"
        accent="accent"
      />
      <KpiCard
        label="Necesitan upgrade"
        value={chocaLimites}
        sub="chocan con límites"
        accent="primary"
      />
      <KpiCard
        label="Cuentas personales"
        value={`${personalesPct}%`}
        sub={`${personales} de ${total} respuestas`}
        accent={personalesPct >= 30 ? "warn" : "primary"}
        icon={personalesPct >= 30 ? "warning" : null}
      />
      <KpiCard
        label="Manejan datos sensibles"
        value={`${sensiblesPct}%`}
        sub={`${sensiblesRiesgo} respuestas con riesgo`}
        accent={sensiblesPct >= 20 ? "warn" : "primary"}
        icon={sensiblesPct >= 20 ? "warning" : null}
      />
      <KpiCard
        label="ROI estimado"
        value={`${Math.round(ahorroTotal * 4)} h`}
        sub="ahorro mensual estimado"
        accent="accent"
      />
      <KpiCard
        label="Adopción"
        value={`${adopcionPct}%`}
        sub={`${adopcion} usuarios activos`}
        accent="accent"
      />
    </div>
  );
}

function KpiCard({ label, value, unit, sub, accent = "primary", icon }) {
  const accentClass = {
    primary: "text-alzak-primary",
    accent: "text-alzak-accent-dark",
    warn: "text-[#D97757]",
  }[accent];

  return (
    <div className="rounded-2xl bg-white shadow-card border border-slate-100 p-4 sm:p-5 transition hover:shadow-soft">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon === "warning" && (
          <svg className="h-4 w-4 text-[#D97757]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${accentClass}`}>
        {value}
        {unit && <span className="text-base font-medium ml-1 opacity-60">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/* ─────────────────── Charts ─────────────────── */

function Charts({ rows }) {
  const byDept = countBy(rows, "departamento");
  const byFreq = countBy(rows, "frecuencia").map((d) => ({
    ...d,
    name: FREQ_LABELS[d.name] || d.name,
  }));
  const byPlan = countBy(rows, "plan_actual").map((d) => ({
    ...d,
    name: PLAN_LABELS[d.name] || d.name,
  }));
  const byAccount = countBy(rows, "tipo_cuenta").map((d) => ({
    ...d,
    name: ACCOUNT_LABELS[d.name] || d.name,
  }));

  const tareasMap = {};
  rows.forEach((r) =>
    (r.tareas || []).forEach((t) => {
      tareasMap[t] = (tareasMap[t] || 0) + 1;
    })
  );
  const topTareas = Object.entries(tareasMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const npsBuckets = Array.from({ length: 11 }, (_, i) => ({
    name: String(i),
    value: rows.filter((r) => r.nps === i).length,
  }));

  return (
    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Respuestas por departamento">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byDept}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.primary }} />
            <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(0, 166, 94, 0.05)" }} />
            <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Frecuencia de uso">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byFreq}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {byFreq.map((_, i) => (
                <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Plan actual usado">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byPlan}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.primary }} />
            <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(0, 166, 94, 0.05)" }} />
            <Bar dataKey="value" fill={COLORS.accent} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tipo de cuenta">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byAccount}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {byAccount.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.name === "Personal"
                      ? COLORS.warn
                      : PIE_PALETTE[i % PIE_PALETTE.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tareas más comunes" wide>
        <ResponsiveContainer width="100%" height={Math.max(260, topTareas.length * 36)}>
          <BarChart data={topTareas} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis type="number" tick={{ fontSize: 12, fill: COLORS.slate }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: COLORS.primary }}
              width={220}
            />
            <Tooltip cursor={{ fill: "rgba(0, 166, 94, 0.05)" }} />
            <Bar dataKey="value" fill={COLORS.accent} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Distribución de NPS (recomendación)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={npsBuckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.primary }} />
            <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(0, 166, 94, 0.05)" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {npsBuckets.map((d, i) => {
                let fill = COLORS.warn;
                if (Number(d.name) >= 9) fill = COLORS.accent;
                else if (Number(d.name) >= 7) fill = COLORS.accentLight;
                else if (Number(d.name) >= 5) fill = COLORS.slate;
                return <Cell key={i} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, wide }) {
  return (
    <div className={`rounded-2xl bg-white shadow-card border border-slate-100 p-5 ${wide ? "lg:col-span-2" : ""}`}>
      <h3 className="mb-4 text-sm font-bold text-alzak-primary">{title}</h3>
      {children}
    </div>
  );
}

/* ─────────────────── Tabla ─────────────────── */

function ResponsesTable({ rows }) {
  return (
    <div className="mb-6 rounded-2xl bg-white shadow-card border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-alzak-primary">
          Respuestas individuales
        </h3>
        <span className="text-xs text-slate-500">{rows.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-alzak-bg text-left">
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Th>Fecha respuesta</Th>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Cargo</Th>
              <Th>Depto</Th>
              <Th>Frec.</Th>
              <Th>Plan</Th>
              <Th>Cuenta</Th>
              <Th>Límites</Th>
              <Th>Ahorro</Th>
              <Th>NPS</Th>
              <Th>Sensibles</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-alzak-bg/50">
                <Td>{formatDate(r.enviado_en)}</Td>
                <Td className="font-medium text-alzak-primary">{r.nombre}</Td>
                <Td className="text-slate-600">{r.email}</Td>
                <Td>{r.cargo}</Td>
                <Td>{r.departamento}</Td>
                <Td>{FREQ_LABELS[r.frecuencia] || r.frecuencia}</Td>
                <Td>
                  <Pill>
                    {PLAN_LABELS[r.plan_actual] || r.plan_actual}
                  </Pill>
                </Td>
                <Td>
                  <Pill warn={r.tipo_cuenta === "personal"}>
                    {ACCOUNT_LABELS[r.tipo_cuenta] || r.tipo_cuenta}
                  </Pill>
                </Td>
                <Td>{LIMITS_LABELS[r.choca_limites] || r.choca_limites}</Td>
                <Td className="font-semibold text-alzak-primary tabular-nums">
                  {r.ahorro_horas}h
                </Td>
                <Td>
                  <NpsBadge value={r.nps} />
                </Td>
                <Td>
                  <Pill warn={r.datos_sensibles !== "nunca"}>
                    {SENSITIVE_LABELS[r.datos_sensibles] || r.datos_sensibles}
                  </Pill>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 whitespace-nowrap text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
function Pill({ children, warn }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        warn
          ? "bg-[#FCE9E0] text-[#A6502E]"
          : "bg-alzak-accent-tint text-alzak-accent-dark"
      }`}
    >
      {children}
    </span>
  );
}
function NpsBadge({ value }) {
  const v = Number(value) || 0;
  let cls = "bg-[#FCE9E0] text-[#A6502E]";
  if (v >= 9) cls = "bg-alzak-accent-tint text-alzak-accent-dark";
  else if (v >= 7) cls = "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${cls}`}>
      {v}
    </span>
  );
}

/* ─────────────────── Export ─────────────────── */

function ExportSection({ rows }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-8">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-alzak-gradient-accent px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          <DownloadIcon /> Exportar reporte
        </button>
      </div>
      {open && <ExportPreviewModal rows={rows} onClose={() => setOpen(false)} />}
    </>
  );
}

function ExportPreviewModal({ rows, onClose }) {
  const [downloading, setDownloading] = useState(null);

  // Resumen
  const total = rows.length;
  const ahorro = rows.reduce((a, r) => a + (r.ahorro_horas || 0), 0);
  const nps = total
    ? (rows.reduce((a, r) => a + (r.nps || 0), 0) / total).toFixed(1)
    : "0";
  const personales = rows.filter((r) => r.tipo_cuenta === "personal").length;
  const personalesPct = total ? Math.round((personales / total) * 100) : 0;
  const adopcion = rows.filter((r) => r.frecuencia !== "nunca").length;
  const adopcionPct = total ? Math.round((adopcion / total) * 100) : 0;

  const PREVIEW_LIMIT = 8;
  const previewRows = rows.slice(0, PREVIEW_LIMIT);

  const handleCSV = async () => {
    setDownloading("csv");
    try {
      const Papa = (await import("papaparse")).default;
      const csv = Papa.unparse(
        rows.map((r) => ({
          "Fecha respuesta": formatDate(r.enviado_en),
          Nombre: r.nombre,
          Email: r.email,
          Cargo: r.cargo,
          Departamento: r.departamento,
          Frecuencia: FREQ_LABELS[r.frecuencia] || r.frecuencia,
          Tareas: (r.tareas || []).join("; "),
          "Ahorro horas/sem": r.ahorro_horas,
          Plan: PLAN_LABELS[r.plan_actual] || r.plan_actual,
          "Tipo de cuenta": ACCOUNT_LABELS[r.tipo_cuenta] || r.tipo_cuenta,
          "Choca límites": LIMITS_LABELS[r.choca_limites] || r.choca_limites,
          NPS: r.nps,
          "Datos sensibles": SENSITIVE_LABELS[r.datos_sensibles] || r.datos_sensibles,
          Bloqueadores: r.bloqueadores || "",
          Sugerencias: r.sugerencias || "",
        })),
        { quotes: true }
      );
      // BOM para que Excel detecte UTF-8
      download(`alzak-evaluacion-claude-${todayStamp()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
    } finally {
      setDownloading(null);
    }
  };

  const handlePDF = async () => {
    setDownloading("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default || autoTableModule.autoTable;

      // Cargar logos como data URLs (PNG)
      const [alzakLogo, claudeLogo] = await Promise.all([
        imageToPngDataUrl("/logos/alzak.webp"),
        svgToPngDataUrl(CLAUDE_LOGO_SVG, 380, 100),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Banda verde superior (ALZAK accent)
      doc.setFillColor(0, 166, 94);
      doc.rect(0, 0, pageWidth, 6, "F");

      // Encabezado con fondo blanco
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 6, pageWidth, 90, "F");

      // Logo ALZAK (izquierda)
      doc.addImage(alzakLogo, "PNG", 40, 22, 110, 55);

      // Separador "×"
      doc.setTextColor(180, 180, 180);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(22);
      doc.text("×", 168, 56);

      // Logo Claude (al lado)
      doc.addImage(claudeLogo, "PNG", 188, 30, 152, 40);

      // Línea de subtítulo institucional
      doc.setDrawColor(0, 166, 94);
      doc.setLineWidth(0.6);
      doc.line(40, 96, pageWidth - 40, 96);

      // Título a la derecha
      doc.setTextColor(0, 59, 92);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Evaluación de uso de Claude AI", pageWidth - 40, 50, { align: "right" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Reporte generado el ${formatDate(new Date().toISOString())}`,
        pageWidth - 40,
        66,
        { align: "right" }
      );
      doc.text(`Confidencial · Uso interno`, pageWidth - 40, 80, { align: "right" });

      // Bloque de KPIs
      const kpiY = 116;
      const kpiBoxW = (pageWidth - 80) / 4;
      const kpis = [
        { label: "Respuestas", value: String(total) },
        { label: "Ahorro total", value: `${ahorro} h/sem` },
        { label: "NPS promedio", value: `${nps}/10` },
        { label: "Cuentas personales", value: `${personalesPct}%` },
      ];
      kpis.forEach((k, i) => {
        const x = 40 + i * kpiBoxW;
        doc.setFillColor(248, 251, 253);
        doc.roundedRect(x + 4, kpiY, kpiBoxW - 8, 50, 6, 6, "F");
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(k.label.toUpperCase(), x + 16, kpiY + 18);
        doc.setTextColor(0, 59, 92);
        doc.setFontSize(16);
        doc.text(k.value, x + 16, kpiY + 40);
      });

      // Tabla
      autoTable(doc, {
        startY: kpiY + 70,
        head: [
          [
            "Fecha respuesta",
            "Nombre",
            "Email",
            "Cargo",
            "Depto",
            "Frec.",
            "Ahorro",
            "Plan",
            "Cuenta",
            "Límites",
            "NPS",
            "Sensibles",
          ],
        ],
        body: rows.map((r) => [
          formatDate(r.enviado_en),
          r.nombre,
          r.email,
          r.cargo,
          r.departamento,
          FREQ_LABELS[r.frecuencia] || r.frecuencia,
          `${r.ahorro_horas}h`,
          PLAN_LABELS[r.plan_actual] || r.plan_actual,
          ACCOUNT_LABELS[r.tipo_cuenta] || r.tipo_cuenta,
          LIMITS_LABELS[r.choca_limites] || r.choca_limites,
          r.nps,
          SENSITIVE_LABELS[r.datos_sensibles] || r.datos_sensibles,
        ]),
        styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59] },
        headStyles: { fillColor: [0, 59, 92], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 251, 253] },
        margin: { left: 30, right: 30 },
      });

      // Pie de página
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(0, 166, 94);
        doc.rect(0, pageHeight - 18, pageWidth, 2, "F");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `ALZAK Foundation · Evaluación de Claude AI · Confidencial`,
          40,
          pageHeight - 8
        );
        doc.text(
          `Página ${i} de ${pages}`,
          pageWidth - 40,
          pageHeight - 8,
          { align: "right" }
        );
      }

      doc.save(`alzak-evaluacion-claude-${todayStamp()}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-alzak-primary/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden alzak-fadeup"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banda + Header co-brand */}
        <div className="h-1.5 w-full bg-alzak-gradient" />
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logos/alzak.webp"
              alt="ALZAK Foundation"
              width={140}
              height={70}
              className="h-9 w-auto"
            />
            <span className="text-lg font-light text-slate-300">×</span>
            <ClaudeLogo height={26} />
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-alzak-primary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-alzak-primary tracking-tight">
              Reporte · Evaluación de uso de Claude AI
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Previsualización del contenido a exportar.{" "}
              <span className="font-semibold text-alzak-primary">
                {rows.length} respuestas
              </span>{" "}
              incluidas según los filtros aplicados.
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PreviewKpi label="Respuestas" value={total} />
            <PreviewKpi label="Ahorro total" value={`${ahorro}h`} sub="por semana" />
            <PreviewKpi label="NPS promedio" value={nps} sub="/ 10" />
            <PreviewKpi
              label="Cuentas personales"
              value={`${personalesPct}%`}
              warn={personalesPct >= 30}
            />
          </div>

          <div className="rounded-2xl bg-alzak-bg border border-slate-100 p-4 text-xs text-slate-600 leading-relaxed">
            <strong className="text-alzak-primary">Resumen:</strong> {adopcionPct}%
            de adopción ({adopcion} de {total}). Personal: {personales} usuario
            {personales === 1 ? "" : "s"} ({personalesPct}%) en cuenta personal.
            Generado el {formatDate(new Date().toISOString())}.
          </div>

          {/* Tabla preview */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-alzak-bg border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Vista previa
              {rows.length > PREVIEW_LIMIT && ` (primeras ${PREVIEW_LIMIT} de ${rows.length})`}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left">
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2">Fecha respuesta</th>
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Depto</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Cuenta</th>
                    <th className="px-3 py-2">Ahorro</th>
                    <th className="px-3 py-2">NPS</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(r.enviado_en)}</td>
                      <td className="px-3 py-2 font-medium text-alzak-primary">{r.nombre}</td>
                      <td className="px-3 py-2 text-slate-600">{r.departamento}</td>
                      <td className="px-3 py-2 text-slate-600">{PLAN_LABELS[r.plan_actual] || r.plan_actual}</td>
                      <td className="px-3 py-2 text-slate-600">{ACCOUNT_LABELS[r.tipo_cuenta] || r.tipo_cuenta}</td>
                      <td className="px-3 py-2 font-semibold text-alzak-primary">{r.ahorro_horas}h</td>
                      <td className="px-3 py-2 font-bold text-alzak-primary">{r.nps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > PREVIEW_LIMIT && (
                <div className="px-4 py-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                  + {rows.length - PREVIEW_LIMIT} respuestas más en el archivo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-slate-100 px-7 py-4 bg-alzak-bg flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 hover:text-alzak-primary transition"
          >
            Cancelar
          </button>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCSV}
              disabled={downloading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-alzak-primary px-5 py-3 text-sm font-semibold text-alzak-primary transition hover:bg-alzak-primary hover:text-white disabled:opacity-50"
            >
              <DownloadIcon />
              {downloading === "csv" ? "Generando CSV..." : "Descargar CSV"}
            </button>
            <button
              onClick={handlePDF}
              disabled={downloading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-alzak-gradient-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
            >
              <DownloadIcon />
              {downloading === "pdf" ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewKpi({ label, value, sub, warn }) {
  const valueClass = warn ? "text-[#D97757]" : "text-alzak-primary";
  return (
    <div className="rounded-2xl bg-alzak-bg border border-slate-100 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
        {sub && <span className="text-xs font-medium ml-1 opacity-60">{sub}</span>}
      </div>
    </div>
  );
}

/* ─────────── Helpers para embed de imágenes en PDF ─────────── */

const CLAUDE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 100">
  <g transform="translate(50,50)" fill="#D97757">
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(32.727)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(65.455)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(98.182)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(130.909)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(163.636)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(196.364)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(229.091)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(261.818)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(294.545)" />
    <ellipse cx="0" cy="-30" rx="3.2" ry="22" transform="rotate(327.273)" />
  </g>
  <text x="115" y="68" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="700" fill="#181818">Claude</text>
</svg>`;

function imageToPngDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function svgToPngDataUrl(svgString, width, height) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Doble resolución para mejor render en PDF
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
    </svg>
  );
}

/* ─────────────────── Helpers ─────────────────── */

function countBy(rows, key) {
  const map = {};
  rows.forEach((r) => {
    const v = r[key] || "—";
    map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────── States ─────────────────── */

function Loader() {
  return (
    <div className="flex items-center justify-center py-24">
      <svg className="h-10 w-10 animate-spin text-alzak-accent" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
      <p className="text-sm font-medium text-red-700">
        Error al cargar las respuestas: {message}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-12 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-alzak-accent-tint">
        <svg className="h-8 w-8 text-alzak-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4M7 7h10M7 11h4" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-alzak-primary mb-2">
        Sin respuestas todavía
      </h3>
      <p className="text-sm text-slate-500">
        Cuando empiecen a llegar respuestas del formulario, aparecerán aquí.
      </p>
    </div>
  );
}
