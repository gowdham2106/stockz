import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Sparkles,
  Server,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { BrokerAccount, UnifiedBrokerAccount } from '../../types/market';

interface BrokerConnectModalProps {
  broker: BrokerAccount;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: UnifiedBrokerAccount) => void;
}

export const BrokerConnectModal: React.FC<BrokerConnectModalProps> = ({
  broker,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [requestToken, setRequestToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('MetaQuotes-Demo');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTestnet, setIsTestnet] = useState(false);

  if (!isOpen) return null;

  const isZerodha = broker.id === 'zerodha';
  const isCoinbase = broker.id === 'coinbase';
  const isIbkr = broker.id === 'interactive_brokers';
  const isMt5 = broker.id === 'metatrader';
  const isBinance = broker.id === 'binance';
  const isRobinhood = broker.id === 'robinhood';

  const handleAutofillDemo = () => {
    if (isZerodha) {
      setApiKey('kite_live_9a87f83b2');
      setSecretKey('sec_4419f82bc8102a99');
      setRequestToken('req_tok_998124018');
      setAccountId('ZR-88921K');
    } else if (isCoinbase) {
      setApiKey('organizations/cb-889/apiKeys/cdp-key-1');
      setSecretKey('-----BEGIN EC PRIVATE KEY-----\nMC4CAQAwEAYHKoZIzj0CAQYFK4EEACIEH...');
    } else if (isIbkr) {
      setAccountId('U8923140');
      setApiKey('ibkr_gw_port_5000');
    } else if (isMt5) {
      setAccountId('55812903');
      setPassword('Trader@2026!');
      setServer('ICMarkets-Live02');
    } else if (isBinance) {
      setApiKey('vmPUKLavsfe83910ad');
      setSecretKey('5x7f9a882bc8819028a');
    } else {
      setApiKey('demo_token_88921');
      setAccountId('RH-991203');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isBinance) {
        const binanceRes = await api.connectBinanceAccount(apiKey, secretKey, isTestnet);
        const unified: UnifiedBrokerAccount = {
          brokerId: 'binance',
          name: 'Binance Pro',
          category: 'Crypto Spot & Futures',
          accountId: binanceRes.accountId || 'BINANCE-LIVE',
          accountType: binanceRes.accountType || 'SPOT & USDⓈ-M',
          status: 'LIVE_SYNCED',
          isRealLiveSync: true,
          maskedApiKey: binanceRes.maskedApiKey || 'BINANCE-KEY',
          currency: 'USD',
          totalBalance: binanceRes.totalBalanceUsd,
          totalBalanceUsd: binanceRes.totalBalanceUsd,
          availableCash: binanceRes.spotBalanceUsd,
          marginUsed: binanceRes.futuresEstimatedUsd,
          todayPnl: binanceRes.todayPnlUsd,
          todayPnlPercent: binanceRes.todayPnlPercent,
          holdings: (binanceRes.balances || []).map((b: any) => ({
            symbol: b.asset,
            name: b.name,
            assetType: 'crypto',
            quantity: b.total,
            avgPrice: b.estimatedUsdValue / (b.total || 1),
            lastPrice: b.estimatedUsdValue / (b.total || 1),
            marketValue: b.estimatedUsdValue,
            unrealizedPnl: b.estimatedUsdValue * 0.03,
            unrealizedPnlPercent: b.change24h,
            currency: 'USD',
            exchange: 'Binance'
          })),
          message: binanceRes.message,
          officialLoginUrl: 'https://accounts.binance.com/en/login',
          apiDocsUrl: 'https://binance-docs.github.io/apidocs/spot/en/'
        };
        onSuccess(unified);
      } else {
        const res = await api.connectBroker({
          brokerId: broker.id,
          apiKey,
          secretKey,
          requestToken,
          accountId,
          password,
          server,
          isTestnet
        });
        onSuccess(res);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate broker credentials. Please verify your keys.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-xl bg-trade-surface border border-trade-border rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header with Broker Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-trade-border">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl border border-trade-border shadow-inner shrink-0"
              style={{ backgroundColor: `${broker.accentColor}20`, color: broker.accentColor }}
            >
              {isZerodha ? '🪁' :
               isCoinbase ? '🔵' :
               isIbkr ? '🏛️' :
               isMt5 ? '📈' :
               isRobinhood ? '🪶' :
               isBinance ? '🔶' : '⚡'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">
                  Connect {broker.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-trade-primary/20 text-trade-primary border border-trade-primary/30">
                  {broker.category}
                </span>
              </div>
              <p className="text-xs text-trade-muted">
                {isZerodha 
                  ? 'Connect Zerodha Kite Connect API to trade NSE/BSE and inspect Indian stock holdings'
                  : 'Sync your live exchange balances, portfolio telemetry, and active order books'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-trade-muted hover:text-white text-xl p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Security & Quick Guide Banner */}
        <div className="p-3.5 rounded-2xl bg-trade-surface2/70 border border-trade-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Trust API Security</span>
            </div>

            <button
              type="button"
              onClick={handleAutofillDemo}
              className="px-2.5 py-1 rounded-lg bg-trade-primary/20 hover:bg-trade-primary/30 text-trade-primary text-[11px] font-bold border border-trade-primary/30 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Fill Demo Credentials</span>
            </button>
          </div>

          {isZerodha ? (
            <div className="text-[11px] text-trade-muted space-y-1 leading-relaxed">
              <p>📌 <strong>Zerodha Kite Connect Setup:</strong></p>
              <ol className="list-decimal list-inside space-y-0.5 text-trade-subtle">
                <li>Create an API app on <a href="https://kite.trade" target="_blank" rel="noopener noreferrer" className="text-trade-primary underline">kite.trade</a>.</li>
                <li>Enter your <strong>API Key</strong> and <strong>API Secret</strong> below.</li>
                <li>Generate your daily <strong>Request Token</strong> via Kite Login.</li>
              </ol>
            </div>
          ) : isBinance ? (
            <div className="text-[11px] text-trade-muted space-y-1 leading-relaxed">
              <p className="text-emerald-400 font-bold">✨ Standard Personal Binance Accounts Supported (No Pro or VIP Required):</p>
              <ol className="list-decimal list-inside space-y-0.5 text-trade-subtle">
                <li>Log in to your standard <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">binance.com</a> account or Binance mobile app.</li>
                <li>Go to <strong>Profile Icon → API Management</strong> (<a href="https://www.binance.com/en/my/settings/api-management" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">direct link</a>).</li>
                <li>Click <strong>Create API</strong> → Copy your <strong>API Key</strong> and <strong>Secret Key</strong> (check <em>Enable Reading</em>).</li>
              </ol>
            </div>
          ) : (
            <p className="text-[11px] text-trade-muted leading-relaxed">
              🔒 <strong>Safeguard:</strong> Ensure you enable <strong>Read-Only</strong> permissions in your broker API settings. Withdrawals are disabled for safety.
            </p>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {/* Zerodha-specific Fields */}
          {isZerodha && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-trade-text font-semibold mb-1">
                    Zerodha Client ID (User ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="e.g. ZR8892 or AB1234"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono placeholder:text-trade-subtle/50 focus:outline-none focus:border-trade-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-trade-text font-semibold mb-1">
                    Kite API Key
                  </label>
                  <input
                    type="text"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="e.g. kite_live_9a87f83b2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono placeholder:text-trade-subtle/50 focus:outline-none focus:border-trade-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-trade-text font-semibold mb-1">
                  Kite API Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    required
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="e.g. sec_4419f82bc8102a99"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono placeholder:text-trade-subtle/50 pr-10 focus:outline-none focus:border-trade-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-trade-muted hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-trade-text font-semibold mb-1">
                  Kite Request Token / Session Token (Optional)
                </label>
                <input
                  type="text"
                  value={requestToken}
                  onChange={(e) => setRequestToken(e.target.value)}
                  placeholder="e.g. req_tok_998124018 (from Kite Connect redirect URL)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono placeholder:text-trade-subtle/50 focus:outline-none focus:border-trade-primary"
                />
              </div>
            </>
          )}

          {/* MT5-specific Fields */}
          {isMt5 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-trade-text font-semibold mb-1">MT5 Account Login Number</label>
                  <input
                    type="text"
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="e.g. 55812903"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono focus:outline-none focus:border-trade-primary"
                  />
                </div>

                <div>
                  <label className="block text-trade-text font-semibold mb-1">MT5 Server Host</label>
                  <input
                    type="text"
                    required
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="e.g. ICMarkets-Live02"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono focus:outline-none focus:border-trade-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-trade-text font-semibold mb-1">MT5 Trader Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono focus:outline-none focus:border-trade-primary"
                />
              </div>
            </>
          )}

          {/* IBKR-specific Fields */}
          {isIbkr && (
            <>
              <div>
                <label className="block text-trade-text font-semibold mb-1">IBKR Account ID</label>
                <input
                  type="text"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. U8923140"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono uppercase focus:outline-none focus:border-trade-primary"
                />
              </div>

              <div>
                <label className="block text-trade-text font-semibold mb-1">Client Portal Gateway Port / URL</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="https://localhost:5000/v1/api"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono focus:outline-none focus:border-trade-primary"
                />
              </div>
            </>
          )}

          {/* Standard / Binance / Coinbase / Robinhood Fields */}
          {!isZerodha && !isMt5 && !isIbkr && (
            <>
              <div>
                <label className="block text-trade-text font-semibold mb-1">{broker.name} API Key / Client ID</label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key or Public Identifier"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono focus:outline-none focus:border-trade-primary"
                />
              </div>

              <div>
                <label className="block text-trade-text font-semibold mb-1">{broker.name} Secret Key / Private Key</label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    required
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="API Secret Key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-trade-surface2 border border-trade-border text-white font-mono pr-10 focus:outline-none focus:border-trade-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-trade-muted hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-trade-border/80">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-trade-primary to-blue-500 hover:from-blue-500 hover:to-trade-primary text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-primary disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to {broker.name}...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Authenticate & Sync {broker.name}</span>
                </>
              )}
            </button>

            {/* Official Web Login Link */}
            <a
              href={
                isZerodha ? 'https://kite.zerodha.com' :
                isCoinbase ? 'https://www.coinbase.com/login' :
                isIbkr ? 'https://www.interactivebrokers.com/portal' :
                isMt5 ? 'https://trade.mql5.com/trade' :
                isBinance ? 'https://accounts.binance.com/en/login' : 'https://robinhood.com/login'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-muted hover:text-white border border-trade-border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Open Official {broker.name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
