import React from 'react';
import { MarketProvider, useMarket } from './context/MarketContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { BrokerLandingPage } from './pages/BrokerLandingPage';
import { BrokerWalletPage } from './pages/BrokerWalletPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketsPage } from './pages/MarketsPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { ScannerPage } from './pages/ScannerPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AiInsightsPage } from './pages/AiInsightsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

const PageRenderer: React.FC = () => {
  const { activePage } = useMarket();

  switch (activePage) {
    case 'landing':
      return <BrokerLandingPage />;
    case 'wallet':
      return <BrokerWalletPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'markets':
      return <MarketsPage />;
    case 'terminal':
      return <AssetDetailPage />;
    case 'watchlist':
      return <WatchlistPage />;
    case 'scanner':
      return <ScannerPage />;
    case 'portfolio':
      return <PortfolioPage />;
    case 'ai-insights':
      return <AiInsightsPage />;
    case 'alerts':
      return <AlertsPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <BrokerLandingPage />;
  }
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <MarketProvider>
        <AppLayout>
          <ErrorBoundary>
            <PageRenderer />
          </ErrorBoundary>
        </AppLayout>
      </MarketProvider>
    </ErrorBoundary>
  );
};

export default App;
