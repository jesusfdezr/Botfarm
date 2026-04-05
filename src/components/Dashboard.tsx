import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Cpu,
  Play,
  Scale,
  ShieldCheck,
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
  active: 'bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 text-emerald-300',
  paused: 'bg-white/5 text-slate-400',
  maintenance: 'bg-gradient-to-r from-amber-400/20 to-amber-500/20 text-amber-300',
};

const formatUptime = (createdAt: Date | null) => {
  if (!createdAt) return '00D 00H';

  const elapsedMs = Date.now() - createdAt.getTime();
  const days = Math.max(0, Math.floor(elapsedMs / 86_400_000));
  const hours = Math.max(0, Math.floor((elapsedMs % 86_400_000) / 3_600_000));
  return `${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}H`;
};

export const Dashboard = () => {
  const [isChartReady, setIsChartReady] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const { bots, groups, tasks, commandLogs, getStats, rebalanceFleet, runAutoscaleCycle } = useBotStore();
  const stats = getStats();

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  const activeTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;
  const idleBots = bots.filter((bot) => bot.status === 'idle').length;
  const oldestGroupDate = groups.reduce<Date | null>((oldest, group) => {
    if (!oldest || group.createdAt < oldest) return group.createdAt;
    return oldest;
  }, null);

  const activeByGroup = groups.reduce<Record<string, number>>((acc, group) => {
    acc[group.id] = 0;
    return acc;
  }, {});

  bots.forEach((bot) => {
    if (bot.status === 'working') {
      activeByGroup[bot.groupId] = (activeByGroup[bot.groupId] ?? 0) + 1;
    }
  });

  const groupSummaries = groups
    .map((group) => {
      const activeBots = activeByGroup[group.id] ?? 0;
      const taskLoad = tasks.filter((task) => task.assignedGroup === group.id).length;
      const completedGroupTasks = tasks.filter(
        (task) => task.assignedGroup === group.id && task.status === 'completed',
      ).length;

      return {
        ...group,
        activeBots,
        taskLoad,
        completedGroupTasks,
        loadPercent: group.totalBots > 0 ? (activeBots / group.totalBots) * 100 : 0,
        successPercent: taskLoad > 0 ? (completedGroupTasks / taskLoad) * 100 : 0,
      };
    })
    .sort((left, right) => right.activeBots - left.activeBots || right.taskLoad - left.taskLoad);

  const activitySeries = [
    { label: '-60m', load: Math.max(stats.activeBots - 34, 0), throughput: Math.max(stats.completedTasks - 9, 0) },
    { label: '-50m', load: Math.max(stats.activeBots - 26, 0), throughput: Math.max(stats.completedTasks - 7, 0) },
    { label: '-40m', load: Math.max(stats.activeBots - 18, 0), throughput: Math.max(stats.completedTasks - 5, 0) },
    { label: '-30m', load: Math.max(stats.activeBots - 11, 0), throughput: Math.max(stats.completedTasks - 3, 0) },
    { label: '-20m', load: Math.max(stats.activeBots - 6, 0), throughput: Math.max(stats.completedTasks - 2, 0) },
    { label: '-10m', load: Math.max(stats.activeBots - 3, 0), throughput: Math.max(stats.completedTasks - 1, 0) },
    { label: 'Ahora', load: stats.activeBots, throughput: stats.completedTasks },
  ];

  const liveFeed = useMemo(
    () =>
      commandLogs.slice(0, 6).map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toLocaleTimeString(),
        label: log.status === 'success' ? 'SUCCESS' : log.status === 'error' ? 'ALERT' : 'INFO',
        tone:
          log.status === 'success'
            ? 'text-emerald-400'
            : log.status === 'error'
              ? 'text-rose-400'
              : 'text-cyan-300',
        message: log.response,
      })),
    [commandLogs],
  );

  const resourceBars = [
    {
      label: 'Fleet load',
      value: `${stats.totalBots > 0 ? ((stats.activeBots / stats.totalBots) * 100).toFixed(1) : '0.0'}%`,
      progress: stats.totalBots > 0 ? (stats.activeBots / stats.totalBots) * 100 : 0,
      tone: 'from-cyan-400 to-cyan-500',
      icon: Cpu,
    },
    {
      label: 'Idle reserve',
      value: idleBots.toLocaleString(),
      progress: bots.length > 0 ? (idleBots / bots.length) * 100 : 0,
      tone: 'from-emerald-400 to-emerald-500',
      icon: Zap,
    },
    {
      label: 'Success rate',
      value: `${stats.successRate.toFixed(1)}%`,
      progress: stats.successRate,
      tone: 'from-violet-400 to-fuchsia-500',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Main Stats Row */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Active Bots - Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-cyan-500 to-blue-600 p-5 shadow-xl shadow-cyan-500/20 md:col-span-2 xl:col-span-2"
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Bots activos</p>
                <p className="mt-2 text-5xl font-bold leading-none text-white sm:text-6xl">
                  {stats.activeBots.toLocaleString()}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                  <span className="text-xs text-white/70">{stats.totalBots} total</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  rebalanceFleet();
                  runAutoscaleCycle();
                }}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cyan-600 shadow-lg transition hover:bg-white/90"
              >
                <Play className="h-4 w-4" />
                <span>Start</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">Success</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">Uptime</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatUptime(oldestGroupDate)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">Queue</p>
                <p className="mt-1 text-2xl font-bold text-white">{activeTasks}</p>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-4 backdrop-blur-xl"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Acciones</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowBuilder((current) => !current)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-medium transition-all ${showBuilder
                  ? 'bg-gradient-to-r from-violet-400/20 to-purple-500/20 text-violet-300'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 text-white">
                <Zap className="h-4 w-4" />
              </div>
              <span>{showBuilder ? 'Ocultar builder' : 'Mostrar builder'}</span>
            </button>
            <button
              type="button"
              onClick={rebalanceFleet}
              className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                <Scale className="h-4 w-4" />
              </div>
              <span>Balance</span>
            </button>
            <button
              type="button"
              onClick={() => runAutoscaleCycle()}
              className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 text-white">
                <Activity className="h-4 w-4" />
              </div>
              <span>Scale</span>
            </button>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-4 backdrop-blur-xl"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Estado</p>
          <div className="space-y-3">
            {resourceBars.map((resource) => {
              const Icon = resource.icon;
              return (
                <div key={resource.label} className="rounded-xl bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{resource.label}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{resource.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${resource.tone}`}
                      style={{ width: `${Math.max(resource.progress, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Chart & Groups */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <p className="text-sm font-semibold text-white">Actividad</p>
            </div>
          </div>

          <div className="h-[240px]">
            {isChartReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activitySeries}>
                  <defs>
                    <linearGradient id="opsLoadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6ae6ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6ae6ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="opsThroughputGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52f28d" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#52f28d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#6f7b95" tickLine={false} axisLine={false} />
                  <YAxis stroke="#6f7b95" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid rgba(106,230,255,0.12)',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(5, 8, 16, 0.96)',
                      color: '#f5f7ff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="load"
                    stroke="#6ae6ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#opsLoadGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="throughput"
                    stroke="#52f28d"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#opsThroughputGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl border border-white/8 bg-black/25" />
            )}
          </div>
        </motion.div>

        {/* Bot Groups */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Grupos</p>
            </div>
          </div>

          <div className="max-h-[280px] space-y-3 overflow-y-auto scrollbar-hide">
            {groupSummaries.slice(0, 5).map((group) => (
              <div
                key={group.id}
                className="rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusTone[group.status]}`}>
                      {group.status === 'active' ? 'RUN' : group.status === 'paused' ? 'STBY' : 'PEND'}
                    </div>
                    <span className="text-sm font-semibold text-white">{group.name}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Bots</p>
                    <p className="mt-1 text-lg font-bold text-white">{group.totalBots}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Success</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">
                      {group.successPercent > 0 ? `${group.successPercent.toFixed(0)}%` : '--'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Tasks</p>
                    <p className="mt-1 text-lg font-bold text-white">{group.taskLoad}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Activity Feed */}
      <section className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-cyan-400" />
          <p className="text-sm font-semibold text-white">Actividad reciente</p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <div className="space-y-2 font-mono text-sm">
            {liveFeed.length === 0 ? (
              <p className="text-slate-600">Sin eventos recientes</p>
            ) : (
              liveFeed.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600">{item.timestamp}</span>
                  <span className={`min-w-[60px] text-xs font-bold ${item.tone}`}>{item.label}</span>
                  <span className="text-xs text-slate-400">{item.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Builder Module */}
      {showBuilder && <FarmBuilder />}
    </div>
  );
};
