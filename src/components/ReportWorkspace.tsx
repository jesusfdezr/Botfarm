import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  FileText,
  Link2,
  Plus,
  Search,
  ShieldAlert,
} from 'lucide-react';

type ReportReason =
  | 'spam'
  | 'abusive_behavior'
  | 'impersonation'
  | 'sensitive_media'
  | 'self_harm'
  | 'other_violation';

type TargetMode = 'account_url' | 'user_id' | 'handle';

interface ReportDraft {
  id: string;
  targetMode: TargetMode;
  targetValue: string;
  reason: ReportReason;
  analystBots: number;
  notes: string;
  createdAt: number;
}

const reasonOptions: Array<{
  value: ReportReason;
  label: string;
  description: string;
}> = [
  {
    value: 'spam',
    label: 'Spam o abuso del sistema',
    description: 'Para cuentas que violan reglas sin un post concreto o hacen spam sistematico.',
  },
  {
    value: 'abusive_behavior',
    label: 'Comportamiento abusivo',
    description: 'Acoso, amenazas, insultos o conductas dañinas.',
  },
  {
    value: 'impersonation',
    label: 'Suplantacion',
    description: 'Cuenta que se hace pasar por otra persona, marca u organizacion.',
  },
  {
    value: 'sensitive_media',
    label: 'Contenido sensible o sexual',
    description: 'Media sensible, desnudos no consentidos u otra violacion de esa categoria.',
  },
  {
    value: 'self_harm',
    label: 'Autolesion o riesgo',
    description: 'Contenido relacionado con riesgo de autolesion o suicidio.',
  },
  {
    value: 'other_violation',
    label: 'Otra infraccion',
    description: 'Cuando el caso requiere el formulario o flujo general de X.',
  },
];

const targetModeLabels: Record<TargetMode, string> = {
  account_url: 'URL de cuenta',
  user_id: 'User ID',
  handle: 'Handle',
};

const buildManualReportUrl = (targetMode: TargetMode, targetValue: string) => {
  const cleanValue = targetValue.trim();
  if (!cleanValue) {
    return 'https://help.x.com/en/forms';
  }

  if (targetMode === 'account_url') {
    return cleanValue;
  }

  if (targetMode === 'handle') {
    const handle = cleanValue.replace(/^@/, '');
    return `https://x.com/${handle}`;
  }

  return `https://help.x.com/en/forms`;
};

export const ReportWorkspace = () => {
  const [targetMode, setTargetMode] = useState<TargetMode>('account_url');
  const [targetValue, setTargetValue] = useState('');
  const [reason, setReason] = useState<ReportReason>('spam');
  const [analystBots, setAnalystBots] = useState(5);
  const [notes, setNotes] = useState('');
  const [queue, setQueue] = useState<ReportDraft[]>([]);

  const selectedReason = useMemo(
    () => reasonOptions.find((option) => option.value === reason) ?? reasonOptions[0],
    [reason],
  );

  const addToQueue = () => {
    const trimmedTarget = targetValue.trim();
    if (!trimmedTarget) {
      return;
    }

    const entry: ReportDraft = {
      id: crypto.randomUUID(),
      targetMode,
      targetValue: trimmedTarget,
      reason,
      analystBots: Math.max(1, analystBots),
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    setQueue((current) => [entry, ...current].slice(0, 20));
    setNotes('');
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="panel rounded-[30px] p-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-3">
              <ShieldAlert className="h-5 w-5 text-rose-100" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Cola de reporte</h3>
              <p className="mt-1 text-sm text-slate-400">
                Prepara casos con bots analistas, objetivo y motivo antes de enviarlos por el flujo correcto de X.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Formato de destino</span>
              <select
                value={targetMode}
                onChange={(event) => setTargetMode(event.target.value as TargetMode)}
                className="w-full rounded-2xl border border-white/8 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
              >
                <option value="account_url">URL de cuenta</option>
                <option value="handle">Handle</option>
                <option value="user_id">User ID</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Bots analistas</span>
              <div className="relative">
                <Bot className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={analystBots}
                  onChange={(event) => setAnalystBots(Number(event.target.value) || 1)}
                  className="w-full rounded-2xl border border-white/8 bg-slate-950/75 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                />
              </div>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm text-slate-300">{targetModeLabels[targetMode]}</span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
                placeholder={
                  targetMode === 'account_url'
                    ? 'https://x.com/cuenta'
                    : targetMode === 'handle'
                      ? '@cuenta'
                      : '123456789'
                }
                className="w-full rounded-2xl border border-white/8 bg-slate-950/75 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
              />
            </div>
          </label>

          <label className="mt-4 block space-y-2">
            <span className="text-sm text-slate-300">Motivo permitido por X</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="w-full rounded-2xl border border-white/8 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
            >
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 p-4 text-sm leading-6 text-slate-300">
            <p className="font-medium text-slate-100">{selectedReason.label}</p>
            <p className="mt-2">{selectedReason.description}</p>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-sm text-slate-300">Notas o evidencia</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Posts relevantes, contexto, enlaces y observaciones para el caso."
              className="h-32 w-full rounded-2xl border border-white/8 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addToQueue}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/24 bg-cyan-400/12 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/18"
            >
              <Plus className="h-4 w-4" />
              Añadir a cola
            </button>

            <a
              href={buildManualReportUrl(targetMode, targetValue)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/6"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir destino
            </a>

            <a
              href="https://help.x.com/en/forms"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/6"
            >
              <FileText className="h-4 w-4" />
              Abrir formulario de X
            </a>
          </div>
        </div>
      </div>

      <div className="panel rounded-[30px] p-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3">
              <Search className="h-5 w-5 text-cyan-100" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Casos preparados</h3>
              <p className="mt-1 text-sm text-slate-400">
                Los bots pueden analizar y priorizar casos; el envio debe usar el flujo correcto de X segun el motivo.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-400/18 bg-amber-400/8 p-4 text-sm leading-6 text-slate-300">
            X expone API documentada para reportar spam de cuenta, pero para otras categorias dirige al flujo de reporte
            in-app o formularios de ayuda.
          </div>

          <div className="mt-6 space-y-3">
            {queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-5 py-10 text-center text-sm text-slate-400">
                Aun no hay cuentas añadidas a la cola de reporte.
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-3 py-1 text-xs font-medium text-cyan-100">
                          {targetModeLabels[item.targetMode]}
                        </span>
                        <span className="rounded-full border border-rose-400/20 bg-rose-400/8 px-3 py-1 text-xs font-medium text-rose-100">
                          {reasonOptions.find((option) => option.value === item.reason)?.label ?? item.reason}
                        </span>
                      </div>
                      <p className="mt-3 break-all text-sm font-medium text-slate-100">{item.targetValue}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Bots analistas: {item.analystBots} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                      {item.notes ? <p className="mt-3 text-sm leading-6 text-slate-300">{item.notes}</p> : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-rose-400/18 bg-rose-400/8 p-4 text-sm leading-6 text-slate-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-100" />
              <p>
                Automatizar reportes en masa o coordinados puede infringir las reglas de autenticidad y uso de reportes
                de X. Este panel deja el caso preparado sin fingir una API general que X no ofrece.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
