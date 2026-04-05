import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Search,
  Send,
  Shield,
  TerminalSquare,
  Workflow,
  XCircle,
} from 'lucide-react';
import { useBotStore } from '../store/botStore';

const suggestionTone = {
  cyan: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100 hover:bg-cyan-400/12',
  violet: 'border-violet-400/20 bg-violet-400/8 text-violet-100 hover:bg-violet-400/12',
  emerald: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100 hover:bg-emerald-400/12',
  amber: 'border-amber-400/20 bg-amber-400/8 text-amber-100 hover:bg-amber-400/12',
};

const suggestions = [
  {
    text: 'Ejecutar analisis de seguridad en todos los grupos con prioridad critica.',
    tone: 'amber' as const,
    icon: Shield,
  },
  {
    text: 'Optimizar el rendimiento del grupo Alpha y generar un resumen de mejoras.',
    tone: 'cyan' as const,
    icon: Workflow,
  },
  {
    text: 'Analizar logs recientes y reportar incidencias abiertas.',
    tone: 'violet' as const,
    icon: Search,
  },
  {
    text: 'Preparar pruebas automaticas en Charlie y enviar estado cuando termine.',
    tone: 'emerald' as const,
    icon: CheckCircle2,
  },
];

export const CommandInterface = () => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { executeCommand, commandLogs } = useBotStore();

  const processingCount = commandLogs.filter((log) => log.status === 'processing').length;
  const successCount = commandLogs.filter((log) => log.status === 'success').length;
  const errorCount = commandLogs.filter((log) => log.status === 'error').length;

  const handleCommand = async () => {
    if (!command.trim()) {
      return;
    }

    setIsProcessing(true);
    await executeCommand(command);
    setCommand('');

    window.setTimeout(() => {
      setIsProcessing(false);
    }, 900);
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'success':
        return {
          label: 'SUCCESS',
          icon: CheckCircle2,
          className: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
        };
      case 'error':
        return {
          label: 'ERROR',
          icon: XCircle,
          className: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
        };
      default:
        return {
          label: 'PROCESSING',
          icon: LoaderCircle,
          className: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
        };
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel panel-glow rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <TerminalSquare className="h-4 w-4" />
              Centro de comando
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-gradient">Ordenes naturales, interfaz mas clara</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Cambie esta vista para que las sugerencias sirvan como punto de partida real, el cuadro de entrada
              respire mejor y el historial no se sienta amontonado.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon;

                return (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => setCommand(suggestion.text)}
                    className={`rounded-2xl border p-4 text-left transition ${suggestionTone[suggestion.tone]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-3">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">Usar ejemplo</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{suggestion.text}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                label: 'En curso',
                value: processingCount.toLocaleString(),
                detail: 'Ordenes que siguen abiertas',
                tone: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
              },
              {
                label: 'Exitos',
                value: successCount.toLocaleString(),
                detail: 'Respuestas positivas del sistema',
                tone: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
              },
              {
                label: 'Incidencias',
                value: errorCount.toLocaleString(),
                detail: 'Ordenes sin recursos disponibles',
                tone: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Redactar orden</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Pulsa Enter para ejecutar o Shift + Enter para salto de linea.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">
                    {isProcessing ? 'Preparando orden...' : 'Listo para enviar'}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] border border-white/8 bg-slate-950/70 p-4">
                <textarea
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleCommand();
                    }
                  }}
                  placeholder="Ejemplo: Prioridad critica para Alpha, revisar seguridad, reasignar bots libres y reportar al finalizar."
                  className="h-40 w-full resize-none bg-transparent text-base leading-7 text-slate-100 outline-none placeholder:text-slate-500"
                />

                <div className="mt-4 flex flex-col gap-3 border-t border-white/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full pill-soft px-3 py-2">critica o urgente = prioridad alta</span>
                      <span className="rounded-full pill-soft px-3 py-2">importante = prioridad media-alta</span>
                      <span className="rounded-full pill-soft px-3 py-2">grupo + nombre = asignacion dirigida</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCommand()}
                    disabled={!command.trim() || isProcessing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/12 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Ejecutar orden
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/4 p-5">
              <h4 className="text-lg font-semibold text-slate-100">Ayuda rapida</h4>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/8 p-4">
                  Las ordenes ahora actualizan el registro con exito, error o progreso real.
                </div>
                <div className="rounded-2xl border border-violet-400/18 bg-violet-400/8 p-4">
                  El mapeo de grupos ya usa IDs correctos como <code>GRP-01</code> o <code>GRP-02</code>.
                </div>
                <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">
                  Los bots terminan una orden y vuelven a estar disponibles para la siguiente cola.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 p-3">
              <Clock3 className="h-5 w-5 text-violet-100" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-100">Registro de comandos</h3>
              <p className="mt-1 text-sm text-slate-400">Historial mas limpio y facil de escanear.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {commandLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-5 py-10 text-center text-sm text-slate-400">
                No hay comandos enviados aun.
              </div>
            ) : (
              commandLogs.map((log, index) => {
                const meta = getStatusMeta(log.status);
                const Icon = meta.icon;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="rounded-2xl border border-white/8 bg-white/4 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${meta.className}`}>
                            <Icon className={`h-4 w-4 ${log.status === 'processing' ? 'animate-spin' : ''}`} />
                            {meta.label}
                          </span>
                          <span className="text-xs text-slate-400">{log.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-100">{log.command}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{log.response}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
