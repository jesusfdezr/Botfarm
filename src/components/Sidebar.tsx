import { motion } from 'framer-motion';
import {
  Globe,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Target,
  TerminalSquare,
  Users,
} from 'lucide-react';

type TabId = 'dashboard' | 'command' | 'hierarchy' | 'tasks' | 'integrations' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const tabs = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    description: 'Vision general y metricas',
    icon: LayoutDashboard,
  },
  {
    id: 'command' as const,
    label: 'Comando',
    description: 'Ordenes y registro vivo',
    icon: TerminalSquare,
  },
  {
    id: 'hierarchy' as const,
    label: 'Jerarquia',
    description: 'Cadena de mando y roster',
    icon: Users,
  },
  {
    id: 'tasks' as const,
    label: 'Tareas',
    description: 'Cola, prioridad y progreso',
    icon: ListChecks,
  },
  {
    id: 'integrations' as const,
    label: 'Integraciones',
    description: 'Plataformas y claves',
    icon: Globe,
  },
  {
    id: 'settings' as const,
    label: 'Ajustes',
    description: 'Parametros y controles',
    icon: Settings,
  },
];

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className="xl:w-[300px] xl:flex-none"
    >
      <div className="panel rounded-[28px] p-4 sm:p-5">
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Navegacion</p>
              <p className="mt-2 text-sm text-slate-400">Acceso rapido y consistente entre vistas.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
              <Sparkles className="h-5 w-5 text-cyan-200" />
            </div>
          </div>

          <div className="nav-scroll -mx-1 flex gap-3 overflow-x-auto px-1 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group min-w-[220px] rounded-2xl border px-4 py-4 text-left transition xl:min-w-0 ${
                    isActive
                      ? 'border-cyan-400/30 bg-cyan-400/12 shadow-[0_0_28px_rgba(106,230,255,0.09)]'
                      : 'border-white/6 bg-white/4 hover:border-white/12 hover:bg-white/6'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-2xl border p-3 ${
                        isActive
                          ? 'border-cyan-400/30 bg-slate-950/70 text-cyan-200'
                          : 'border-white/8 bg-slate-950/50 text-slate-300 group-hover:text-slate-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isActive ? 'text-slate-50' : 'text-slate-200'}`}>{tab.label}</p>
                        {isActive ? <span className="h-2 w-2 rounded-full bg-cyan-300" /> : null}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-400">{tab.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-violet-400/18 bg-violet-400/8 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
                <Target className="h-4 w-4" />
                Objetivo visual
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Mantener un flujo claro, menos ruido y mejores jerarquias para trabajar sin friccion.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/18 bg-emerald-400/8 p-4">
              <p className="text-sm font-medium text-emerald-100">Estado de capa UI</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Tarjetas coherentes, contraste controlado y tema oscuro unificado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
