import React from 'react';
import { TopNavbar } from '../navigation/TopNavbar';
import { Sidebar } from '../navigation/Sidebar';
import { MobileBottomNav } from '../navigation/MobileBottomNav';
import { LiveTickerMarquee } from '../market/LiveTickerMarquee';
import { GlobalSearchModal } from '../market/GlobalSearchModal';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-trade-bg text-trade-text flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Top Navigation */}
      <TopNavbar />

      {/* Live Market Scrolling Ticker */}
      <LiveTickerMarquee />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Collapsible Sidebar */}
        <Sidebar />

        {/* Dynamic Center Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8 max-w-full">
          {children}
        </main>
      </div>

      {/* Purpose-Built Mobile Bottom Bar */}
      <MobileBottomNav />

      {/* Global Quick Search Overlay */}
      <GlobalSearchModal />
    </div>
  );
};
