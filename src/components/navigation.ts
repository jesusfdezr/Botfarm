import type { LucideIcon } from 'lucide-react';
import {
  Globe,
  LayoutDashboard,
  ListChecks,
  Settings,
  TerminalSquare,
  Users,
} from 'lucide-react';

export type TabId = 'dashboard' | 'command' | 'hierarchy' | 'tasks' | 'integrations' | 'settings';

export interface NavigationTab {
  id: TabId;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const navigationTabs: NavigationTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: 'cyan',
  },
  {
    id: 'command',
    label: 'Comando',
    icon: TerminalSquare,
    color: 'violet',
  },
  {
    id: 'hierarchy',
    label: 'Jerarquia',
    icon: Users,
    color: 'blue',
  },
  {
    id: 'tasks',
    label: 'Tareas',
    icon: ListChecks,
    color: 'emerald',
  },
  {
    id: 'integrations',
    label: 'Integraciones',
    icon: Globe,
    color: 'amber',
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: Settings,
    color: 'slate',
  },
];
