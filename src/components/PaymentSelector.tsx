import React, { useState } from 'react';
import { PaymentMethod, PAYMENT_METHOD_OPTIONS } from '../utils/domainLogic';

interface PaymentSelectorProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  amountIdr: number;
  darkMode?: boolean;
}

// Komponen Logo Bank & QRIS berbasis SVG (tajam & anti-broken image)
const BankLogo: React.FC<{ method: PaymentMethod }> = ({ method }) => {
  switch (method) {
    case 'QRIS':
      return (
        <div className="w-12 h-7 rounded bg-rose-600 text-white font-extrabold text-[10px] tracking-wider flex items-center justify-center shadow-sm">
          QRIS
        </div>
      );
    case 'VA BCA':
      return (
        <div className="w-12 h-7 rounded bg-[#0060AF] text-white font-black text-[11px] tracking-tight flex items-center justify-center shadow-sm">
          BCA
        </div>
      );
    case 'VA Mandiri':
      return (
        <div className="w-12 h-7 rounded bg-[#003D79] text-[#FFB81C] font-bold text-[10px] tracking-tight flex items-center justify-center shadow-sm">
          mandiri
        </div>
      );
    case 'VA BNI':
      return (
        <div className="w-12 h-7 rounded bg-[#F15A23] text-white font-black text-[11px] flex items-center justify-center shadow-sm">
          BNI
        </div>
      );
    case 'VA BRI':
      return (
        <div className="w-12 h-7 rounded bg-[#00529C] text-white font-black text-[11px] flex items-center justify-center shadow-sm">
          BRI
        </div>
      );
    case 'Debit':
      return (
        <div className="w-12 h-7 rounded bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
          DEBIT
        </div>
      );
    default:
      return (
        <div className="w-12 h-7 rounded bg-slate-600 text-white font-bold text-[10px] flex items-center justify-center shadow-sm">
          TUNAI
        </div>
      );
  }
};

// Generator QRIS Dummy SVG
const DummyQrisBox: React.FC<{ amountIdr: number }> = ({ amountIdr }) => {
  const pattern = [
    '111111101011111',
    '100000100110001',
    '101110101010111',
    '101110100110111',
    '101110101110111',
    '100000101010001',
    '111111101011111',
    '000000001100100',
    '110110111011011',
    '011001001100101',
    '101110110111010',
    '000000001010110',
    '111111101101001',
    '100000100110110',
    '101110101011101',
  ];

  return (
    <div className="mt-3 p-4 rounded-xl bg-white text-slate-900 border border-slate-200 flex flex-col items-center text-center shadow-inner">
      <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
        <span className="font-black text-sm tracking-wider text-rose-600">QRIS</span>
        <span className="text-[11px] font-semibold text-slate-500">GPN • Telaga Semanan</span>
      </div>

      <p className="text-xs font-bold text-slate-800">TELAGA SEMANAN FISHING</p>
      <p className="text-[10px] text-slate-500 mb-2">NMID: ID1020268891042</p>

      {/* SVG QR Code */}
      <div className="p-2.5 bg-white border-2 border-slate-900 rounded-lg">
        <svg width="136" height="136" viewBox="0 0 15 15" shapeRendering="crispEdges">
          <rect width="15" height="15" fill="#ffffff" />
          {pattern.map((row, y) =>
            row.split('').map((cell, x) =>
              cell === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f172a" /> : null
            )
          )}
        </svg>
      </div>

      <div className="mt-2.5">
        <p className="text-[11px] text-slate-500">Total Pembayaran</p>
        <p className="text-base font-extrabold text-slate-900">
          Rp {amountIdr.toLocaleString('id-ID')}
        </p>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">
        Scan QR di atas menggunakan aplikasi e-Wallet atau Mobile Banking Anda
      </p>
    </div>
  );
};

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  selectedMethod,
  onChange,
  amountIdr,
  darkMode = true,
}) => {
  const [copied, setCopied] = useState(false);

  const activeOption = PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === selectedMethod);
  const dummyVaNumber = activeOption?.vaPrefix
    ? `${activeOption.vaPrefix}08128890412`
    : '';

  const handleCopyVa = () => {
    if (!dummyVaNumber) return;
    navigator.clipboard.writeText(dummyVaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider opacity-80">
        Pilih Metode Pembayaran
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PAYMENT_METHOD_OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : darkMode
                  ? 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <BankLogo method={option.value} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{option.label}</p>
                <p className="text-[10px] opacity-60">{option.category}</p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-amber-500' : 'border-slate-500'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview QRIS Dummy */}
      {selectedMethod === 'QRIS' && <DummyQrisBox amountIdr={amountIdr} />}

      {/* Preview Nomor Virtual Account Dummy */}
      {activeOption?.category === 'Virtual Account' && (
        <div
          className={`mt-3 p-3.5 rounded-xl border ${
            darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">{activeOption.label}</span>
            <BankLogo method={selectedMethod} />
          </div>
          <p className="text-[11px] opacity-70">Nomor Virtual Account:</p>
          <div className="flex items-center justify-between gap-2 mt-1">
            <code className="text-sm sm:text-base font-mono font-bold tracking-wider text-amber-400">
              {dummyVaNumber}
            </code>
            <button
              type="button"
              onClick={handleCopyVa}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              {copied ? 'Tersalin!' : 'Salin VA'}
            </button>
          </div>
          <p className="text-[11px] opacity-70 mt-2">
            Total Tagihan: <strong className="text-amber-400">Rp {amountIdr.toLocaleString('id-ID')}</strong>
          </p>
        </div>
      )}
    </div>
  );
};