import { motion } from 'framer-motion';
import {
  Bell,
  Command,
  Menu,
  Rocket,
} from 'lucide-react';
import { type TabId } from './navigation';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Header = ({ setActiveTab }: HeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[#3b4b37]/30 bg-[#111316] bg-gradient-to-b from-[#111316] to-[#1a1d21] px-4 shadow-[0_0_15px_rgba(0,255,65,0.1)]"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2"
        >
          <Command className="h-6 w-6 text-[#00FF41]" />
          <span className="text-lg font-bold tracking-widest text-[#00FF41] font-['Space_Grotesk'] uppercase">
            BOTFARM COMMAND
          </span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('command')}
          className="hidden items-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-widest text-[#00FF41] transition hover:bg-[#00FF41]/10 active:scale-95 sm:inline-flex uppercase font-['Space_Grotesk']"
        >
          <Rocket className="h-4 w-4" />
          <span>Lanzar</span>
        </button>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center transition hover:bg-[#00FF41]/10 active:scale-95"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5 text-[#CADEFF]" />
        </button>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center transition hover:bg-[#00FF41]/10 active:scale-95 xl:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5 text-[#CADEFF]" />
        </button>
      </div>
    </motion.header>
  );
};
