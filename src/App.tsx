'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  Gauge,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react';
import { BotHierarchy } from './components/BotHierarchy';
import { CommandInterface } from './components/CommandInterface';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import IntegrationHub from './components/IntegrationHub';
import { Sidebar } from './components/Sidebar';
import { TaskManager } from './components/TaskManager';
import { useBotStore } from './store/botStore';

type TabId = 'dashboard' | 'command' | 'hierarchy' | 'tasks' | 'integrations' | 'settings';

const SettingsPanel = () => {
  const { groups, tasks, getStats } = useBotStore();
  const stats = getStats();
  const activeGroups = groups.filter((group) => group.status === 'active').length;
  const queueSize = tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;

  const systemCards = [
    {
      title: 'Rendimiento',
      value: `${stats.totalBots.toLocaleString()} bots`,
      detail: `${stats.activeBots.toLocaleString()} en ejecucion simultanea`,
      icon: Gauge,
      tone: 'text-cyan-200',
      surface: 'border-cyan-400/20 bg-cyan-400/8',
    },
    {
      title: 'Cobertura',
      value: `${activeGroups}/${groups.length} grupos`,
      detail: 'Balanceo automatico y capacidad disponible',
      icon: Workflow,
      tone: 'text-violet-200',
      surface: 'border-violet-400/20 bg-violet-400/8',
    },
    {
      title: 'Seguridad',
      value: 'Guardias activas',
      detail: 'Panel listo para auditoria y alertas',
      icon: ShieldCheck,
      tone: 'text-emerald-200',
      surface: 'border-emerald-400/20 bg-emerald-400/8',
    },
    {
      title: 'Cola activa',
      value: queueSize.toLocaleString(),
      detail: 'Ordenes pendientes y en proceso',
      icon: BellRing,
      tone: 'text-amber-200',
      surface: 'border-amber-400/20 bg-amber-400/8',
    },
  ];

  const inputs = [
    { label: 'Grupos disponibles', defaultValue: groups.length || 10, min: 1, max: 50 },
    { label: 'Intervalo de ejecucion (ms)', defaultValue: 450, min: 100, max: 5000 },
    { label: 'Bots por lote', defaultValue: 48, min: 8, max: 200 },
    { label: 'Alertas por uso (%)', defaultValue: 85, min: 50, max: 100 },
  ];

  return (
    <div className="space-y-6">
      <section className="panel panel-glow rounded-[28px] p-6 sm:p-7">
        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full pill-glow px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <SlidersHorizontal className="h-4 w-4" />
              Centro de configuracion
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-gradient">Sistema estable y listo para ajustar</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Reorganice esta vista para que los controles se lean mejor, las prioridades esten claras y los
              indicadores utiles queden a la vista sin ruido.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-xl">
            {systemCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl border p-4 backdrop-blur ${card.surface}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.title}</p>
                      <p className={`mt-2 text-xl font-semibold ${card.tone}`}>{card.value}</p>
                      <p className="mt-2 text-sm text-slate-400">{card.detail}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <Icon className={`h-5 w-5 ${card.tone}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel rounded-[28px] p-6 sm:p-7">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3">
                <Settings className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Parametros del orquestador</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Ajustes presentados con una jerarquia mas limpia y legible.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {inputs.map((input) => (
                <label key={input.label} className="space-y-2">
                  <span className="text-sm text-slate-300">{input.label}</span>
                  <input
                    type="number"
                    min={input.min}
                    max={input.max}
                    defaultValue={input.defaultValue}
                    className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-slate-300">Modo de despliegue</span>
                <select className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15">
                  <option>Operacion estable</option>
                  <option>Escalado progresivo</option>
                  <option>Pruebas controladas</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm text-slate-300">Politica de notificaciones</span>
                <select className="w-full rounded-2xl border border-white/8 bg-slate-950/65 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/15">
                  <option>Solo incidencias criticas</option>
                  <option>Actividad y alertas</option>
                  <option>Resumen horario</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/12 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-400/18">
                <Save className="h-4 w-4" />
                Guardar configuracion
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/8">
                <RefreshCcw className="h-4 w-4" />
                Restablecer valores
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="panel rounded-[28px] p-6">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-slate-100">Estado operativo</h3>
              <div className="mt-5 space-y-4">
                {[
                  {
                    label: 'Bots listos para nueva tarea',
                    value: `${(stats.totalBots - stats.activeBots).toLocaleString()} libres`,
                    progress: stats.totalBots > 0 ? ((stats.totalBots - stats.activeBots) / stats.totalBots) * 100 : 0,
                    tone: 'from-cyan-400 to-blue-500',
                  },
                  {
                    label: 'Exito acumulado',
                    value: `${stats.successRate.toFixed(1)}%`,
                    progress: stats.successRate,
                    tone: 'from-emerald-400 to-cyan-400',
                  },
                  {
                    label: 'Carga de la cola',
                    value: `${queueSize} elementos`,
                    progress: Math.min(queueSize * 6, 100),
                    tone: 'from-violet-400 to-cyan-400',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
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
            </div>
          </section>

          <section className="panel rounded-[28px] p-6">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-slate-100">Checklist visual</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3">
                  Contraste oscuro con neones suaves y paneles consistentes.
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-4 py-3">
                  Jerarquia simplificada para evitar vistas pesadas o confusas.
                </div>
                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/8 px-4 py-3">
                  Controles y tarjetas revisados para verse bien en movil y escritorio.
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const initializeBots = useBotStore((state) => state.initializeBots);
  const runAutoscaleCycle = useBotStore((state) => state.runAutoscaleCycle);

  useEffect(() => {
    initializeBots();
  }, [initializeBots]);

  useEffect(() => {
    runAutoscaleCycle();

    const intervalId = window.setInterval(() => {
      runAutoscaleCycle();
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runAutoscaleCycle]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || params.has('error')) {
      setActiveTab('integrations');
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'command':
        return <CommandInterface />;
      case 'hierarchy':
        return <BotHierarchy />;
      case 'tasks':
        return <TaskManager />;
      case 'integrations':
        return <IntegrationHub />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-6 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="surface-grid absolute inset-0 opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <Header />

        <div className="mt-4 flex flex-1 flex-col gap-4 xl:flex-row">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
