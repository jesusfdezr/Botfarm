import { type TabId } from './navigation';

interface BottomNavBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const navItems = [
  { id: 'dashboard' as const, label: 'DASHBOARD', icon: 'grid_view' },
  { id: 'command' as const, label: 'INTEL', icon: 'radar' },
  { id: 'hierarchy' as const, label: 'BARRACKS', icon: 'smart_toy' },
  { id: 'tasks' as const, label: 'DEPLOY', icon: 'rocket_launch' },
  { id: 'integrations' as const, label: 'SYSTEMS', icon: 'dns' },
  { id: 'settings' as const, label: 'CONFIG', icon: 'settings' },
];

export const BottomNavBar = ({ activeTab, setActiveTab }: BottomNavBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch bg-[#111316] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-1 flex-col items-center justify-center py-2 transition-none active:bg-[#00FF41]/20 ${
              isActive
                ? 'border-t-2 border-[#00FF41] bg-[#00FF41]/10 text-[#00FF41]'
                : 'text-[#CADEFF]/50 hover:bg-[#00FF41]/5 hover:text-[#00FF41]'
            }`}
          >
            <span
              className="material-symbols-outlined mb-1"
              data-icon={item.icon}
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="font-['Space_Grotesk'] text-[9px] font-bold tracking-widest uppercase">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
