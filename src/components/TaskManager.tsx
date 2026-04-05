import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Filter,
  Layers3,
  RefreshCcw,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useBotStore } from '../store/botStore';

type TaskFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

const statusTone = {
  pending: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  processing: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
  completed: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  failed: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
};

const priorityTone = {
  low: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  medium: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  high: 'border-orange-400/20 bg-orange-400/8 text-orange-100',
  critical: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
};

export const TaskManager = () => {
  const { tasks, getStats } = useBotStore();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [search, setSearch] = useState('');

  const stats = getStats();
  const pendingCount = tasks.filter((task) => task.status === 'pending').length;
  const processingCount = tasks.filter((task) => task.status === 'processing').length;
  const failedCount = tasks.filter((task) => task.status === 'failed').length;
  const criticalCount = tasks.filter((task) => task.priority === 'critical').length;

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = normalizedSearch ? task.command.toLowerCase().includes(normalizedSearch) : true;
    return matchesFilter && matchesSearch;
  });

  const cards = [
    {
      label: 'Total',
      value: stats.totalTasks.toLocaleString(),
      detail: 'Tareas registradas',
      icon: Layers3,
      tone: 'border-violet-400/20 bg-violet-400/8 text-violet-100',
    },
    {
      label: 'Pendientes',
      value: pendingCount.toLocaleString(),
      detail: 'A la espera de recursos',
      icon: Clock3,
      tone: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
    },
    {
      label: 'Procesando',
      value: processingCount.toLocaleString(),
      detail: 'En ejecucion ahora',
      icon: RefreshCcw,
      tone: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
    },
    {
      label: 'Completadas',
      value: stats.completedTasks.toLocaleString(),
      detail: 'Resultado exitoso',
      icon: CheckCircle2,
      tone: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
    },
    {
      label: 'Fallidas',
      value: failedCount.toLocaleString(),
      detail: 'Requieren revision',
      icon: AlertCircle,
      tone: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`panel rounded-[24px] p-5 ${card.tone}`}
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-50">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{card.detail}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-3">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="panel panel-glow rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <Filter className="h-4 w-4" />
              Gestor de tareas
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-gradient">Seguimiento mas limpio y menos ambiguo</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Aqui compacte filtros, metadatos y progreso para que la cola sea facil de revisar sin perder
              informacion clave.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Exito</p>
              <p className="mt-3 text-2xl font-semibold text-cyan-100">{stats.successRate.toFixed(1)}%</p>
              <p className="mt-2 text-sm text-slate-300">Ratio de tareas completadas</p>
            </div>
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Criticas</p>
              <p className="mt-3 text-2xl font-semibold text-rose-100">{criticalCount.toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-300">Prioridad mas alta</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Carga viva</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-100">{(pendingCount + processingCount).toLocaleString()}</p>
              <p className="mt-2 text-sm text-slate-300">Pendientes y en curso</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel rounded-[30px] p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por descripcion de la tarea"
                className="w-full rounded-2xl border border-white/8 bg-slate-950/65 py-3 pl-11 pr-4 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'processing', label: 'Procesando' },
              { value: 'completed', label: 'Completadas' },
              { value: 'failed', label: 'Fallidas' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value as TaskFilter)}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  filter === option.value
                    ? 'border-cyan-400/24 bg-cyan-400/12 text-cyan-100'
                    : 'border-white/8 bg-white/4 text-slate-300 hover:bg-white/6'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="panel rounded-[30px] p-12 text-center">
              <div className="relative z-10">
                <Target className="mx-auto h-14 w-14 text-slate-500" />
                <p className="mt-4 text-lg font-medium text-slate-200">No hay tareas para estos filtros</p>
                <p className="mt-2 text-sm text-slate-400">Prueba con otro estado o limpia la busqueda.</p>
              </div>
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="panel rounded-[28px] p-5 sm:p-6"
              >
                <div className="relative z-10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone[task.status]}`}>
                          {task.status.toUpperCase()}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityTone[task.priority]}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        {task.assignedGroup ? (
                          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-300">
                            {task.assignedGroup}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 text-base font-medium leading-7 text-slate-100">{task.command}</p>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                        <span>Creada {task.createdAt.toLocaleString()}</span>
                        <span>Bots {task.assignedBots.length.toLocaleString()}</span>
                        {task.completedAt ? <span>Completada {task.completedAt.toLocaleString()}</span> : null}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 text-right text-sm text-slate-300">
                      <p>Progreso</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">{task.progress.toFixed(0)}%</p>
                    </div>
                  </div>

                  {task.status === 'processing' ? (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Avance de la orden</span>
                        <span>{task.progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/6">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${Math.max(task.progress, 4)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {task.result ? (
                    <div className="mt-5 rounded-2xl border border-emerald-400/18 bg-emerald-400/8 px-4 py-3 text-sm text-slate-300">
                      {task.result}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <section className="panel rounded-[30px] p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3">
                  <TrendingUp className="h-5 w-5 text-cyan-100" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Metricas rapidas</h3>
                  <p className="mt-1 text-sm text-slate-400">Lectura compacta del sistema.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: 'Tasa de exito',
                    value: `${stats.successRate.toFixed(1)}%`,
                    progress: stats.successRate,
                    tone: 'from-emerald-400 to-cyan-400',
                  },
                  {
                    label: 'Cola activa',
                    value: `${pendingCount + processingCount}`,
                    progress: Math.min((pendingCount + processingCount) * 10, 100),
                    tone: 'from-cyan-400 to-blue-500',
                  },
                  {
                    label: 'Incidencias',
                    value: `${failedCount}`,
                    progress: Math.min(failedCount * 15, 100),
                    tone: 'from-rose-400 to-orange-400',
                  },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-300">{metric.label}</span>
                      <span className="text-slate-100">{metric.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/6">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${metric.tone}`}
                        style={{ width: `${Math.max(metric.progress, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel rounded-[30px] p-6">
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-slate-100">Notas de robustez</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/8 p-4">
                  Las clases de color ya no dependen de interpolaciones fragiles de Tailwind.
                </div>
                <div className="rounded-2xl border border-violet-400/18 bg-violet-400/8 p-4">
                  El estado de comandos y tareas ahora se refleja con mas coherencia entre vistas.
                </div>
                <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">
                  La cola mantiene legibilidad incluso cuando crece el numero de registros.
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};
