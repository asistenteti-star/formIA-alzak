"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ClaudeLogo from "./_components/ClaudeLogo";

// Genera un UUID que sirve de submission_id (idempotencia server-side).
const newSubmissionId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const DEPARTMENTS = ["Investigación", "Salud Pública", "IT", "Administración"];

const FREQUENCY_OPTIONS = [
  { value: "diario", label: "Diariamente", desc: "Lo uso todos los días" },
  { value: "semanal", label: "Semanalmente", desc: "Varias veces por semana" },
  { value: "ocasional", label: "Ocasionalmente", desc: "Algunas veces al mes" },
  { value: "nunca", label: "Aún no lo uso", desc: "No he tenido oportunidad" },
];

const TASK_OPTIONS = [
  "Redacción de informes y documentos",
  "Análisis de datos y estadística",
  "Investigación bibliográfica",
  "Traducción y corrección de textos",
  "Generación de código y automatización",
  "Resumen de reuniones o transcripciones",
  "Atención al usuario / soporte interno",
  "Diseño de propuestas y proyectos",
];

const PLAN_OPTIONS = [
  { value: "free", label: "Free", desc: "Plan gratuito" },
  { value: "pro", label: "Pro", desc: "Suscripción individual" },
  { value: "team", label: "Team", desc: "Plan corporativo de equipo" },
  { value: "enterprise", label: "Enterprise", desc: "Plan empresarial" },
  { value: "ninguno", label: "No tengo cuenta", desc: "Aún no me he registrado" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "corporativa", label: "Corporativa", desc: "Con correo @alzakfoundation.org" },
  { value: "personal", label: "Personal", desc: "Con correo personal (@gmail, etc.)" },
  { value: "ninguna", label: "No tengo cuenta", desc: "—" },
];

const LIMITS_OPTIONS = [
  { value: "si", label: "Sí, frecuentemente" },
  { value: "aveces", label: "A veces" },
  { value: "no", label: "Nunca" },
  { value: "na", label: "No aplica / no tengo cuenta" },
];

const SENSITIVE_OPTIONS = [
  { value: "nunca", label: "Nunca" },
  { value: "aveces", label: "A veces" },
  { value: "frecuentemente", label: "Frecuentemente" },
];

const initialState = {
  // Identificación
  nombre: "",
  email: "",
  cargo: "",
  departamento: "",
  // Uso
  frecuencia: "",
  tareas: [],
  ahorroHoras: 5,
  // Cuenta y plan
  planActual: "",
  tipoCuenta: "",
  chocaLimites: "",
  // Calidad y gobernanza
  nps: 8,
  datosSensibles: "",
  bloqueadores: "",
  sugerencias: "",
};

