import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Rocket,
  Settings2,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { navigationTabs, type TabId } from './navigation';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const [showQuickActions, setShowQuickActions] = useState(true);

  const quickActions = [
    { label: 'Nueva orden', icon: Rocket, tab: 'command' as const, gradient: 'from-cyan-400 to-blue-500' },
    { label: 'Ajustar sistema', icon: Wrench, tab: 'settings' as const, gradient: 'from-violet-400 to-purple-500' },
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full xl:w-[260px] xl:flex-none"
    >
      <div className="rounded-[20px] bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-4 backdrop-blur-xl">
        {/* Navigation Menu */}
        <div className="mb-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Menu</span>
          </div>

          <div className="space-y-1">
            {navigationTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
                      ? 'bg-gradient-to-r from-cyan-400/20 to-blue-500/20 text-cyan-300 shadow-[inset_3px_0_0_rgba(34,211,238,0.5)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${isActive
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md'
                        : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{tab.label}</span>
                  {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions - Collapsible */}
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 hover:text-slate-400"
          >
            <span>Acciones rapidas</span>
            {showQuickActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => setActiveTab(action.tab)}
                      className="group flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} text-white shadow-md`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span>{action.label}</span>
                      <Play className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="rounded-xl bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 p-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Sistema operativo</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400">Todos los servicios activos</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
