import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers3,
  Search,
  ShieldCheck,
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

const rankTone: Record<BotRank, { label: string; badge: string; line: string }> = {
  capitan: {
    label: 'Capitan',
    badge: 'border-violet-400/20 bg-violet-400/8 text-violet-100',
    line: 'border-violet-400/35',
  },
  teniente: {
    label: 'Teniente',
    badge: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
    line: 'border-cyan-400/35',
  },
  alferez: {
    label: 'Alferez',
    badge: 'border-blue-400/20 bg-blue-400/8 text-blue-100',
    line: 'border-blue-400/35',
  },
  sargento: {
    label: 'Sargento',
    badge: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
    line: 'border-emerald-400/35',
  },
  soldado: {
    label: 'Soldado',
    badge: 'border-slate-400/20 bg-slate-400/8 text-slate-100',
    line: 'border-slate-400/35',
  },
};

const statusTone: Record<BotStatus, string> = {
  idle: 'border-slate-400/20 bg-slate-400/8 text-slate-200',
  working: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
  completed: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  failed: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
  paused: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
};

const OfficerTree = ({ nodes, depth = 0 }: { nodes: OfficerNode[]; depth?: number }) => {
  return (
    <div className="space-y-3">
      {nodes.map((node) => (
        <div key={node.bot.id} className={`${depth > 0 ? 'ml-4 border-l border-white/8 pl-4' : ''}`}>
          <div className={`rounded-2xl border bg-white/4 p-4 ${rankTone[node.bot.rank].line}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${rankTone[node.bot.rank].badge}`}>
                    {rankTone[node.bot.rank].label}
                  </span>
                  <span className="text-sm font-medium text-slate-100">{node.bot.name}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone[node.bot.status]}`}>
                    {node.bot.status.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                  <span>Eficiencia {node.bot.efficiency}%</span>
                  <span>Tareas completadas {node.bot.completedTasks}</span>
                  <span>Submandos {node.directReports}</span>
                  {node.soldierCount > 0 ? <span>Soldados directos {node.soldierCount}</span> : null}
                </div>

                {node.bot.currentTask ? (
                  <p className="mt-3 text-sm text-cyan-100">{node.bot.currentTask}</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                Ultima actividad: {node.bot.lastActive.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {node.children.length > 0 ? <OfficerTree nodes={node.children} depth={depth + 1} /> : null}
        </div>
      ))}
    </div>
  );
};

export const BotHierarchy = () => {
  const { bots, groups } = useBotStore();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedRank, setSelectedRank] = useState<RankFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

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
      if (!normalizedQuery) {
        return true;
      }
      return (
        bot.name.toLowerCase().includes(normalizedQuery) ||
        bot.specialization.toLowerCase().includes(normalizedQuery) ||
        bot.groupName.toLowerCase().includes(normalizedQuery)
      );
    })
    .sort((left, right) => rankOrder[left.rank] - rankOrder[right.rank] || left.name.localeCompare(right.name));

  const visibleBots = filteredBots.slice(0, 120);

  const statCards = [
    { rank: 'capitan' as const, value: countsByRank.capitan },
    { rank: 'teniente' as const, value: countsByRank.teniente },
    { rank: 'alferez' as const, value: countsByRank.alferez },
    { rank: 'sargento' as const, value: countsByRank.sargento },
    { rank: 'soldado' as const, value: countsByRank.soldado },
  ];

  return (
    <div className="space-y-6">
      <section className="panel panel-glow rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                <Layers3 className="h-4 w-4" />
                Explorador jerarquico
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-gradient">Cadena de mando sin sobrecargar la vista</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                La vista anterior intentaba renderizar demasiados nodos. Ahora separa mando y roster para que
                todo siga siendo legible incluso con miles de soldados.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:max-w-xl xl:grid-cols-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Grupo activo</p>
                <p className="mt-3 text-xl font-semibold text-cyan-100">
                  {selectedGroupMeta?.name ?? 'Sin datos'}
                </p>
                <p className="mt-2 text-sm text-slate-400">{selectedGroupMeta?.id ?? 'Selecciona un grupo'}</p>
              </div>
              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bots filtrados</p>
                <p className="mt-3 text-xl font-semibold text-violet-100">{filteredBots.length.toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-400">Busqueda, rango y estado combinados</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4 sm:col-span-2 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mando</p>
                <p className="mt-3 text-xl font-semibold text-emerald-100">{commandTree.length.toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-400">Nodos raiz para el grupo seleccionado</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <label className="space-y-2 lg:col-span-1">
              <span className="text-sm text-slate-300">Grupo</span>
              <select
                value={effectiveGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
                className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Rango</span>
              <select
                value={selectedRank}
                onChange={(event) => setSelectedRank(event.target.value as RankFilter)}
                className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
              >
                <option value="all">Todos</option>
                <option value="capitan">Capitan</option>
                <option value="teniente">Teniente</option>
                <option value="alferez">Alferez</option>
                <option value="sargento">Sargento</option>
                <option value="soldado">Soldado</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Estado</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
                className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
              >
                <option value="all">Todos</option>
                <option value="idle">Idle</option>
                <option value="working">Working</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="paused">Paused</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-300">Busqueda</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre o especializacion"
                  className="w-full rounded-2xl border border-white/8 bg-slate-950/65 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                />
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card, index) => (
          <motion.div
            key={card.rank}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`panel rounded-[24px] p-5 ${rankTone[card.rank].badge}`}
          >
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{rankTone[card.rank].label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-50">{card.value.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-3">
                <UserRound className="h-5 w-5 text-slate-100" />
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel rounded-[30px] p-6 sm:p-7">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 p-3">
                <Workflow className="h-5 w-5 text-violet-100" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Cadena de mando</h3>
                <p className="mt-1 text-sm text-slate-400">Se muestran oficiales y subordinacion sin renderizar miles de soldados.</p>
              </div>
            </div>

            <div className="mt-6">
              {commandTree.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-5 py-10 text-center text-sm text-slate-400">
                  No hay estructura disponible para este grupo.
                </div>
              ) : (
                <OfficerTree nodes={commandTree} />
              )}
            </div>
          </div>
        </div>

        <div className="panel rounded-[30px] p-6 sm:p-7">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3">
                <Users className="h-5 w-5 text-cyan-100" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Roster filtrado</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Mostrando {visibleBots.length.toLocaleString()} de {filteredBots.length.toLocaleString()} resultados.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-400/18 bg-amber-400/8 px-4 py-3 text-sm text-slate-300">
              La lista se limita a 120 elementos para mantener la interfaz rapida y estable.
            </div>

            <div className="mt-6 space-y-3">
              {visibleBots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 px-5 py-10 text-center text-sm text-slate-400">
                  No hay bots que coincidan con los filtros actuales.
                </div>
              ) : (
                visibleBots.map((bot) => (
                  <div key={bot.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${rankTone[bot.rank].badge}`}>
                            {rankTone[bot.rank].label}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone[bot.status]}`}>
                            {bot.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-100">{bot.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{bot.specialization}</p>
                        {bot.currentTask ? <p className="mt-2 text-sm text-cyan-100">{bot.currentTask}</p> : null}
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 text-right text-sm text-slate-300">
                        <p>Tareas {bot.completedTasks}</p>
                        <p className="mt-1">Ultima actividad {bot.lastActive.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-100" />
                <p className="text-sm leading-6 text-slate-300">
                  Corregi el problema de filtrado por rango: ahora la vista no rompe la jerarquia ni desaparece al
                  seleccionar rangos intermedios o soldados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
