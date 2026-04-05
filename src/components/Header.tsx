import { motion } from 'framer-motion';
import {
  Bell,
  Command,
  Menu,
  Rocket,
} from 'lucide-react';
import { navigationTabs, type TabId } from './navigation';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] bg-gradient-to-r from-slate-900/90 to-slate-800/90 px-3 py-3 backdrop-blur-xl sm:px-4 sm:py-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30"
            aria-label="Ir al dashboard"
          >
            <Command className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Granja Bots</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-300">Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation - Icon-only */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-xl bg-white/5 px-2 py-1.5">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all ${isActive
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon className="h-5 w-5" />
                {/* Tooltip */}
                <span
                  className={`pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity ${isActive ? 'opacity-100' : 'group-hover:opacity-100'
                    }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('command')}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30 sm:inline-flex"
          >
            <Rocket className="h-4 w-4" />
            <span>Lanzar</span>
          </button>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
              3
            </span>
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white xl:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Scrollable Nav */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${isActive
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.header>
  );
};
