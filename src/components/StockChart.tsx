import React, { useState } from 'react';
import { FISH_SPECIES_LIST, getFishStockChartData } from '../utils/seedData';
import type { PriceTimeframe } from '../utils/domainLogic';

interface StockChartProps {
  selectedFish?: string;
  onSelectFish?: (fish: string) => void;
  allowFishSelection?: boolean;
  darkMode?: boolean;
  compact?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  selectedFish = FISH_SPECIES_LIST[0],
  onSelectFish,
  allowFishSelection = true,
  darkMode = false,
  compact = false,
}) => {
  const [internalFish, setInternalFish] = useState<string>(selectedFish);
  const [timeframe, setTimeframe] = useState<PriceTimeframe>('Tanggal');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const activeFish = allowFishSelection && !onSelectFish ? internalFish : selectedFish;
  const handleFishChange = (val: string) => {
    setInternalFish(val);
    if (onSelectFish) onSelectFish(val);
  };

  const data = getFishStockChartData(activeFish, timeframe);
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const firstPrice = prices[0] || 1;
  const lastPrice = prices[prices.length - 1] || 1;
  const changePct = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1);
  const isPositive = Number(changePct) >= 0;

  const width = 680;
  const height = compact ? 160 : 185;
  const padLeft = 58;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const priceRange = Math.max(maxPrice - minPrice, 5000);
  const points = data.map((d, idx) => {
    const x = padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
    const y = padTop + plotH - ((d.price - minPrice) / priceRange) * plotH;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `M ${points[0].x},${padTop + plotH} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${
          points[points.length - 1].x
        },${padTop + plotH} Z`
      : '';

  const strokeColor = isPositive ? '#0D9488' : '#E11D48';
  const fillId = `stock-grad-${activeFish.replace(/\s+/g, '-')}-${timeframe}`;

  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        darkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Indeks Bursa Harga Bursa Ikan</span>
            <span aria-hidden="true">·</span>
            <span>Satuan per Kg</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h4 className="text-lg font-bold tracking-tight">{activeFish}</h4>
            <span className="font-mono-tabular text-base font-semibold">
              Rp {lastPrice.toLocaleString('id-ID')}/kg
            </span>
            <span
              className={`font-mono-tabular text-xs font-semibold ${
                isPositive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? `+${changePct}%` : `${changePct}%`} ({timeframe})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allowFishSelection && (
            <label className="text-xs font-medium flex items-center gap-1.5">
              <span className="sr-only">Pilih Komoditas Ikan</span>
              <select
                aria-label="Pilih Komoditas Ikan"
                value={activeFish}
                onChange={(e) => handleFishChange(e.target.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {FISH_SPECIES_LIST.map((fish) => (
                  <option key={fish} value={fish}>
                    {fish}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-xs font-medium flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Sumbu X:</span>
            <select
              aria-label="Pilih Rentang Sumbu X Grafik"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as PriceTimeframe)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="Tanggal">Per Tanggal (Harian)</option>
              <option value="Bulan">Per Bulan (Bulanan)</option>
              <option value="Tahun">Per Tahun (Tahunan)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Grafik pergerakan harga ${activeFish} berdasarkan ${timeframe}`}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Grid Lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padTop + ratio * plotH;
            const val = Math.round((maxPrice - ratio * priceRange) / 500) * 500;
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={darkMode ? '#334155' : '#E2E8F0'}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono-tabular"
                >
                  {(val / 1000).toFixed(0)}rb
                </text>
              </g>
            );
          })}

          {/* Area & Line */}
          {areaPath && <path d={areaPath} fill={`url(#${fillId})`} />}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data Points & X-Axis Labels */}
          {points.map((pt, idx) => {
            const isHovered = hoverIdx === idx;
            return (
              <g
                key={pt.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#F97316' : strokeColor}
                  stroke={darkMode ? '#0F172A' : '#FFFFFF'}
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-mono-tabular"
                >
                  {pt.label}
                </text>
                {isHovered && (
                  <g>
                    <rect
                      x={Math.min(Math.max(pt.x - 58, 8), width - 124)}
                      y={Math.max(pt.y - 42, 4)}
                      width="116"
                      height="32"
                      rx="6"
                      fill="#0A192F"
                    />
                    <text
                      x={Math.min(Math.max(pt.x, 66), width - 66)}
                      y={Math.max(pt.y - 22, 24)}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      className="text-[10px] font-mono-tabular font-semibold"
                    >
                      {pt.label}: Rp {pt.price.toLocaleString('id-ID')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">Harga Tertinggi</span>
          <span className="font-mono-tabular font-semibold">
            Rp {maxPrice.toLocaleString('id-ID')}/kg
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">Harga Terendah</span>
          <span className="font-mono-tabular font-semibold">
            Rp {minPrice.toLocaleString('id-ID')}/kg
          </span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block">Volume Transaksi</span>
          <span className="font-mono-tabular font-semibold">
            {data.reduce((acc, d) => acc + d.volume, 0)} Ekor
          </span>
        </div>
      </div>
    </div>
  );
};
