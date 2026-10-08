import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  UTCTimestamp, 
  LineData,
  CandlestickSeries,
  LineSeries,
  HistogramSeries
} from 'lightweight-charts';
import { 
  Maximize2, 
  Minimize2, 
  Activity, 
  RefreshCw 
} from 'lucide-react';
import { CandleStick, MarketAsset } from '../../types/market';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/formatters';

interface FinancialChartProps {
  asset: MarketAsset;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ asset }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [timeframe, setTimeframe] = useState<string>('1h');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [candles, setCandles] = useState<CandleStick[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoverData, setHoverData] = useState<{ open: number; high: number; low: number; close: number; time: string; volume?: number } | null>(null);

  // Indicators toggle state
  const [showEma20, setShowEma20] = useState<boolean>(true);
  const [showEma50, setShowEma50] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState<boolean>(false);

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  // Fetch candle data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getCandles(asset.symbol, timeframe)
      .then(data => {
        if (isMounted) {
          setCandles(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch candles:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [asset.symbol, timeframe]);

  // Initialize and update Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0D131D' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(29, 41, 56, 0.45)' },
        horzLines: { color: 'rgba(29, 41, 56, 0.45)' },
      },
      crosshair: {
        vertLine: { color: '#5B8CFF', width: 1, style: 3, labelBackgroundColor: '#1D2938' },
        horzLine: { color: '#5B8CFF', width: 1, style: 3, labelBackgroundColor: '#1D2938' },
      },
      rightPriceScale: {
        borderColor: '#1D2938',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#1D2938',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: container.clientHeight || 420,
    });

    chartRef.current = chart;

    // Main Price Series
    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22C55E',
        downColor: '#EF4444',
        borderUpColor: '#22C55E',
        borderDownColor: '#EF4444',
        wickUpColor: '#22C55E',
        wickDownColor: '#EF4444',
      });
      candleSeriesRef.current = candleSeries as any;
      lineSeriesRef.current = null;
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#5B8CFF',
        lineWidth: 2,
      });
      lineSeriesRef.current = lineSeries as any;
      candleSeriesRef.current = null;
    }

    // Volume Series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries as any;
    } else {
      volumeSeriesRef.current = null;
    }

    // EMA 20
    if (showEma20) {
      const ema20 = chart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 2,
        title: 'EMA 20',
      });
      ema20SeriesRef.current = ema20 as any;
    } else {
      ema20SeriesRef.current = null;
    }

    // EMA 50
    if (showEma50) {
      const ema50 = chart.addSeries(LineSeries, {
        color: '#8B5CF6',
        lineWidth: 2,
        title: 'EMA 50',
      });
      ema50SeriesRef.current = ema50 as any;
    } else {
      ema50SeriesRef.current = null;
    }

    // Crosshair subscribe
    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData) {
        const candleData = candleSeriesRef.current ? param.seriesData.get(candleSeriesRef.current) as CandlestickData : null;
        if (candleData) {
          const date = new Date((param.time as number) * 1000);
          setHoverData({
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            time: date.toLocaleString(),
          });
        }
      } else {
        setHoverData(null);
      }
    });

    // Handle Resize
    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight || 420,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartType, showVolume, showEma20, showEma50]);

  // Feed candle data into chart
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    try {
      const formattedCandles: CandlestickData[] = candles.map(c => ({
        time: parseCandleTime(c),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(formattedCandles);
      } else if (lineSeriesRef.current) {
        const lineData: LineData[] = candles.map(c => ({
          time: parseCandleTime(c),
          value: c.close,
        }));
        lineSeriesRef.current.setData(lineData);
      }

      if (volumeSeriesRef.current && showVolume) {
        const volData = candles.map(c => ({
          time: parseCandleTime(c),
          value: c.volume,
          color: c.close >= c.open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        }));
        volumeSeriesRef.current.setData(volData);
      }

      // Calculate EMAs
      if (ema20SeriesRef.current && showEma20) {
        const ema20 = calculateEMA(candles, 20);
        ema20SeriesRef.current.setData(ema20);
      }

      if (ema50SeriesRef.current && showEma50) {
        const ema50 = calculateEMA(candles, 50);
        ema50SeriesRef.current.setData(ema50);
      }

      chartRef.current.timeScale().fitContent();
    } catch (err) {
      console.warn('Error setting chart data:', err);
    }
  }, [candles, showVolume, showEma20, showEma50]);

  // Live real-time tick update to last candle
  useEffect(() => {
    if (candleSeriesRef.current && candles.length > 0 && asset.price > 0) {
      try {
        const lastCandle = candles[candles.length - 1];
        const updatedClose = asset.price;
        const updatedHigh = Math.max(lastCandle.high, updatedClose);
        const updatedLow = Math.min(lastCandle.low, updatedClose);

        candleSeriesRef.current.update({
          time: parseCandleTime(lastCandle),
          open: lastCandle.open,
          high: updatedHigh,
          low: updatedLow,
          close: updatedClose,
        });
      } catch (err) {
        console.warn('Error updating live candle tick:', err);
      }
    }
  }, [asset.price, candles]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col bg-trade-surface border border-trade-border rounded-2xl overflow-hidden shadow-card transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full h-full min-h-[440px]'
    }`}>
      {/* Chart Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-trade-border bg-trade-surface2/60 gap-2">
        {/* Left: Timeframe pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg font-mono font-medium text-xs transition-all ${
                timeframe === tf
                  ? 'bg-trade-primary text-white shadow-glow-primary'
                  : 'text-trade-muted hover:text-trade-text hover:bg-trade-surface3'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Center: Live Hover OHLC Legend */}
        {hoverData && (
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-num text-trade-muted">
            <span>O: <strong className="text-trade-text">{formatPrice(hoverData.open)}</strong></span>
            <span>H: <strong className="text-trade-positive">{formatPrice(hoverData.high)}</strong></span>
            <span>L: <strong className="text-trade-negative">{formatPrice(hoverData.low)}</strong></span>
            <span>C: <strong className="text-trade-text">{formatPrice(hoverData.close)}</strong></span>
          </div>
        )}

        {/* Right: Chart Controls & Indicators */}
        <div className="flex items-center gap-1.5 ml-auto text-xs">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-trade-surface3/80 rounded-lg p-0.5 border border-trade-border">
            <button
              onClick={() => setChartType('candle')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                chartType === 'candle' ? 'bg-trade-surface text-trade-primary shadow' : 'text-trade-muted'
              }`}
              title="Candlestick Chart"
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                chartType === 'line' ? 'bg-trade-surface text-trade-primary shadow' : 'text-trade-muted'
              }`}
              title="Line Chart"
            >
              Line
            </button>
          </div>

          {/* Indicators Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-trade-surface3 hover:bg-trade-surface2 text-trade-muted hover:text-trade-text border border-trade-border transition-colors text-[11px]"
            >
              <Activity className="w-3.5 h-3.5 text-trade-primary" />
              <span>Indicators</span>
            </button>

            {showIndicatorsMenu && (
              <div 
                onMouseLeave={() => setShowIndicatorsMenu(false)}
                className="absolute right-0 top-full mt-1 w-44 p-2 bg-trade-surface2 border border-trade-border rounded-xl shadow-2xl z-50 text-xs space-y-1.5"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-trade-subtle uppercase">
                  Technical Indicators
                </div>
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-trade-surface3 cursor-pointer">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    EMA 20
                  </span>
                  <input
                    type="checkbox"
                    checked={showEma20}
                    onChange={e => setShowEma20(e.target.checked)}
                    className="accent-trade-primary"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-trade-surface3 cursor-pointer">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    EMA 50
                  </span>
                  <input
                    type="checkbox"
                    checked={showEma50}
                    onChange={e => setShowEma50(e.target.checked)}
                    className="accent-trade-primary"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-trade-surface3 cursor-pointer">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Volume
                  </span>
                  <input
                    type="checkbox"
                    checked={showVolume}
                    onChange={e => setShowVolume(e.target.checked)}
                    className="accent-trade-primary"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded-lg bg-trade-surface3 hover:bg-trade-surface2 text-trade-muted hover:text-trade-text border border-trade-border transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 min-h-[380px] w-full bg-[#0D131D]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-trade-surface/80 backdrop-blur-sm z-20">
            <RefreshCw className="w-8 h-8 text-trade-primary animate-spin mb-2" />
            <span className="text-xs text-trade-muted font-medium">Rendering Technical Candlesticks...</span>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full min-h-[380px]" />
      </div>

      {/* Chart Bottom Info Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-trade-surface2/40 border-t border-trade-border text-[11px] font-num text-trade-subtle">
        <div className="flex items-center gap-3">
          <span>Scale: <strong>Auto Logarithmic</strong></span>
          <span>Timezone: <strong>UTC</strong></span>
          <span className="text-emerald-400">● Real-Time Tick Stream Synced</span>
        </div>
        <div>
          <span>Lightweight Charts™ v5 (TradingView Engine)</span>
        </div>
      </div>
    </div>
  );
};

// Helper to parse candle time safely to UTCTimestamp
function parseCandleTime(candle: CandleStick | any): UTCTimestamp {
  if (!candle) return Math.floor(Date.now() / 1000) as UTCTimestamp;
  if (typeof candle.time === 'number') {
    return (candle.time > 1e11 ? Math.floor(candle.time / 1000) : Math.floor(candle.time)) as UTCTimestamp;
  }
  if (candle.timestamp) {
    const parsed = Math.floor(new Date(candle.timestamp).getTime() / 1000);
    return (isNaN(parsed) ? Math.floor(Date.now() / 1000) : parsed) as UTCTimestamp;
  }
  if (typeof candle.time === 'string') {
    const parsed = Math.floor(new Date(candle.time).getTime() / 1000);
    return (isNaN(parsed) ? Math.floor(Date.now() / 1000) : parsed) as UTCTimestamp;
  }
  return Math.floor(Date.now() / 1000) as UTCTimestamp;
}

// Helper to calculate Exponential Moving Average
function calculateEMA(candles: CandleStick[], period: number): LineData[] {
  if (candles.length === 0) return [];
  const k = 2 / (period + 1);
  const result: LineData[] = [];
  let ema = candles[0]?.close || 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      ema = c.close;
    } else {
      ema = c.close * k + ema * (1 - k);
    }

    if (i >= period - 1) {
      result.push({
        time: parseCandleTime(c),
        value: Math.round(ema * 100) / 100,
      });
    }
  }

  return result;
}
