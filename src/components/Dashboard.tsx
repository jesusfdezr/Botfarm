import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Layers3,
  Radar,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FarmBuilder } from './FarmBuilder';
import { useBotStore } from '../store/botStore';

const statusTone = {
  active: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  paused: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  maintenance: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
};

export const Dashboard = () => {
  const [isChartReady, setIsChartReady] = useState(false);
  const { bots, groups, tasks, getStats } = useBotStore();
  const stats = getStats();

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  const activeTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;
  const activeByGroup = groups.reduce<Record<string, number>>((accumulator, group) => {
    accumulator[group.id] = 0;
    return accumulator;
  }, {});

  const specializationCounts = bots.reduce<Record<string, number>>((accumulator, bot) => {
    accumulator[bot.specialization] = (accumulator[bot.specialization] ?? 0) + 1;
    if (bot.status === 'working') {
      activeByGroup[bot.groupId] = (activeByGroup[bot.groupId] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const groupSummaries = groups
    .map((group) => {
      const activeBots = activeByGroup[group.id] ?? 0;
      const taskLoad = tasks.filter((task) => task.assignedGroup === group.id).length;

      return {
        ...group,
        activeBots,
        taskLoad,
        loadPercent: group.totalBots > 0 ? (activeBots / group.totalBots) * 100 : 0,
      };
    })
    .sort((left, right) => right.activeBots - left.activeBots);

  const topSpecializations = Object.entries(specializationCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  const activitySeries = [
    { label: '-60m', load: Math.max(stats.activeBots - 34, 0), throughput: Math.max(stats.completedTasks - 9, 0) },
    { label: '-50m', load: Math.max(stats.activeBots - 26, 0), throughput: Math.max(stats.completedTasks - 7, 0) },
    { label: '-40m', load: Math.max(stats.activeBots - 18, 0), throughput: Math.max(stats.completedTasks - 5, 0) },
    { label: '-30m', load: Math.max(stats.activeBots - 11, 0), throughput: Math.max(stats.completedTasks - 3, 0) },
    { label: '-20m', load: Math.max(stats.activeBots - 6, 0), throughput: Math.max(stats.completedTasks - 2, 0) },
    { label: '-10m', load: Math.max(stats.activeBots - 3, 0), throughput: Math.max(stats.completedTasks - 1, 0) },
    { label: 'Ahora', load: stats.activeBots, throughput: stats.completedTasks },
  ];

  const kpis = [
    {
      label: 'Flota total',
      value: stats.totalBots.toLocaleString(),
      detail: `${stats.activeBots.toLocaleString()} ejecutando ahora`,
      icon: Bot,
      tone: 'text-cyan-200',
      surface: 'border-cyan-400/20 bg-cyan-400/8',
    },
    {
      label: 'Cola operativa',
      value: activeTasks.toLocaleString(),
      detail: `${tasks.length.toLocaleString()} tareas registradas`,
      icon: Activity,
      tone: 'text-amber-200',
      surface: 'border-amber-400/20 bg-amber-400/8',
    },
    {
      label: 'Exito',
      value: `${stats.successRate.toFixed(1)}%`,
      detail: `${stats.completedTasks.toLocaleString()} tareas completadas`,
      icon: CheckCircle2,
      tone: 'text-emerald-200',
      surface: 'border-emerald-400/20 bg-emerald-400/8',
    },
    {
      label: 'Cobertura',
      value: `${groups.filter((group) => group.status === 'active').length}/${groups.length || 0}`,
      detail: 'Grupos listos para asignacion',
      icon: Layers3,
      tone: 'text-violet-200',
      surface: 'border-violet-400/20 bg-violet-400/8',
    },
  ];

  return (
    <div className="space-y-6">
      <FarmBuilder />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`panel rounded-[26px] p-5 ${card.surface}`}
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{card.detail}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
                  <Icon className={`h-5 w-5 ${card.tone}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="panel rounded-[30px] p-6 sm:p-7"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full pill-soft px-3 py-2 text-xs text-slate-300">
                  <Radar className="h-4 w-4 text-cyan-200" />
                  Ritmo operativo
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-slate-100">Carga y throughput</h2>
                <p className="mt-2 text-sm text-slate-400">
                  La grafica usa el estado real actual para presentar una lectura compacta del sistema.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/16 bg-cyan-400/8 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Actividad</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-100">{stats.activeBots.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 h-[320px]">
              {isChartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activitySeries}>
                    <defs>
                      <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6ae6ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6ae6ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ac7cff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ac7cff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" stroke="#7e8aa7" tickLine={false} axisLine={false} />
                    <YAxis stroke="#7e8aa7" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid rgba(106,230,255,0.16)',
                        borderRadius: '18px',
                        backgroundColor: 'rgba(7,12,23,0.94)',
                        color: '#f5f7ff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="load"
                      stroke="#6ae6ff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#loadGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="#ac7cff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#throughputGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[24px] border border-white/6 bg-white/4" />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="panel rounded-[30px] p-6"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 p-3">
                <Sparkles className="h-5 w-5 text-violet-200" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Especializaciones dominantes</h3>
                <p className="mt-1 text-sm text-slate-400">Las mas frecuentes en toda la flota.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {topSpecializations.map(([specialization, count], index) => {
                const ratio = stats.totalBots > 0 ? (count / stats.totalBots) * 100 : 0;
                return (
                  <div key={specialization} className="rounded-2xl border border-white/6 bg-white/4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{specialization}</p>
                        <p className="mt-1 text-xs text-slate-400">Cluster {String(index + 1).padStart(2, '0')}</p>
                      </div>
                      <p className="text-lg font-semibold text-cyan-100">{count.toLocaleString()}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/6">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-500"
                        style={{ width: `${Math.max(ratio, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel rounded-[30px] p-6"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3">
                <BarChart3 className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Salud por grupo</h3>
                <p className="mt-1 text-sm text-slate-400">Carga real, estado y volumen de tareas.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {groupSummaries.map((group) => (
                <div key={group.id} className="rounded-2xl border border-white/6 bg-white/4 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-medium text-slate-100">{group.name}</p>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            statusTone[group.status]
                          }`}
                        >
                          {group.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {group.activeBots.toLocaleString()} activos de {group.totalBots.toLocaleString()} bots
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                      <span>Tareas: {group.taskLoad.toLocaleString()}</span>
                      <span>Carga: {group.loadPercent.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-white/6">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      style={{ width: `${Math.max(group.loadPercent, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="panel rounded-[30px] p-6"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-3">
                <Zap className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Actividad reciente</h3>
                <p className="mt-1 text-sm text-slate-400">Resumen legible de las ultimas ordenes.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-5 py-10 text-center text-sm text-slate-400">
                  Aun no hay actividad registrada. Usa el centro de comando para poblar esta vista.
                </div>
              ) : (
                tasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-white/6 bg-white/4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-slate-100">{task.command}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {task.assignedBots.length.toLocaleString()} bots asignados
                          {task.assignedGroup ? ` - ${task.assignedGroup}` : ' - pool general'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                          task.status === 'completed'
                            ? 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100'
                            : task.status === 'processing'
                              ? 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100'
                              : task.status === 'failed'
                                ? 'border-rose-400/20 bg-rose-400/8 text-rose-100'
                                : 'border-amber-400/20 bg-amber-400/8 text-amber-100'
                        }`}
                      >
                        {task.status.toUpperCase()}
                      </span>
                    </div>

                    {task.status === 'processing' ? (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                          <span>Progreso</span>
                          <span>{task.progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/6">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            style={{ width: `${Math.max(task.progress, 4)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
