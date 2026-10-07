import React from 'react';
import { 
  Building2,
  Wallet,
  LayoutDashboard, 
  Globe2, 
  CandlestickChart, 
  Bookmark, 
  PieChart 
} from 'lucide-react';
import { useMarket, PageId } from '../../context/MarketContext';

export const MobileBottomNav: React.FC = () => {
  const { activePage, setActivePage } = useMarket();

  const navItems: { page: PageId; label: string; icon: React.ElementType }[] = [
    { page: 'landing', label: 'Brokers', icon: Building2 },
    { page: 'wallet', label: 'Wallet', icon: Wallet },
    { page: 'terminal', label: 'Terminal', icon: CandlestickChart },
    { page: 'dashboard', label: 'Pulse', icon: LayoutDashboard },
    { page: 'markets', label: 'Markets', icon: Globe2 },
    { page: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-trade-surface/95 backdrop-blur-lg border-t border-trade-border flex items-center justify-around px-1 py-1.5 shadow-2xl safe-area-bottom">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activePage === item.page;

        return (
          <button
            key={item.page}
            onClick={() => setActivePage(item.page)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
              isActive
                ? 'text-trade-primary font-semibold'
                : 'text-trade-muted hover:text-trade-text'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-trade-primary' : ''}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-trade-primary shadow-glow-primary" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
