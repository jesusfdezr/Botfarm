import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Cpu,
  Play,
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

const formatUptime = (createdAt: Date | null) => {
  if (!createdAt) return '00D 00H';

  const elapsedMs = Date.now() - createdAt.getTime();
  const days = Math.max(0, Math.floor(elapsedMs / 86_400_000));
  const hours = Math.max(0, Math.floor((elapsedMs % 86_400_000) / 3_600_000));
  return `${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}H`;
};

export const Dashboard = () => {
  const [isChartReady, setIsChartReady] = useState(false);
  const [showBuilder] = useState(false);
  const { bots, groups, tasks, commandLogs, getStats } = useBotStore();
  const stats = getStats();

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  const activeTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;
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

  const activitySeries = [
    { label: '-60m', load: Math.max(stats.activeBots - 34, 0), throughput: Math.max(stats.completedTasks - 9, 0) },
    { label: '-50m', load: Math.max(stats.activeBots - 26, 0), throughput: Math.max(stats.completedTasks - 7, 0) },
    { label: '-40m', load: Math.max(stats.activeBots - 18, 0), throughput: Math.max(stats.completedTasks - 5, 0) },
    { label: '-30m', load: Math.max(stats.activeBots - 11, 0), throughput: Math.max(stats.completedTasks - 3, 0) },
    { label: '-20m', load: Math.max(stats.activeBots - 6, 0), throughput: Math.max(stats.completedTasks - 2, 0) },
    { label: '-10m', load: Math.max(stats.activeBots - 3, 0), throughput: Math.max(stats.completedTasks - 1, 0) },
    { label: 'NOW', load: stats.activeBots, throughput: stats.completedTasks },
  ];

  const liveFeed = useMemo(
    () =>
      commandLogs.slice(0, 8).map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toLocaleTimeString(),
        label: log.status === 'success' ? 'SUCCESS' : log.status === 'error' ? 'ALERT' : 'PROC',
        color:
          log.status === 'success'
            ? 'border-[#00ff41] text-[#00ff41]'
            : log.status === 'error'
              ? 'border-[#93000a] text-[#ffb4ab]'
              : 'border-[#00ff41] text-[#00ff41]',
        message: log.response,
      })),
    [commandLogs],
  );

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8">
      {/* Hero Section */}
      <section className="mb-8">
        <div className="bg-[#0c0e11] p-6 border-l-4 border-[#00ff41] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <ShieldCheck className="h-[120px] w-[120px] text-[#00ff41]" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
            <div className="w-full md:w-2/3">
              <p className="text-xs font-['Space_Grotesk'] tracking-[0.2em] text-[#84967e] mb-2 uppercase">FORCE READINESS</p>
              <h2 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter mb-4 text-[#e2e2e6] uppercase">SYSTEM INTEGRITY</h2>
              <div className="h-4 bg-[#333538] w-full relative">
                <div
                  className="h-full bg-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.5)] relative"
                  style={{ width: `${stats.totalBots > 0 ? (stats.activeBots / stats.totalBots) * 100 : 0}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] opacity-30"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-8 tabular-nums">
              <div>
                <p className="text-[10px] text-[#84967e] mb-1 uppercase">LATENCY</p>
                <p className="text-xl font-['Space_Grotesk'] font-medium text-[#00ff41]">12MS</p>
              </div>
              <div>
                <p className="text-[10px] text-[#84967e] mb-1 uppercase">UPTIME</p>
                <p className="text-xl font-['Space_Grotesk'] font-medium">{formatUptime(oldestGroupDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Active Bots */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1c1f] p-5 relative group"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-2 bg-[#00ff41]/10">
              <Cpu className="h-6 w-6 text-[#00ff41]" />
            </div>
            <span className="text-[10px] font-['Space_Grotesk'] border border-[#3b4b37] px-2 py-0.5 text-[#84967e] uppercase">LIVE_FEED</span>
          </div>
          <p className="text-xs text-[#84967e] font-['Space_Grotesk'] tracking-widest uppercase">Active Bots</p>
          <h3 className="text-5xl font-['Space_Grotesk'] font-extrabold tabular-nums text-[#00ff41] mb-2">{stats.activeBots.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[#00ff41]">
            <Zap className="h-4 w-4" />
            <span>+12% FROM LAST CYCLE</span>
          </div>
        </motion.div>

        {/* Ongoing Missions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#1a1c1f] p-5 relative"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-2 bg-[#fd8b00]/10">
              <Play className="h-6 w-6 text-[#fd8b00]" />
            </div>
            <span className="text-[10px] font-['Space_Grotesk'] border border-[#fd8b00]/30 px-2 py-0.5 text-[#fd8b00] uppercase">CRITICAL</span>
          </div>
          <p className="text-xs text-[#84967e] font-['Space_Grotesk'] tracking-widest uppercase">Ongoing Missions</p>
          <h3 className="text-5xl font-['Space_Grotesk'] font-extrabold tabular-nums text-[#e2e2e6] mb-2">{activeTasks}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[#fd8b00]">
            <Activity className="h-4 w-4" />
            <span>{stats.successRate.toFixed(1)}% SUCCESS RATE</span>
          </div>
        </motion.div>

        {/* Successful Bans */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1c1f] p-5 relative"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="p-2 bg-[#cadeff]/10">
              <CheckCircle2 className="h-6 w-6 text-[#cadeff]" />
            </div>
            <span className="text-[10px] font-['Space_Grotesk'] border border-[#3b4b37] px-2 py-0.5 text-[#84967e] uppercase">ENFORCEMENT</span>
          </div>
          <p className="text-xs text-[#84967e] font-['Space_Grotesk'] tracking-widest uppercase">Completed Tasks</p>
          <h3 className="text-5xl font-['Space_Grotesk'] font-extrabold tabular-nums text-[#cadeff] mb-2">{stats.completedTasks.toLocaleString()}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[#cadeff]">
            <ShieldCheck className="h-4 w-4" />
            <span>{groups.filter(g => g.status === 'active').length} GROUPS ACTIVE</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chart Area */}
        <div className="lg:col-span-3">
          <div className="bg-[#1a1c1f] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-['Space_Grotesk'] font-bold tracking-widest uppercase flex items-center gap-2 text-[#00ff41]">
                <span className="w-2 h-2 bg-[#00ff41] block"></span>
                Deployment Telemetry
              </h3>
            </div>

            {/* Chart */}
            <div className="relative h-64 bg-[#333538]/50 backdrop-blur-md mb-6 overflow-hidden border border-[#3b4b37]/10">
              {isChartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activitySeries}>
                    <defs>
                      <linearGradient id="opsLoadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff41" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="opsThroughputGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fd8b00" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#fd8b00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(132,150,126,0.1)" vertical={false} />
                    <XAxis dataKey="label" stroke="#84967e" tickLine={false} axisLine={false} />
                    <YAxis stroke="#84967e" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid #3b4b37',
                        borderRadius: '0px',
                        backgroundColor: '#0c0e11',
                        color: '#e2e2e6',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="load"
                      stroke="#00ff41"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#opsLoadGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="#fd8b00"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#opsThroughputGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-[#333538]/50" />
              )}
            </div>

            {/* Sector Load */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-['Space_Grotesk'] text-[#84967e] tracking-[0.3em] uppercase">Sector Load</h4>
                {groups.slice(0, 3).map((group) => {
                  const activeBots = activeByGroup[group.id] ?? 0;
                  const loadPercent = group.totalBots > 0 ? (activeBots / group.totalBots) * 100 : 0;
                  return (
                    <div key={group.id}>
                      <div className="flex justify-between items-center text-xs tabular-nums">
                        <span className="text-[#84967e]">{group.id}</span>
                        <span className="text-[#00ff41]">{loadPercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-[#333538] mt-1">
                        <div className="h-full bg-[#00ff41]" style={{ width: `${loadPercent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-['Space_Grotesk'] text-[#84967e] tracking-[0.3em] uppercase">Threat Response</h4>
                <div className="flex gap-4 items-center h-full">
                  <div className="flex-1 bg-[#0c0e11] p-3 border-l border-[#00ff41]">
                    <p className="text-[10px] text-[#84967e] mb-1 uppercase">AUTO-RESPONSE</p>
                    <p className="text-sm font-bold text-[#00ff41] uppercase">Enabled</p>
                  </div>
                  <div className="flex-1 bg-[#0c0e11] p-3 border-l border-[#fd8b00]">
                    <p className="text-[10px] text-[#84967e] mb-1 uppercase">FIREWALL</p>
                    <p className="text-sm font-bold text-[#fd8b00] uppercase">Reinforced</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1c1f] p-4 h-full">
            <h3 className="font-['Space_Grotesk'] font-bold tracking-widest uppercase mb-4 text-xs flex items-center justify-between text-[#00ff41]">
              Recent Activity
              <Clock3 className="h-5 w-5" />
            </h3>

            <div className="space-y-4 font-body max-h-[400px] overflow-y-auto scrollbar-hide">
              {liveFeed.length === 0 ? (
                <p className="text-[#84967e] text-xs">No recent events.</p>
              ) : (
                liveFeed.map((item) => (
                  <div key={item.id} className={`border-l-2 ${item.color.split(' ')[0]} pl-3 py-1 bg-[#0c0e11]`}>
                    <p className="text-[10px] text-[#84967e] tabular-nums">{item.timestamp}</p>
                    <p className="text-[11px] leading-tight">
                      <span className={`${item.color.split(' ')[1]} font-mono`}>{item.label}</span> {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Builder Module */}
      {showBuilder && <FarmBuilder />}
    </div>
  );
};
