import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  Cpu,
  Factory,
  Gauge,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  TimerReset,
  Wrench,
} from 'lucide-react';
import { AutoscaleStatus, FleetProfile, GroupStatus, fleetShape, getFleetSize, useBotStore } from '../store/botStore';

const profileMeta: Record<
  FleetProfile,
  {
    label: string;
    summary: string;
    tone: string;
    chip: string;
  }
> = {
  light: {
    label: 'Ligero',
    summary: 'Despliegue rapido para nuevos sectores, verificacion inicial y tareas controladas.',
    tone: 'border-cyan-400/20 bg-cyan-400/8',
    chip: 'text-cyan-100',
  },
  balanced: {
    label: 'Balanceado',
    summary: 'Perfil polivalente para carga sostenida, analisis transversal y reparto fluido.',
    tone: 'border-violet-400/20 bg-violet-400/8',
    chip: 'text-violet-100',
  },
  heavy: {
    label: 'Pesado',
    summary: 'Cobertura extensa para granjas densas, maxima presencia y operaciones paralelas.',
    tone: 'border-emerald-400/20 bg-emerald-400/8',
    chip: 'text-emerald-100',
  },
};

const statusMeta: Record<
  GroupStatus,
  {
    label: string;
    tone: string;
  }
> = {
  active: {
    label: 'Activo',
    tone: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  },
  paused: {
    label: 'Pausado',
    tone: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  },
  maintenance: {
    label: 'Mantenimiento',
    tone: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
  },
};

const autoscaleStatusMeta: Record<
  AutoscaleStatus,
  {
    label: string;
    tone: string;
  }
> = {
  idle: {
    label: 'Pausado',
    tone: 'border-slate-400/20 bg-slate-400/8 text-slate-100',
  },
  watching: {
    label: 'Vigilando',
    tone: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
  },
  cooldown: {
    label: 'Cooldown',
    tone: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  },
  triggered: {
    label: 'Expandiendo',
    tone: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  },
  limit: {
    label: 'Limite',
    tone: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
  },
};

const actionButtons: Array<{
  status: GroupStatus;
  label: string;
  icon: typeof PlayCircle;
}> = [
  { status: 'active', label: 'Activar', icon: PlayCircle },
  { status: 'paused', label: 'Pausar', icon: PauseCircle },
  { status: 'maintenance', label: 'Mantener', icon: Wrench },
];

const defaultForm = {
  nameBase: 'Sector Neon',
  description: 'Flota dedicada a la nueva granja operativa',
  focus: 'Vigilancia y respuesta coordinada',
  profile: 'balanced' as FleetProfile,
  quantity: 2,
};

const formatTimestamp = (value: Date | null) =>
  value
    ? new Date(value).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Sin registro';

