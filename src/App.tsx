'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BellRing,
  ChevronDown,
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
import { navigationTabs, type TabId } from './components/navigation';

const SettingsPanel = () => {
  const { groups, tasks, getStats } = useBotStore();
  const stats = getStats();
  const activeGroups = groups.filter((group) => group.status === 'active').length;
  const queueSize = tasks.filter((task) => task.status === 'pending' || task.status === 'processing').length;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    performance: true,
    parameters: false,
    deployment: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const systemCards = [
    {
      title: 'Bots',
      value: stats.totalBots,
      detail: `${stats.activeBots} activos`,
      icon: Gauge,
      gradient: 'from-cyan-400 to-blue-500',
    },
    {
      title: 'Grupos',
      value: `${activeGroups}/${groups.length}`,
      detail: 'activos',
      icon: Workflow,
      gradient: 'from-violet-400 to-purple-500',
    },
    {
      title: 'Seguridad',
      value: 'OK',
      detail: 'Guardias activas',
      icon: ShieldCheck,
      gradient: 'from-emerald-400 to-green-500',
    },
    {
      title: 'Cola',
      value: queueSize,
      detail: 'pendientes',
      icon: BellRing,
      gradient: 'from-amber-400 to-orange-500',
    },
  ];

  const inputs = [
    { label: 'Grupos', defaultValue: groups.length || 10, min: 1, max: 50, icon: Workflow },
    { label: 'Intervalo (ms)', defaultValue: 450, min: 100, max: 5000, icon: SlidersHorizontal },
    { label: 'Bots/lote', defaultValue: 48, min: 8, max: 200, icon: Gauge },
    { label: 'Alerta (%)', defaultValue: 85, min: 50, max: 100, icon: BellRing },
  ];

  return (
    <div className="space-y-4">
      {/* System Status Cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {systemCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[16px] bg-gradient-to-br ${card.gradient} p-4 text-white shadow-lg`}
            >
              <Icon className="mb-2 h-5 w-5 text-white/70" />
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">{card.title}</p>
              <p className="mt-0.5 text-[10px] text-white/60">{card.detail}</p>
            </motion.div>
          );
        })}
      </section>

      {/* Parameters Section */}
      <section className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
        <button
          onClick={() => toggleSection('parameters')}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
              <Settings className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-white">Parametros</p>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.parameters ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.parameters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {inputs.map((input) => {
                  const Icon = input.icon;
                  return (
                    <div key={input.label} className="rounded-xl bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-400">{input.label}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{input.defaultValue}</span>
                      </div>
                      <input
                        type="range"
                        min={input.min}
                        max={input.max}
                        defaultValue={input.defaultValue}
                        className="slider w-full accent-cyan-400"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="mb-2 text-xs text-slate-400">Modo despliegue</p>
                  <select className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white outline-none">
                    <option value="stable" className="bg-slate-800">Operacion estable</option>
                    <option value="progressive" className="bg-slate-800">Escalado progresivo</option>
                    <option value="testing" className="bg-slate-800">Pruebas controladas</option>
                  </select>
                </div>

                <div className="rounded-xl bg-white/5 p-4">
                  <p className="mb-2 text-xs text-slate-400">Notificaciones</p>
                  <select className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white outline-none">
                    <option value="critical" className="bg-slate-800">Solo criticas</option>
                    <option value="all" className="bg-slate-800">Actividad y alertas</option>
                    <option value="summary" className="bg-slate-800">Resumen horario</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
                  <Save className="h-4 w-4" />
                  Guardar
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                  <RefreshCcw className="h-4 w-4" />
                  Restablecer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Status & Progress Bars */}
      <section className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl">
        <button
          onClick={() => toggleSection('performance')}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-white">Estado</p>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.performance ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.performance && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="space-y-4">
                {[
                  {
                    label: 'Bots disponibles',
                    value: `${(stats.totalBots - stats.activeBots).toLocaleString()} libres`,
                    progress: stats.totalBots > 0 ? ((stats.totalBots - stats.activeBots) / stats.totalBots) * 100 : 0,
                    gradient: 'from-cyan-400 to-blue-500',
                  },
                  {
                    label: 'Exito',
                    value: `${stats.successRate.toFixed(1)}%`,
                    progress: stats.successRate,
                    gradient: 'from-emerald-400 to-green-500',
                  },
                  {
                    label: 'Carga cola',
                    value: `${queueSize} elementos`,
                    progress: Math.min(queueSize * 6, 100),
                    gradient: 'from-violet-400 to-purple-500',
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${item.gradient}`}
                        style={{ width: `${Math.max(item.progress, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-[rgba(6,10,18,0.92)] p-3 backdrop-blur xl:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-2">
          {navigationTabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3 py-3 text-center transition ${isActive
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md'
                    : 'bg-white/5 text-slate-400'
                  }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
