import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Layers3,
  Search,
  UserRound,
  Users,
  Workflow,
} from 'lucide-react';
import { Bot, BotRank, BotStatus, useBotStore } from '../store/botStore';

type RankFilter = BotRank | 'all';
type StatusFilter = BotStatus | 'all';

interface OfficerNode {
  bot: Bot;
  children: OfficerNode[];
  directReports: number;
  soldierCount: number;
}

const rankOrder: Record<BotRank, number> = {
  capitan: 0,
  teniente: 1,
  alferez: 2,
  sargento: 3,
  soldado: 4,
};

const rankTone: Record<BotRank, { label: string; badge: string; gradient: string }> = {
  capitan: {
    label: 'CAP',
    badge: 'bg-gradient-to-r from-violet-400 to-purple-500 text-white',
    gradient: 'from-violet-400 to-purple-500',
  },
  teniente: {
    label: 'TEN',
    badge: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
    gradient: 'from-cyan-400 to-blue-500',
  },
  alferez: {
    label: 'ALF',
    badge: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white',
    gradient: 'from-blue-400 to-indigo-500',
  },
  sargento: {
    label: 'SGT',
    badge: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white',
    gradient: 'from-emerald-400 to-green-500',
  },
  soldado: {
    label: 'SLD',
    badge: 'bg-white/10 text-slate-400',
    gradient: 'from-slate-400 to-slate-500',
  },
};

const statusTone: Record<BotStatus, { label: string; dot: string }> = {
  idle: { label: 'IDL', dot: 'bg-slate-400' },
  working: { label: 'WRK', dot: 'bg-cyan-400' },
  completed: { label: 'DON', dot: 'bg-emerald-400' },
  failed: { label: 'ERR', dot: 'bg-rose-400' },
  paused: { label: 'PAU', dot: 'bg-amber-400' },
};

