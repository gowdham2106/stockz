import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CandlestickChart, 
  Globe2, 
  SlidersHorizontal, 
  Bookmark, 
  PieChart, 
  ClipboardList, 
  Crosshair, 
  History, 
  BellRing, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Wallet,
  Building2,
  Bot
} from 'lucide-react';
import { useMarket, PageId } from '../../context/MarketContext';

interface SidebarItem {
  id: PageId | string;
  label: string;
  icon: React.ElementType;
  page?: PageId;
  comingSoon?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage } = useMarket();
  const [collapsed, setCollapsed] = useState(false);

  const groups: SidebarGroup[] = [
    {
      title: 'GATEWAY & ACCOUNT',
      items: [
        { id: 'landing', label: 'Broker Gateway', icon: Building2, page: 'landing' },
        { id: 'wallet', label: 'Account Wallet', icon: Wallet, page: 'wallet' },
      ]
    },
    {
      title: 'TERMINAL & MARKETS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
        { id: 'terminal', label: 'Pro Terminal', icon: CandlestickChart, page: 'terminal' },
        { id: 'markets', label: 'All Markets', icon: Globe2, page: 'markets' },
      ]
    },
    {
      title: 'TRADING (SIMULATED)',
      items: [
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark, page: 'watchlist' },
        { id: 'portfolio', label: 'Portfolio Simulation', icon: PieChart, page: 'portfolio' },
        { id: 'orders', label: 'Live Orders', icon: ClipboardList, comingSoon: true },
        { id: 'positions', label: 'Positions', icon: Crosshair, comingSoon: true },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'scanner', label: 'Market Scanner', icon: SlidersHorizontal, page: 'scanner' },
        { id: 'ai-insights', label: 'AI Market Lab', icon: Bot, page: 'ai-insights' },
        { id: 'backtesting', label: 'Backtesting Engine', icon: History, comingSoon: true },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'alerts', label: 'Alerts', icon: BellRing, page: 'alerts' },
        { id: 'settings', label: 'Settings', icon: Settings, page: 'settings' },
      ]
    }
  ];

  return (
    <aside className={`hidden md:flex flex-col shrink-0 bg-trade-surface border-r border-trade-border transition-all duration-300 select-none z-30 ${
      collapsed ? 'w-16' : 'w-56'
    }`}>
      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold text-trade-subtle tracking-wider uppercase">
                {group.title}
              </div>
            )}

            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = item.page === activePage;

              if (item.comingSoon) {
                return (
                  <div
                    key={item.id}
                    title={collapsed ? `${item.label} (Coming Soon)` : undefined}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl text-trade-subtle/60 cursor-not-allowed text-xs font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 opacity-50 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-trade-surface3 border border-trade-border text-trade-subtle/70 uppercase">
                        Soon
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => item.page && setActivePage(item.page)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-trade-primary text-white shadow-glow-primary font-semibold'
                      : 'text-trade-muted hover:text-trade-text hover:bg-trade-surface2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-trade-muted group-hover:text-trade-primary group-hover:scale-105'
                    }`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {isActive && !collapsed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white]" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-trade-border bg-trade-surface2/40 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-1.5 text-[10px] text-trade-subtle px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>.NET 8 Gateway</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-trade-surface3 text-trade-muted hover:text-trade-text transition-colors mx-auto"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