export default function HomePage() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  // submissionId: un UUID por sesión de formulario. Se renueva al resetear.
  // Combinado con UNIQUE en DB hace que cualquier reintento sea idempotente.
  const submissionIdRef = useRef(newSubmissionId());

  // Guard síncrono: bloquea doble clics rápidos antes de que setState aplique.
  const submittingRef = useRef(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleTask = (task) => {
    setForm((prev) => {
      const exists = prev.tareas.includes(task);
      return {
        ...prev,
        tareas: exists
          ? prev.tareas.filter((t) => t !== task)
          : [...prev.tareas, task],
      };
    });
    if (errors.tareas) setErrors((prev) => ({ ...prev, tareas: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "Por favor ingresa tu nombre.";
    if (!form.email.trim()) {
      newErrors.email = "El email es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Ingresa un email válido.";
    }
    if (!form.cargo.trim()) newErrors.cargo = "Indica tu cargo.";
    if (!form.departamento) newErrors.departamento = "Selecciona un departamento.";
    if (!form.frecuencia) newErrors.frecuencia = "Selecciona la frecuencia de uso.";
    if (form.tareas.length === 0)
      newErrors.tareas = "Selecciona al menos una tarea principal.";
    if (!form.planActual) newErrors.planActual = "Selecciona el plan que usas.";
    if (!form.tipoCuenta) newErrors.tipoCuenta = "Selecciona el tipo de cuenta.";
    if (!form.chocaLimites)
      newErrors.chocaLimites = "Selecciona una opción.";
    if (!form.datosSensibles)
      newErrors.datosSensibles = "Selecciona una opción.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard síncrono: bloquea cualquier clic adicional incluso antes de que
    // el render con disabled=true llegue al DOM.
    if (submittingRef.current) return;

    if (!validate()) {
      const firstError = document.querySelector("[data-has-error='true']");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ahorroHoras: Number(form.ahorroHoras),
          nps: Number(form.nps),
          submissionId: submissionIdRef.current,
          enviadoEn: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error en el envío");
      }
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      submittingRef.current = false;
    }
  };

  const resetForm = () => {
    setForm(initialState);
    setErrors({});
    setStatus("idle");
    // Nuevo UUID para que el siguiente envío se considere un registro nuevo
    submissionIdRef.current = newSubmissionId();
    submittingRef.current = false;
  };

  if (status === "success") return <SuccessScreen onReset={resetForm} />;

  const ahorroLabel =
    form.ahorroHoras >= 15 ? "15+ horas" : `${form.ahorroHoras} horas`;
  const rangePct = (form.ahorroHoras / 15) * 100;
  const npsPct = (form.nps / 10) * 100;

  return (
    <main className="min-h-screen w-full">
      <div className="h-1.5 w-full bg-alzak-gradient" />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Header />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-[2rem] shadow-card p-7 sm:p-12 alzak-fadeup"
        >
          <PrivacyNotice />

          {/* ── Sección 1: Identificación ── */}
          <Section
            number="01"
            title="Tu información"
            description="Necesitamos identificarte para hacer seguimiento de la adopción por equipo."
          >
            <Field
              label="Nombre completo"
              required
              error={errors.nombre}
              htmlFor="nombre"
            >
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                placeholder="Ej. María González"
              />
            </Field>

            <Field
              label="Email institucional"
              required
              error={errors.email}
              htmlFor="email"
              hint="Preferiblemente tu correo @alzakfoundation.org"
            >
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="tunombre@alzakfoundation.org"
              />
            </Field>

            <Field
              label="Cargo"
              required
              error={errors.cargo}
              htmlFor="cargo"
            >
              <Input
                id="cargo"
                value={form.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                placeholder="Ej. Coordinadora de Investigación"
              />
            </Field>

            <Field
              label="Departamento"
              required
              error={errors.departamento}
              htmlFor="departamento"
            >
              <Select
                id="departamento"
                value={form.departamento}
                onChange={(e) => handleChange("departamento", e.target.value)}
              >
                <option value="">Selecciona un departamento</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
          </Section>

          {/* ── Sección 2: Uso ── */}
          <Section
            number="02"
            title="Cómo usas Claude AI"
            description="Cuéntanos sobre tu interacción cotidiana con la herramienta."
          >
            <Field
              label="Frecuencia de uso"
              required
              error={errors.frecuencia}
            >
              <RadioGrid
                options={FREQUENCY_OPTIONS}
                value={form.frecuencia}
                onChange={(v) => handleChange("frecuencia", v)}
                name="frecuencia"
              />
            </Field>

            <Field
              label="Tareas principales en las que usas (o usarías) Claude AI"
              required
              error={errors.tareas}
              hint="Selecciona todas las que apliquen"
            >
              <CheckboxGrid
                options={TASK_OPTIONS}
                values={form.tareas}
                onToggle={toggleTask}
              />
            </Field>

            <Field
              label="Ahorro de tiempo semanal estimado"
              hint="Mueve la barra para indicar cuántas horas a la semana te ahorra Claude AI"
            >
              <RangeBox
                value={form.ahorroHoras}
                onChange={(e) => handleChange("ahorroHoras", e.target.value)}
                pct={rangePct}
                displayValue={ahorroLabel}
                unit="Horas / semana"
                min={0}
                max={15}
                step={1}
                marks={["0 h", "5 h", "10 h", "15+ h"]}
                ariaLabel="Ahorro de horas semanales"
              />
            </Field>
          </Section>

          {/* ── Sección 3: Cuenta y plan ── */}
          <Section
            number="03"
            title="Tu cuenta y plan"
            description="Esta información nos ayuda a dimensionar las licencias que la fundación necesita."
          >
            <Field
              label="¿Qué plan usas actualmente?"
              required
              error={errors.planActual}
            >
              <RadioGrid
                options={PLAN_OPTIONS}
                value={form.planActual}
                onChange={(v) => handleChange("planActual", v)}
                name="planActual"
                cols={2}
              />
            </Field>

            <Field
              label="¿Tu cuenta es corporativa o personal?"
              required
              error={errors.tipoCuenta}
            >
              <RadioGrid
                options={ACCOUNT_TYPE_OPTIONS}
                value={form.tipoCuenta}
                onChange={(v) => handleChange("tipoCuenta", v)}
                name="tipoCuenta"
              />
            </Field>

            <Field
              label="¿Has chocado con límites de uso (mensajes, contexto, modelos)?"
              required
              error={errors.chocaLimites}
            >
              <RadioGrid
                options={LIMITS_OPTIONS}
                value={form.chocaLimites}
                onChange={(v) => handleChange("chocaLimites", v)}
                name="chocaLimites"
                cols={2}
              />
            </Field>
          </Section>

          {/* ── Sección 4: Calidad y gobernanza ── */}
          <Section
            number="04"
            title="Calidad y gobernanza"
            description="Tu opinión y los aspectos de seguridad nos permiten tomar mejores decisiones."
          >
            <Field
              label="¿Qué tan probable es que recomiendes Claude AI a un colega? (0–10)"
              hint="0 = no lo recomendaría · 10 = lo recomiendo sin duda"
            >
              <RangeBox
                value={form.nps}
                onChange={(e) => handleChange("nps", e.target.value)}
                pct={npsPct}
                displayValue={`${form.nps} / 10`}
                unit="Recomendación"
                min={0}
                max={10}
                step={1}
                marks={["0", "5", "10"]}
                ariaLabel="Probabilidad de recomendar"
              />
            </Field>

            <Field
              label="¿Has compartido datos sensibles, confidenciales o de pacientes con Claude?"
              required
              error={errors.datosSensibles}
              hint="Tu respuesta es confidencial — nos ayuda a planear capacitación, no a sancionar."
            >
              <RadioGrid
                options={SENSITIVE_OPTIONS}
                value={form.datosSensibles}
                onChange={(v) => handleChange("datosSensibles", v)}
                name="datosSensibles"
              />
            </Field>

            <Field
              label="Bloqueadores o problemas que has encontrado"
              hint="Opcional. Cualquier dificultad técnica, de acceso o de adopción."
              htmlFor="bloqueadores"
            >
              <Textarea
                id="bloqueadores"
                value={form.bloqueadores}
                onChange={(e) => handleChange("bloqueadores", e.target.value)}
                placeholder="Ej. Las respuestas en español a veces son inconsistentes..."
                rows={3}
              />
            </Field>

            <Field
              label="Sugerencias o casos de uso que te gustaría explorar"
              hint="Opcional. ¿Para qué más te gustaría usar Claude AI en la fundación?"
              htmlFor="sugerencias"
            >
              <Textarea
                id="sugerencias"
                value={form.sugerencias}
                onChange={(e) => handleChange("sugerencias", e.target.value)}
                placeholder="Ej. Automatizar la generación de informes mensuales..."
                rows={3}
              />
            </Field>
          </Section>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="group relative w-full rounded-2xl bg-alzak-gradient-accent px-6 py-5 text-base font-semibold text-white shadow-glow transition hover:brightness-110 hover:shadow-soft active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "submitting" ? (
                <span className="flex items-center justify-center gap-3">
                  <Spinner />
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Enviar evaluación
                  <svg
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              )}
            </button>

            {status === "error" && (
              <p className="mt-4 text-center text-sm font-medium text-red-600">
                Hubo un problema al enviar. Por favor intenta nuevamente.
              </p>
            )}
          </div>
        </form>

        <Footer />
      </div>
    </main>
  );
}

/* ──────────────── Componentes auxiliares ──────────────── */

function Header() {
  return (
    <header className="mb-10 text-center alzak-fadeup">
      <div className="mx-auto mb-7 flex items-center justify-center gap-5 sm:gap-6">
        <Image
          src="/logos/alzak.webp"
          alt="ALZAK Foundation"
          width={180}
          height={90}
          priority
          className="h-12 sm:h-14 w-auto"
        />
        <span className="text-2xl font-light text-slate-300 select-none">×</span>
        <ClaudeLogo height={40} />
      </div>
      <div className="inline-flex items-center gap-2 rounded-full bg-alzak-accent-tint px-4 py-1.5 mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-alzak-accent animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-alzak-accent-dark">
          Evaluación interna
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-alzak-primary leading-tight tracking-tight">
        Uso de Claude AI en la Fundación
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 leading-relaxed">
        Tu retroalimentación nos ayuda a evaluar el impacto, las licencias y la
        factibilidad del servicio en cada equipo de ALZAK Foundation.
      </p>
    </header>
  );
}

function PrivacyNotice() {
  return (
    <div className="mb-10 flex items-start gap-3 rounded-2xl bg-alzak-bg border border-slate-100 p-4">
      <svg
        className="h-5 w-5 flex-shrink-0 text-alzak-accent mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="text-xs text-slate-600 leading-relaxed">
        <strong className="text-alzak-primary">Confidencial.</strong> Tus
        respuestas se usarán exclusivamente para la evaluación interna del
        servicio y no se compartirán fuera del equipo de gerencia.
      </div>
    </div>
  );
}

function Section({ number, title, description, children }) {
  return (
    <section className="mb-12 last:mb-0 space-y-7">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-bold tracking-widest text-alzak-accent">
            {number}
          </span>
          <h2 className="text-xl font-bold text-alzak-primary tracking-tight">
            {title}
          </h2>
        </div>
        {description && (
          <p className="mt-1.5 ml-9 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, error, hint, htmlFor, children }) {
  return (
    <div data-has-error={!!error}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-alzak-primary"
      >
        {label}
        {required && <span className="ml-1 text-alzak-accent">*</span>}
      </label>
      {hint && !error && <p className="mb-3 text-xs text-slate-500">{hint}</p>}
      {children}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function Input(props) {
  return (
    <input
      type="text"
      {...props}
      className="w-full rounded-2xl border-2 border-slate-100 bg-alzak-bg px-5 py-4 text-alzak-primary placeholder-slate-400 focus:border-alzak-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-alzak-accent/15 transition"
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border-2 border-slate-100 bg-alzak-bg px-5 py-4 text-alzak-primary focus:border-alzak-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-alzak-accent/15 transition appearance-none"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23003B5C' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1.25rem center",
        backgroundSize: "1.25rem",
        paddingRight: "3rem",
      }}
    >
      {children}
    </select>
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-2xl border-2 border-slate-100 bg-alzak-bg px-5 py-4 text-alzak-primary placeholder-slate-400 focus:border-alzak-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-alzak-accent/15 transition resize-none"
    />
  );
}

function RadioGrid({ options, value, onChange, name, cols = 2 }) {
  const gridClass = cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-3`}>
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 rounded-2xl px-5 py-4 cursor-pointer border-2 transition ${
              checked
                ? "border-alzak-accent bg-alzak-accent-tint"
                : "border-slate-100 bg-alzak-bg hover:border-alzak-accent/40 hover:bg-white"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
                checked ? "border-alzak-accent bg-alzak-accent" : "border-slate-300"
              }`}
            >
              {checked && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-alzak-primary leading-tight">
                {opt.label}
              </span>
              {opt.desc && (
                <span className="text-xs text-slate-500 mt-0.5">{opt.desc}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxGrid({ options, values, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((task) => {
        const checked = values.includes(task);
        return (
          <label
            key={task}
            className={`flex items-start gap-3 rounded-2xl px-5 py-4 cursor-pointer border-2 transition ${
              checked
                ? "border-alzak-accent bg-alzak-accent-tint"
                : "border-slate-100 bg-alzak-bg hover:border-alzak-accent/40 hover:bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(task)}
              className="sr-only"
            />
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                checked ? "border-alzak-accent bg-alzak-accent" : "border-slate-300 bg-white"
              }`}
            >
              {checked && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium text-alzak-primary leading-snug">
              {task}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function RangeBox({
  value,
  onChange,
  pct,
  displayValue,
  unit,
  min,
  max,
  step,
  marks,
  ariaLabel,
}) {
  return (
    <div className="rounded-2xl bg-alzak-bg border-2 border-slate-100 p-6">
      <div className="mb-6 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {unit}
        </span>
        <span className="text-3xl font-bold text-alzak-primary tabular-nums">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="alzak-range w-full"
        style={{ "--value": `${pct}%` }}
        aria-label={ariaLabel}
      />
      <div className="mt-3 flex justify-between text-xs font-medium text-slate-400">
        {marks.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function SuccessScreen({ onReset }) {
  const COUNTDOWN_SECONDS = 8;
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onReset();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, onReset]);

  const progressPct = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4 py-12">
      <div className="h-1.5 w-full bg-alzak-gradient absolute top-0 left-0" />
      <div className="w-full max-w-xl alzak-fadeup">
        <div className="bg-white rounded-[2rem] shadow-card p-10 sm:p-14 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center gap-4">
            <Image
              src="/logos/alzak.webp"
              alt="ALZAK Foundation"
              width={140}
              height={70}
              className="h-10 w-auto"
            />
            <span className="text-xl font-light text-slate-300">×</span>
            <ClaudeLogo height={32} />
          </div>
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-alzak-accent-tint">
            <svg
              className="h-10 w-10 text-alzak-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-alzak-primary mb-4 tracking-tight">
            ¡Gracias por diligenciar el formulario!
          </h2>
          <p className="text-slate-500 leading-relaxed mb-8 max-w-md mx-auto">
            Tu respuesta ha sido registrada con éxito. La información que
            compartiste nos ayudará a tomar mejores decisiones sobre el uso de
            Claude AI en ALZAK Foundation.
          </p>

          {/* Countdown auto-reset */}
          <div className="mb-6 rounded-2xl bg-alzak-bg border border-slate-100 p-4">
            <p className="text-xs text-slate-500 mb-2">
              El formulario se reiniciará automáticamente en{" "}
              <span className="font-bold text-alzak-primary tabular-nums">
                {secondsLeft}s
              </span>{" "}
              para un nuevo registro
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-alzak-accent transition-all duration-1000 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-alzak-gradient-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            Reiniciar ahora
            <svg
              className="h-4 w-4"
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
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ALZAK Foundation · Uso interno
        </p>
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-10 text-center">
      <div className="mx-auto h-px w-24 bg-slate-200 mb-4" />
      <p className="text-xs text-slate-400">
        © {new Date().getFullYear()} ALZAK Foundation · Formulario interno
      </p>
    </footer>
  );
}
