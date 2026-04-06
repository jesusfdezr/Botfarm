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
import { BottomNavBar } from './components/BottomNavBar';
import { CommandInterface } from './components/CommandInterface';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import IntegrationHub from './components/IntegrationHub';
import { TaskManager } from './components/TaskManager';
import { useBotStore } from './store/botStore';
import { type TabId } from './components/navigation';

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
      title: 'BOTS',
      value: stats.totalBots,
      detail: `${stats.activeBots} activos`,
      icon: Gauge,
      border: 'border-[#00ff41]',
      text: 'text-[#00ff41]',
    },
    {
      title: 'GRUPOS',
      value: `${activeGroups}/${groups.length}`,
      detail: 'activos',
      icon: Workflow,
      border: 'border-[#cadeff]',
      text: 'text-[#cadeff]',
    },
    {
      title: 'SEGURIDAD',
      value: 'OK',
      detail: 'Guardias activas',
      icon: ShieldCheck,
      border: 'border-[#00ff41]',
      text: 'text-[#00ff41]',
    },
    {
      title: 'COLA',
      value: queueSize,
      detail: 'pendientes',
      icon: BellRing,
      border: 'border-[#fd8b00]',
      text: 'text-[#fd8b00]',
    },
  ];

  const inputs = [
    { label: 'Grupos', defaultValue: groups.length || 10, min: 1, max: 50, icon: Workflow },
    { label: 'Intervalo (ms)', defaultValue: 450, min: 100, max: 5000, icon: SlidersHorizontal },
    { label: 'Bots/lote', defaultValue: 48, min: 8, max: 200, icon: Gauge },
    { label: 'Alerta (%)', defaultValue: 85, min: 50, max: 100, icon: BellRing },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 telemetry-grid pointer-events-none"></div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-24 md:px-8">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="bg-[#0c0e11] p-6 border-l-4 border-[#00ff41] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <ShieldCheck className="h-[120px] w-[120px] text-[#00ff41]" />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
              <div className="w-full md:w-2/3">
                <p className="text-xs font-['Space_Grotesk'] tracking-[0.2em] text-[#84967e] mb-2 uppercase">STRATEGIC COMMAND OVERVIEW</p>
                <h2 className="text-4xl font-['Space_Grotesk'] font-bold tracking-tighter mb-4 text-[#e2e2e6] uppercase">SYSTEM INTEGRITY</h2>
                <div className="h-4 bg-[#333538] w-full relative">
                  <div className="h-full bg-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.5)] w-[84%] relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] opacity-30"></div>
                  </div>
                </div>
              </div>
              <div className="flex gap-8 tabular-nums">
                <div>
                  <p className="text-[10px] text-[#84967e] mb-1">LATENCY</p>
                  <p className="text-xl font-['Space_Grotesk'] font-medium text-[#00ff41]">12MS</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#84967e] mb-1">UPTIME</p>
                  <p className="text-xl font-['Space_Grotesk'] font-medium">99.98%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {systemCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-[#1a1c1f] p-5 border-l-2 relative group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-2 ${card.border} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 ${card.text}`} />
                  </div>
                  <span className="text-[10px] font-['Space_Grotesk'] border border-[#3b4b37] px-2 py-0.5 text-[#84967e] uppercase">LIVE</span>
                </div>
                <p className="text-xs text-[#84967e] font-['Space_Grotesk'] tracking-widest uppercase">{card.title}</p>
                <h3 className="text-3xl font-['Space_Grotesk'] font-extrabold tabular-nums text-[#00ff41] mb-2">{card.value}</h3>
                <div className="flex items-center gap-2 text-[10px] text-[#00ff41]">
                  <span>{card.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Config Sections */}
        <div className="space-y-6">
          {/* Parameters */}
          <section className="bg-[#1a1c1f] p-6 border-l-2 border-[#00ff41]">
            <button
              onClick={() => toggleSection('parameters')}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-[#00ff41]" />
                <h3 className="font-['Space_Grotesk'] font-bold tracking-widest uppercase text-[#00ff41]">Mission Configuration</h3>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.parameters ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[#84967e]"
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
                  className="mt-6 overflow-hidden"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {inputs.map((input) => {
                      const Icon = input.icon;
                      return (
                        <div key={input.label} className="bg-[#0c0e11] p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-[#84967e]" />
                              <span className="text-xs text-[#84967e] uppercase tracking-widest">{input.label}</span>
                            </div>
                            <span className="text-sm font-bold text-[#00ff41] tabular-nums">{input.defaultValue}</span>
                          </div>
                          <input
                            type="range"
                            min={input.min}
                            max={input.max}
                            defaultValue={input.defaultValue}
                            className="w-full accent-[#00ff41]"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="bg-[#0c0e11] p-4">
                      <p className="mb-2 text-xs text-[#84967e] uppercase tracking-widest">Protocol</p>
                      <select className="w-full bg-[#333538] px-3 py-3 text-sm text-[#e2e2e6] outline-none focus:border-[#00ff41] border-b-2 border-[#3b4b37] font-mono">
                        <option value="stable" className="bg-[#1a1c1f]">Operacion estable</option>
                        <option value="progressive" className="bg-[#1a1c1f]">Escalado progresivo</option>
                        <option value="testing" className="bg-[#1a1c1f]">Pruebas controladas</option>
                      </select>
                    </div>

                    <div className="bg-[#0c0e11] p-4">
                      <p className="mb-2 text-xs text-[#84967e] uppercase tracking-widest">Notifications</p>
                      <select className="w-full bg-[#333538] px-3 py-3 text-sm text-[#e2e2e6] outline-none focus:border-[#00ff41] border-b-2 border-[#3b4b37] font-mono">
                        <option value="critical" className="bg-[#1a1c1f]">Solo criticas</option>
                        <option value="all" className="bg-[#1a1c1f]">Actividad y alertas</option>
                        <option value="summary" className="bg-[#1a1c1f]">Resumen horario</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 bg-[#00ff41] text-[#003907] px-6 py-3 text-xs font-bold tracking-widest uppercase font-['Space_Grotesk'] hover:brightness-110 active:scale-[0.98] transition-all">
                      <Save className="h-4 w-4" />
                      Execute Save
                    </button>
                    <button className="flex items-center gap-2 border border-[#84967e]/30 text-[#84967e] px-6 py-3 text-xs font-bold tracking-widest uppercase font-['Space_Grotesk'] hover:bg-[#333538] transition-all">
                      <RefreshCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Performance */}
          <section className="bg-[#1a1c1f] p-6 border-l-2 border-[#00ff41]/30">
            <button
              onClick={() => toggleSection('performance')}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-[#00ff41]" />
                <h3 className="font-['Space_Grotesk'] font-bold tracking-widest uppercase text-[#00ff41]">Threat Response</h3>
              </div>
              <motion.div
                animate={{ rotate: expandedSections.performance ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[#84967e]"
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
                  className="mt-6 overflow-hidden"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      {
                        label: 'AUTO-RESPONSE',
                        value: `${(stats.totalBots - stats.activeBots).toLocaleString()} libres`,
                        progress: stats.totalBots > 0 ? ((stats.totalBots - stats.activeBots) / stats.totalBots) * 100 : 0,
                        border: 'border-[#00ff41]',
                        text: 'text-[#00ff41]',
                      },
                      {
                        label: 'SUCCESS RATE',
                        value: `${stats.successRate.toFixed(1)}%`,
                        progress: stats.successRate,
                        border: 'border-[#00ff41]',
                        text: 'text-[#00ff41]',
                      },
                      {
                        label: 'FIREWALL',
                        value: `${queueSize} elementos`,
                        progress: Math.min(queueSize * 6, 100),
                        border: 'border-[#fd8b00]',
                        text: 'text-[#fd8b00]',
                      },
                    ].map((item) => (
                      <div key={item.label} className={`bg-[#0c0e11] p-4 border-l ${item.border}`}>
                        <p className="text-[10px] text-[#84967e] mb-1 uppercase tracking-widest">{item.label}</p>
                        <p className={`text-sm font-bold uppercase ${item.text}`}>{item.value}</p>
                        <div className="h-1 bg-[#333538] mt-2">
                          <div
                            className={`h-1 bg-[#00ff41]`}
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
      </div>
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
    <div className="relative min-h-screen overflow-hidden bg-[#111316]">
      <div className="pointer-events-none fixed inset-0 telemetry-grid opacity-50"></div>

      <div className="relative">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="pt-16">
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

      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
