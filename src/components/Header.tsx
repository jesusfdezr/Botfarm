import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useBotStore } from '../store/botStore';

export const Header = () => {
  const { groups, tasks, getStats } = useBotStore();
  const stats = getStats();
  const activeGroups = groups.filter((group) => group.status === 'active').length;
  const liveQueue = tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;
  const loadShare = stats.totalBots > 0 ? (stats.activeBots / stats.totalBots) * 100 : 0;

  const quickStats = [
    {
      label: 'Bots activos',
      value: stats.activeBots.toLocaleString(),
      detail: `${stats.totalBots.toLocaleString()} totales`,
      icon: Bot,
      tone: 'text-cyan-200',
      surface: 'border-cyan-400/20 bg-cyan-400/8',
    },
    {
      label: 'Grupos online',
      value: `${activeGroups}/${groups.length || 0}`,
      detail: 'Cobertura operativa',
      icon: Layers3,
      tone: 'text-violet-200',
      surface: 'border-violet-400/20 bg-violet-400/8',
    },
    {
      label: 'Exito global',
      value: `${stats.successRate.toFixed(1)}%`,
      detail: `${stats.completedTasks.toLocaleString()} tareas resueltas`,
      icon: CheckCircle2,
      tone: 'text-emerald-200',
      surface: 'border-emerald-400/20 bg-emerald-400/8',
    },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel panel-glow rounded-[30px] px-6 py-6 sm:px-7 sm:py-7"
    >
      <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_32px_rgba(106,230,255,0.12)]">
              <Bot className="h-7 w-7 text-cyan-100" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Dark Ops Control
              </div>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                <span className="text-gradient">Granja Bots Jerarquica</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Interfaz redisenada para que la operacion se sienta moderna, limpia y facil de supervisar
                incluso con una jerarquia grande y una cola de tareas intensa.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full pill-soft px-3 py-2">
              <Activity className="h-4 w-4 text-cyan-200" />
              Latencia visual estable
            </div>
            <div className="inline-flex items-center gap-2 rounded-full pill-soft px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-200" />
              Superficie oscura y legible
            </div>
            <div className="inline-flex items-center gap-2 rounded-full pill-soft px-3 py-2">
              <Zap className="h-4 w-4 text-amber-200" />
              Cola viva: {liveQueue.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-3xl">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`rounded-2xl border p-4 backdrop-blur ${stat.surface}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className={`mt-2 text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <Icon className={`h-5 w-5 ${stat.tone}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Capacidad ocupada</span>
            <span className="text-sm text-slate-100">{loadShare.toFixed(1)}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/6">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
              style={{ width: `${Math.max(loadShare, 4)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
          <p className="text-sm text-slate-300">Modo de supervision</p>
          <p className="mt-2 text-base font-medium text-slate-100">Vista clara, feedback rapido y cards consistentes</p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
          <p className="text-sm text-slate-300">Objetivo visual</p>
          <p className="mt-2 text-base font-medium text-slate-100">Oscuro, neon sobrio y sin contrastes agresivos</p>
        </div>
      </div>
    </motion.header>
  );
};