export const FarmBuilder = () => {
  const {
    bots,
    groups,
    tasks,
    createFarmGroups,
    setGroupStatus,
    rebalanceFleet,
    autoscaleSettings,
    autoscaleState,
    updateAutoscaleSettings,
  } = useBotStore();
  const [form, setForm] = useState(defaultForm);
  const [lastCreatedIds, setLastCreatedIds] = useState<string[]>([]);

  const queueSize = useMemo(
    () => tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length,
    [tasks],
  );

  const profileCounts = useMemo(
    () =>
      groups.reduce(
        (accumulator, group) => {
          accumulator[group.profile] += 1;
          return accumulator;
        },
        { light: 0, balanced: 0, heavy: 0 } as Record<FleetProfile, number>,
      ),
    [groups],
  );

  const efficiencyMap = useMemo(() => {
    const metrics = groups.reduce<
      Record<
        string,
        {
          activeBots: number;
          pausedBots: number;
          failedBots: number;
          efficiencySum: number;
          bots: number;
          taskLoad: number;
          completedTasks: number;
        }
      >
    >((accumulator, group) => {
      accumulator[group.id] = {
        activeBots: 0,
        pausedBots: 0,
        failedBots: 0,
        efficiencySum: 0,
        bots: 0,
        taskLoad: 0,
        completedTasks: 0,
      };
      return accumulator;
    }, {});

    bots.forEach((bot) => {
      const metric = metrics[bot.groupId];
      if (!metric) {
        return;
      }

      metric.bots += 1;
      metric.efficiencySum += bot.efficiency;

      if (bot.status === 'working') {
        metric.activeBots += 1;
      } else if (bot.status === 'paused') {
        metric.pausedBots += 1;
      } else if (bot.status === 'failed') {
        metric.failedBots += 1;
      }
    });

    tasks.forEach((task) => {
      if (!task.assignedGroup || !metrics[task.assignedGroup]) {
        return;
      }

      metrics[task.assignedGroup].taskLoad += 1;
      if (task.status === 'completed') {
        metrics[task.assignedGroup].completedTasks += 1;
      }
    });

    return metrics;
  }, [bots, groups, tasks]);

  const groupRows = useMemo(
    () =>
      groups
        .map((group) => {
          const metrics = efficiencyMap[group.id];
          const averageEfficiency = metrics?.bots ? metrics.efficiencySum / metrics.bots : 0;
          return {
            ...group,
            activeBots: metrics?.activeBots ?? 0,
            pausedBots: metrics?.pausedBots ?? 0,
            failedBots: metrics?.failedBots ?? 0,
            taskLoad: metrics?.taskLoad ?? 0,
            completedTasks: metrics?.completedTasks ?? 0,
            averageEfficiency,
          };
        })
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() || left.name.localeCompare(right.name),
        ),
    [efficiencyMap, groups],
  );

  const projectedBots = getFleetSize(form.profile) * form.quantity;
  const projectedShape = fleetShape[form.profile];
  const totalActiveGroups = groups.filter((group) => group.status === 'active').length;
  const idleBots = useMemo(() => bots.filter((bot) => bot.status === 'idle').length, [bots]);
  const autoscaleProjectedBots = getFleetSize(autoscaleSettings.profile) * autoscaleSettings.growthStep;
  const autoscaleRemainingSlots = Math.max(autoscaleSettings.maxGroups - groups.length, 0);

  const handleCreateFarm = () => {
    const createdIds = createFarmGroups(form);
    setLastCreatedIds(createdIds);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="panel panel-glow rounded-[30px] p-6 sm:p-7"
        >
          <div className="relative z-10">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                  <Factory className="h-4 w-4" />
                  Constructor de granja
                </div>
                <h2 className="mt-4 text-3xl font-semibold text-gradient">Despliega sectores completos desde el dashboard</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Este panel convierte la granja en algo operable: define nombre base, foco, densidad y numero de
                  grupos, y la flota se crea con su cadena de mando completa.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[28rem]">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sectores</p>
                  <p className="mt-3 text-2xl font-semibold text-cyan-100">{groups.length.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-400">{totalActiveGroups.toLocaleString()} activos</p>
                </div>
                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cola</p>
                  <p className="mt-3 text-2xl font-semibold text-violet-100">{queueSize.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-400">Ordenes pendientes o en proceso</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Flota</p>
                  <p className="mt-3 text-2xl font-semibold text-emerald-100">{bots.length.toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-400">Bots cargados ahora mismo</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Nombre base</span>
                  <input
                    value={form.nameBase}
                    onChange={(event) => setForm((current) => ({ ...current, nameBase: event.target.value }))}
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Foco tactico</span>
                  <input
                    value={form.focus}
                    onChange={(event) => setForm((current) => ({ ...current, focus: event.target.value }))}
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-slate-300">Descripcion operativa</span>
                  <input
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Perfil de flota</span>
                  <select
                    value={form.profile}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, profile: event.target.value as FleetProfile }))
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  >
                    <option value="light">Ligero</option>
                    <option value="balanced">Balanceado</option>
                    <option value="heavy">Pesado</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Cantidad de grupos</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: Math.max(1, Math.min(6, Number(event.target.value) || 1)),
                      }))
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateFarm}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/12 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-400/18"
                  >
                    <Factory className="h-4 w-4" />
                    Crear sectores
                  </button>

                  <button
                    type="button"
                    onClick={rebalanceFleet}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/8"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Rebalancear granja
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`rounded-[28px] border p-5 ${profileMeta[form.profile].tone}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Proyeccion</p>
                      <p className={`mt-3 text-2xl font-semibold ${profileMeta[form.profile].chip}`}>
                        {projectedBots.toLocaleString()} bots nuevos
                      </p>
                      <p className="mt-2 text-sm text-slate-300">{profileMeta[form.profile].summary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                      <Bot className={`h-5 w-5 ${profileMeta[form.profile].chip}`} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cadena</p>
                      <p className="mt-2 text-sm text-slate-200">
                        {projectedShape.tenientes} tenientes por grupo y {projectedShape.alferecesPerTeniente}{' '}
                        alfereces por cada teniente.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Escalado</p>
                      <p className="mt-2 text-sm text-slate-200">
                        {projectedShape.sargentosPerAlferez} sargentos por alferez y{' '}
                        {projectedShape.soldadosPerSargento} soldados por sargento.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(Object.keys(profileMeta) as FleetProfile[]).map((profile) => (
                    <div key={profile} className={`rounded-2xl border p-4 ${profileMeta[profile].tone}`}>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{profileMeta[profile].label}</p>
                      <p className={`mt-2 text-xl font-semibold ${profileMeta[profile].chip}`}>
                        {profileCounts[profile].toLocaleString()}
                      </p>
                      <p className="mt-2 text-xs text-slate-300">{getFleetSize(profile).toLocaleString()} bots por grupo</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-cyan-100" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">Ultimo despliegue</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {lastCreatedIds.length > 0
                          ? `Sectores creados: ${lastCreatedIds.join(', ')}`
                          : 'Aun no se han creado sectores nuevos desde este panel.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="panel rounded-[30px] p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 p-3">
                  <Gauge className="h-5 w-5 text-violet-100" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">Pulso de la granja</h3>
                  <p className="mt-1 text-sm text-slate-400">Vista compacta para saber si la expansion entra sana.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: 'Cobertura activa',
                    value: `${totalActiveGroups}/${groups.length || 0} grupos`,
                    progress: groups.length > 0 ? (totalActiveGroups / groups.length) * 100 : 0,
                    tone: 'from-emerald-400 to-cyan-400',
                  },
                  {
                    label: 'Presion de cola',
                    value: `${queueSize.toLocaleString()} ordenes`,
                    progress: Math.min(queueSize * 8, 100),
                    tone: 'from-violet-400 to-cyan-400',
                  },
                  {
                    label: 'Reserva libre',
                    value: `${idleBots.toLocaleString()} bots`,
                    progress: bots.length > 0 ? (idleBots / bots.length) * 100 : 0,
                    tone: 'from-cyan-400 to-blue-500',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-slate-100">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/6">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${item.tone}`}
                        style={{ width: `${Math.max(item.progress, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/18 bg-cyan-400/8 p-4 text-sm leading-6 text-slate-300">
                La granja ya no depende de datos fijos: puedes ampliar sectores, cambiar su estado, reequilibrar la
                eficiencia y dejar el crecimiento automatico bajo reglas claras.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel rounded-[30px] p-6"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full pill-soft px-3 py-2 text-xs text-slate-300">
                    <Cpu className="h-4 w-4 text-cyan-200" />
                    Reproduccion automatica
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-100">Autoscaler de la granja</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Vigila la cola y la reserva libre para desplegar refuerzos sin intervenir a mano.
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${autoscaleStatusMeta[autoscaleState.status].tone}`}
                >
                  {autoscaleStatusMeta[autoscaleState.status].label}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-slate-300">Estado</span>
                  <button
                    type="button"
                    onClick={() => updateAutoscaleSettings({ enabled: !autoscaleSettings.enabled })}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      autoscaleSettings.enabled
                        ? 'border-cyan-400/30 bg-cyan-400/12 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/8'
                    }`}
                  >
                    <span className="font-medium">
                      {autoscaleSettings.enabled ? 'Autoscaler activo' : 'Autoscaler pausado'}
                    </span>
                    <Rocket className="h-4 w-4" />
                  </button>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Perfil de refuerzo</span>
                  <select
                    value={autoscaleSettings.profile}
                    onChange={(event) =>
                      updateAutoscaleSettings({ profile: event.target.value as FleetProfile })
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  >
                    <option value="light">Ligero</option>
                    <option value="balanced">Balanceado</option>
                    <option value="heavy">Pesado</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Grupos por ciclo</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={autoscaleSettings.growthStep}
                    onChange={(event) =>
                      updateAutoscaleSettings({
                        growthStep: Math.max(1, Math.min(6, Number(event.target.value) || 1)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Umbral de cola</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={autoscaleSettings.queueThreshold}
                    onChange={(event) =>
                      updateAutoscaleSettings({
                        queueThreshold: Math.max(1, Math.min(100, Number(event.target.value) || 1)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Reserva minima</span>
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step={100}
                    value={autoscaleSettings.minIdleBots}
                    onChange={(event) =>
                      updateAutoscaleSettings({
                        minIdleBots: Math.max(0, Math.min(100000, Number(event.target.value) || 0)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Cooldown (s)</span>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={autoscaleSettings.cooldownSeconds}
                    onChange={(event) =>
                      updateAutoscaleSettings({
                        cooldownSeconds: Math.max(5, Math.min(600, Number(event.target.value) || 5)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Maximo de grupos</span>
                  <input
                    type="number"
                    min={groups.length}
                    max={99}
                    value={autoscaleSettings.maxGroups}
                    onChange={(event) =>
                      updateAutoscaleSettings({
                        maxGroups: Math.max(groups.length, Math.min(99, Number(event.target.value) || groups.length)),
                      })
                    }
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Nombre base automatico</span>
                  <input
                    value={autoscaleSettings.nameBase}
                    onChange={(event) => updateAutoscaleSettings({ nameBase: event.target.value })}
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm text-slate-300">Foco automatico</span>
                  <input
                    value={autoscaleSettings.focus}
                    onChange={(event) => updateAutoscaleSettings({ focus: event.target.value })}
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Capacidad por disparo</p>
                  <p className="mt-2 text-lg font-semibold text-cyan-100">
                    {autoscaleProjectedBots.toLocaleString()} bots
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    {autoscaleSettings.growthStep} grupos {profileMeta[autoscaleSettings.profile].label.toLowerCase()} por ciclo
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-400/18 bg-violet-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Margen restante</p>
                  <p className="mt-2 text-lg font-semibold text-violet-100">
                    {autoscaleRemainingSlots.toLocaleString()} grupos
                  </p>
                  <p className="mt-2 text-xs text-slate-300">antes de tocar el limite configurado</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <TimerReset className="h-4 w-4 text-cyan-100" />
                  <span>Ultima revision: {formatTimestamp(autoscaleState.lastCheckAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Rocket className="h-4 w-4 text-violet-100" />
                  <span>Ultima expansion: {formatTimestamp(autoscaleState.lastTriggeredAt)}</span>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-3 leading-6 text-slate-300">
                  {autoscaleState.lastReason}
                </div>
                <div className="text-xs text-slate-400">
                  {autoscaleState.lastCreatedIds.length > 0
                    ? `Ultimos grupos creados: ${autoscaleState.lastCreatedIds.join(', ')}`
                    : 'Todavia no hay expansiones automaticas registradas.'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="panel rounded-[30px] p-6 sm:p-7">
        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full pill-soft px-3 py-2 text-xs text-slate-300">
                <Activity className="h-4 w-4 text-cyan-200" />
                Control de sectores
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-100">Gestion directa de cada grupo</h3>
              <p className="mt-2 text-sm text-slate-400">
                Revisa foco, perfil, carga y eficiencia media; despues cambia el estado con un solo toque.
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
              {groupRows.length.toLocaleString()} sectores visibles
            </div>
          </div>

          <div className="mt-6 max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {groupRows.map((group) => (
              <div key={group.id} className="rounded-[26px] border border-white/8 bg-white/4 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-medium text-slate-100">{group.name}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusMeta[group.status].tone}`}>
                        {statusMeta[group.status].label}
                      </span>
                      <span className="rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-xs text-slate-300">
                        {profileMeta[group.profile].label}
                      </span>
                      <span className="rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-xs text-slate-300">
                        {group.id}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">{group.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                      <span>Foco: {group.focus}</span>
                      <span>Creado: {formatTimestamp(group.createdAt)}</span>
                      <span>Tareas cerradas: {group.completedTasks.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[28rem]">
                    <div className="rounded-2xl border border-cyan-400/18 bg-cyan-400/8 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Carga</p>
                      <p className="mt-2 text-lg font-semibold text-cyan-100">{group.activeBots.toLocaleString()}</p>
                      <p className="mt-2 text-xs text-slate-300">
                        activos de {group.totalBots.toLocaleString()} bots
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-400/18 bg-amber-400/8 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cola</p>
                      <p className="mt-2 text-lg font-semibold text-amber-100">{group.taskLoad.toLocaleString()}</p>
                      <p className="mt-2 text-xs text-slate-300">
                        {group.pausedBots.toLocaleString()} pausados, {group.failedBots.toLocaleString()} fallidos
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Eficiencia</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-100">
                        {group.averageEfficiency.toFixed(1)}%
                      </p>
                      <p className="mt-2 text-xs text-slate-300">media del sector</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {actionButtons.map((action) => {
                    const Icon = action.icon;
                    const isCurrent = group.status === action.status;
                    return (
                      <button
                        key={action.status}
                        type="button"
                        onClick={() => setGroupStatus(group.id, action.status)}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                          isCurrent
                            ? 'border-cyan-400/30 bg-cyan-400/12 text-cyan-100'
                            : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/8'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