const OfficerTree = ({ nodes, depth = 0 }: { nodes: OfficerNode[]; depth?: number }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-2">
      {nodes.map((node) => {
        const isExpanded = expanded[node.bot.id];
        const hasChildren = node.children.length > 0;

        return (
          <div key={node.bot.id} className={`${depth > 0 ? 'ml-4 border-l border-white/10 pl-4' : ''}`}>
            <motion.div
              className={`rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10 ${hasChildren ? 'cursor-pointer' : ''}`}
              onClick={() => hasChildren && toggleExpand(node.bot.id)}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${rankTone[node.bot.rank].badge}`}>
                  {rankTone[node.bot.rank].label}
                </span>

                {/* Bot Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{node.bot.name}</span>
                    <span className={`flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusTone[node.bot.status].dot}`} />
                      {statusTone[node.bot.status].label}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden items-center gap-3 text-xs text-slate-400 sm:flex">
                  <span>{node.bot.efficiency}%</span>
                  <span>{node.bot.completedTasks}</span>
                  {node.soldierCount > 0 && <span>+{node.soldierCount}</span>}
                </div>

                {/* Expand Icon */}
                {hasChildren && (
                  <div className="text-slate-500">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                )}
              </div>

              {node.bot.currentTask && (
                <p className="mt-2 truncate text-xs text-cyan-400">{node.bot.currentTask}</p>
              )}
            </motion.div>

            <AnimatePresence>
              {isExpanded && node.children.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden"
                >
                  <OfficerTree nodes={node.children} depth={depth + 1} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export const BotHierarchy = () => {
  const { bots, groups } = useBotStore();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedRank, setSelectedRank] = useState<RankFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  const effectiveGroup = selectedGroup || groups[0]?.id || '';
  const groupBots = effectiveGroup ? bots.filter((bot) => bot.groupId === effectiveGroup) : [];
  const selectedGroupMeta = groups.find((group) => group.id === effectiveGroup) ?? null;

  const countsByRank = groupBots.reduce<Record<BotRank, number>>(
    (accumulator, bot) => {
      accumulator[bot.rank] += 1;
      return accumulator;
    },
    { capitan: 0, teniente: 0, alferez: 0, sargento: 0, soldado: 0 },
  );

  const buildOfficerTree = (parentId: string | null): OfficerNode[] =>
    groupBots
      .filter((bot) => bot.parentId === parentId && bot.rank !== 'soldado')
      .sort((left, right) => rankOrder[left.rank] - rankOrder[right.rank] || left.name.localeCompare(right.name))
      .map((bot) => ({
        bot,
        children: buildOfficerTree(bot.id),
        directReports: groupBots.filter((candidate) => candidate.parentId === bot.id && candidate.rank !== 'soldado').length,
        soldierCount: groupBots.filter((candidate) => candidate.parentId === bot.id && candidate.rank === 'soldado').length,
      }));

  const commandTree = buildOfficerTree(null);

  const filteredBots = groupBots
    .filter((bot) => (selectedRank === 'all' ? true : bot.rank === selectedRank))
    .filter((bot) => (selectedStatus === 'all' ? true : bot.status === selectedStatus))
    .filter((bot) => {
      const normalizedQuery = search.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return (
        bot.name.toLowerCase().includes(normalizedQuery) ||
        bot.specialization.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((left, right) => rankOrder[left.rank] - rankOrder[right.rank] || left.name.localeCompare(right.name));

  const visibleBots = filteredBots.slice(0, 120);

  const statCards = [
    { rank: 'capitan' as const, value: countsByRank.capitan, icon: Users },
    { rank: 'teniente' as const, value: countsByRank.teniente, icon: Users },
    { rank: 'alferez' as const, value: countsByRank.alferez, icon: Users },
    { rank: 'sargento' as const, value: countsByRank.sargento, icon: Users },
    { rank: 'soldado' as const, value: countsByRank.soldado, icon: UserRound },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <section className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Jerarquia</p>
              <p className="text-xs text-slate-400">{selectedGroupMeta?.name || 'Selecciona grupo'}</p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('tree')}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${viewMode === 'tree'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              Arbol
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${viewMode === 'list'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
            >
              Lista
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-lg bg-white/5 px-3 py-2 text-slate-400 hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Panel - Collapsible */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  value={effectiveGroup}
                  onChange={(event) => setSelectedGroup(event.target.value)}
                  className="rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-slate-800">
                      {group.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRank}
                  onChange={(event) => setSelectedRank(event.target.value as RankFilter)}
                  className="rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="all" className="bg-slate-800">Todos</option>
                  <option value="capitan" className="bg-slate-800">Capitan</option>
                  <option value="teniente" className="bg-slate-800">Teniente</option>
                  <option value="alferez" className="bg-slate-800">Alferez</option>
                  <option value="sargento" className="bg-slate-800">Sargento</option>
                  <option value="soldado" className="bg-slate-800">Soldado</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
                  className="rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="all" className="bg-slate-800">Todos</option>
                  <option value="idle" className="bg-slate-800">Idle</option>
                  <option value="working" className="bg-slate-800">Working</option>
                  <option value="completed" className="bg-slate-800">Completed</option>
                  <option value="failed" className="bg-slate-800">Failed</option>
                  <option value="paused" className="bg-slate-800">Paused</option>
                </select>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar..."
                    className="w-full rounded-lg bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.rank}
                className={`rounded-xl bg-gradient-to-br ${rankTone[card.rank].gradient} p-3 text-center`}
              >
                <Icon className="mx-auto mb-1 h-4 w-4 text-white/70" />
                <p className="text-lg font-bold text-white">{card.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/70">{rankTone[card.rank].label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Content */}
      <section className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
        {viewMode === 'tree' ? (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Workflow className="h-5 w-5 text-violet-400" />
              <p className="text-sm font-semibold text-white">Cadena de mando</p>
            </div>

            {commandTree.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-8 text-center text-sm text-slate-500">
                Sin estructura disponible
              </div>
            ) : (
              <OfficerTree nodes={commandTree} />
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <p className="text-sm font-semibold text-white">Roster</p>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                  {visibleBots.length}/{filteredBots.length}
                </span>
              </div>
            </div>

            <div className="max-h-[600px] space-y-2 overflow-y-auto scrollbar-hide">
              {visibleBots.length === 0 ? (
                <div className="rounded-xl bg-white/5 p-8 text-center text-sm text-slate-500">
                  Sin resultados
                </div>
              ) : (
                visibleBots.map((bot) => (
                  <div key={bot.id} className="rounded-xl bg-white/5 p-3 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${rankTone[bot.rank].badge}`}>
                        {rankTone[bot.rank].label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{bot.name}</p>
                        <p className="text-xs text-slate-500">{bot.specialization}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{bot.completedTasks}</span>
                        <span className={`flex items-center gap-1.5`}>
                          <span className={`h-2 w-2 rounded-full ${statusTone[bot.status].dot}`} />
                          {statusTone[bot.status].label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
