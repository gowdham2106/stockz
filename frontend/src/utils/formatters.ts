export const formatPrice = (price: number | undefined | null, assetType?: string): string => {
  if (price === undefined || price === null || isNaN(price)) return '--';
  
  if (assetType === 'forex' || price < 1) {
    if (price < 0.001) return price.toFixed(6);
    if (price < 0.1) return price.toFixed(4);
    if (assetType === 'forex') return price.toFixed(4);
  }

  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return price.toFixed(2);
};

export const formatCurrencySymbol = (assetType?: string, exchange?: string): string => {
  if (exchange === 'NSE' || exchange === 'BSE' || assetType === 'indian_stock') return '₹';
  return '$';
};

export const formatPercent = (percent: number | undefined | null): string => {
  if (percent === undefined || percent === null || isNaN(percent)) return '0.00%';
  const prefix = percent > 0 ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
};

export const formatVolume = (vol: number | undefined | null): string => {
  if (!vol || isNaN(vol)) return '--';
  if (vol >= 1e12) return `${(vol / 1e12).toFixed(2)}T`;
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toFixed(0);
};

export const formatMarketCap = (cap: number | undefined | null, assetType?: string): string => {
  if (!cap || isNaN(cap)) return '--';
  const prefix = assetType === 'indian_stock' ? '₹' : '$';
  if (cap >= 1e12) return `${prefix}${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `${prefix}${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `${prefix}${(cap / 1e6).toFixed(2)}M`;
  return `${prefix}${cap.toLocaleString()}`;
};

export const formatTime = (dateStr: string | Date | number): string => {
  try {
    const d = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return '--:--:--';
  }
};
