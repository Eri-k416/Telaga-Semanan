import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { getFishImage } from '../utils/artwork';
import { FISH_SPECIES_LIST } from '../utils/seedData';
import { StockChart } from './StockChart';
import type {
  AppUser,
  FishSale,
  FishSizeClass,
  PaymentMethod,
  Pond,
  SaleStatus,
} from '../utils/domainLogic';

interface BursaIkanProps {
  sales: FishSale[];
  ponds: Pond[];
  currentUser: AppUser | null;
  darkMode: boolean;
  onBack: () => void;
  onPlaceOrder: (
    saleId: string,
    paymentMethod: PaymentMethod,
    notes: string
  ) => {
    ok: boolean;
    error?: string;
  };
  onRequireLogin: () => void;
}

type PaymentProviderId = 'QRIS' | 'BCA' | 'MANDIRI' | 'BNI' | 'BRI';

interface PaymentProviderOption {
  id: PaymentProviderId;
  method: PaymentMethod;
  label: string;
  sublabel: string;
  vaNumber?: string;
  badgeBg: string;
  badgeText: string;
  logoText: string;
}

const PAYMENT_PROVIDERS: PaymentProviderOption[] = [
  {
    id: 'QRIS',
    method: 'QRIS',
    label: 'QRIS Instan',
    sublabel: 'GoPay · OVO · DANA · ShopeePay · Mobile Banking',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    logoText: 'QRIS',
  },
  {
    id: 'BCA',
    method: 'Debit',
    label: 'BCA Virtual Account',
    sublabel: 'Transfer Otomatis Bank Central Asia',
    vaNumber: '88012 0812 9944 102',
    badgeBg: 'bg-[#0060AF]',
    badgeText: 'text-white',
    logoText: 'BCA',
  },
  {
    id: 'MANDIRI',
    method: 'Debit',
    label: 'Mandiri Virtual Account',
    sublabel: 'Livin’ by Mandiri / ATM Bersama',
    vaNumber: '89508 0812 9944 102',
    badgeBg: 'bg-[#003D79]',
    badgeText: 'text-[#FFB81C]',
    logoText: 'mandiri',
  },
  {
    id: 'BNI',
    method: 'Debit',
    label: 'BNI Virtual Account',
    sublabel: 'BNI Mobile Banking / ATM BNI',
    vaNumber: '98812 0812 9944 102',
    badgeBg: 'bg-[#F15A23]',
    badgeText: 'text-white',
    logoText: 'BNI',
  },
  {
    id: 'BRI',
    method: 'Debit',
    label: 'BRI BRIVA',
    sublabel: 'BRImo / ATM Bank Rakyat Indonesia',
    vaNumber: '12880 0812 9944 102',
    badgeBg: 'bg-[#00529C]',
    badgeText: 'text-white',
    logoText: 'BRI',
  },
];

export const BursaIkan: React.FC<BursaIkanProps> = ({
  sales,
  ponds,
  currentUser,
  darkMode,
  onBack,
  onPlaceOrder,
  onRequireLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL');
  const [selectedSizeClass, setSelectedSizeClass] = useState<string>('ALL');
  const [selectedPondId, setSelectedPondId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'date-desc' | 'status'>(
    'date-desc'
  );

  const [selectedSale, setSelectedSale] = useState<FishSale | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<PaymentProviderId>('QRIS');
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [copiedVa, setCopiedVa] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderFeedback, setOrderFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const activeProvider = useMemo(
    () => PAYMENT_PROVIDERS.find((p) => p.id === selectedProviderId) || PAYMENT_PROVIDERS[0],
    [selectedProviderId]
  );

  // Only verified sales are displayed on the Bursa Ikan marketplace
  const verifiedSales = useMemo(() => {
    return sales.filter((s) => s.isVerified);
  }, [sales]);

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = verifiedSales.filter((item) => {
      if (selectedSpecies !== 'ALL' && item.fishName !== selectedSpecies) return false;
      if (selectedSizeClass !== 'ALL' && item.sizeClass !== (selectedSizeClass as FishSizeClass))
        return false;
      if (selectedPondId !== 'ALL' && item.pondId !== selectedPondId) return false;
      if (selectedStatus !== 'ALL' && item.status !== (selectedStatus as SaleStatus)) return false;
      if (q) {
        const matchFish = item.fishName.toLowerCase().includes(q);
        const matchCode = item.saleCode.toLowerCase().includes(q);
        const matchSeller = item.sellerName.toLowerCase().includes(q);
        const matchPond = item.pondName.toLowerCase().includes(q);
        if (!matchFish && !matchCode && !matchSeller && !matchPond) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceIdr - b.priceIdr;
      if (sortBy === 'price-desc') return b.priceIdr - a.priceIdr;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (a.status === 'Open' && b.status !== 'Open') return -1;
      if (a.status !== 'Open' && b.status === 'Open') return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [
    verifiedSales,
    searchQuery,
    selectedSpecies,
    selectedSizeClass,
    selectedPondId,
    selectedStatus,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenDetail = (sale: FishSale) => {
    setSelectedSale(sale);
    setOrderFeedback(null);
    setOrderNotes('');
    setCopiedVa(false);
    setIsPaymentPopupOpen(false);
  };

  const handleCopyVa = (va: string) => {
    navigator.clipboard?.writeText(va.replace(/\s+/g, ''));
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  // Step 1: Confirm chosen payment method -> opens centered blurred payment popup
  const handleConfirmPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (selectedSale.sellerId === currentUser.id) {
      setOrderFeedback({
        type: 'error',
        message: 'Anda tidak dapat membeli ikan yang Anda jual sendiri.',
      });
      return;
    }
    setOrderFeedback(null);
    setCopiedVa(false);
    setIsPaymentPopupOpen(true);
  };

  // Step 2: Finalize order after user sees QR / VA popup
  const handleFinalizeOrder = () => {
    if (!selectedSale || !currentUser) return;

    const combinedNotes = orderNotes.trim()
      ? `[Via ${activeProvider.label}] ${orderNotes.trim()}`
      : `[Via ${activeProvider.label}]`;

    const res = onPlaceOrder(selectedSale.id, activeProvider.method, combinedNotes);
    setIsPaymentPopupOpen(false);

    if (!res.ok) {
      setOrderFeedback({ type: 'error', message: res.error || 'Gagal memproses pesanan.' });
    } else {
      setOrderFeedback({
        type: 'success',
        message: `Pembayaran & pesanan ${selectedSale.fishName} (${selectedSale.saleCode}) berhasil dikonfirmasi melalui ${activeProvider.label}. Data telah tercatat di riwayat pembelian Anda.`,
      });
      setSelectedSale((prev) =>
        prev
          ? {
              ...prev,
              status: 'Sudah dibeli',
              buyerId: currentUser.id,
              buyerName: currentUser.name,
            }
          : null
      );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F7F9] text-[#0A192F]'
      }`}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#0A192F] text-white border-b border-slate-800 px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-8">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <span className="font-display text-sm sm:text-lg font-bold tracking-tight truncate">
            Pasar Bursa Ikan · Telaga Semanan
          </span>
        </div>

        <div className="text-xs text-slate-300 hidden md:block whitespace-nowrap shrink-0">
          Menampilkan <strong>{filteredSales.length}</strong> listing terverifikasi Admin
        </div>

        <div className="shrink-0">
          {currentUser ? (
            <span className="text-xs font-medium text-cyan-300 whitespace-nowrap">
              Akun: <strong>{currentUser.name}</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={onRequireLogin}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Masuk untuk Membeli
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-6 lg:px-12 py-8 flex-1 space-y-6">
        {/* Marketplace Hero & Search/Filter Toolbar */}
        <section
          className={`p-6 rounded-xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                Bursa Hasil Tangkapan Pemancing Terverifikasi
              </p>
              <h1 className="font-display text-2xl font-bold mt-0.5">
                Marketplace Bursa Ikan Telaga Semanan
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Klik pada salah satu listing ikan untuk melihat grafik bursa harga historis (per
                tanggal, bulan, tahun) dan melakukan pemesanan.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Cari ikan, kode penjualan, atau penjual"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari ikan, kode EF-2026, penjual..."
                className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Filter & Sort Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Jenis Ikan
              </label>
              <select
                aria-label="Filter Jenis Ikan"
                value={selectedSpecies}
                onChange={(e) => {
                  setSelectedSpecies(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Semua Spesies Ikan</option>
                {FISH_SPECIES_LIST.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Kelas Berat Ikan
              </label>
              <select
                aria-label="Filter Kelas Berat Ikan"
                value={selectedSizeClass}
                onChange={(e) => {
                  setSelectedSizeClass(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Semua Kelas (Kecil / Sedang / Besar)</option>
                <option value="Kecil">Kecil / Ringan (&lt; 2.0 kg)</option>
                <option value="Sedang">Sedang (2.0 – 5.0 kg)</option>
                <option value="Besar">Besar / Berat (&gt; 5.0 kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Asal Kolam
              </label>
              <select
                aria-label="Filter Asal Kolam"
                value={selectedPondId}
                onChange={(e) => {
                  setSelectedPondId(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Semua Kolam Telaga Semanan</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter Status Penjualan
              </label>
              <select
                aria-label="Filter Status Penjualan"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Semua Status</option>
                <option value="Open">Open (Tersedia)</option>
                <option value="On progress">On progress (Diproses)</option>
                <option value="Sudah dibeli">Sudah dibeli (Terjual)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Urutkan (Sort By)
              </label>
              <select
                aria-label="Urutkan Penjualan"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="date-desc">Tanggal Penjualan Terbaru</option>
                <option value="price-asc">Harga: Terendah ke Tertinggi</option>
                <option value="price-desc">Harga: Tertinggi ke Terendah</option>
                <option value="status">Status Penjualan</option>
              </select>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        {paginatedSales.length === 0 ? (
          <div
            className={`p-12 rounded-xl border text-center ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="font-display font-bold text-base">
              Tidak ada penjualan ikan yang sesuai filter
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Coba ubah kata kunci pencarian atau reset filter jenis ikan dan kolam.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecies('ALL');
                setSelectedSizeClass('ALL');
                setSelectedPondId('ALL');
                setSelectedStatus('ALL');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedSales.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 hover:border-teal-500'
                    : 'bg-white border-slate-200 hover:border-teal-600'
                }`}
              >
                <div>
                  <div className="relative h-40 bg-slate-900">
                    <img
                      src={getFishImage(item.fishName)}
                      alt={item.fishName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-end p-3.5">
                      <div className="text-[11px] text-cyan-300 font-mono-tabular">
                        {item.saleCode} · Kelas {item.sizeClass} ({item.weightKg} kg)
                      </div>
                      <h3 className="font-display font-bold text-white text-base leading-snug">
                        {item.fishName}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Harga Jual</span>
                      <span className="font-mono-tabular text-base font-bold text-teal-600 dark:text-teal-400">
                        Rp {item.priceIdr.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Asal: {item.pondName}</span>
                      <span aria-hidden="true">·</span>
                      <span>Penjual: {item.sellerName}</span>
                    </div>

                    <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Aktif s/d: {item.activeUntil}</span>
                      <span
                        className={`font-semibold ${
                          item.status === 'Open'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.status === 'On progress'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        Status: {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(item)}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#0A192F] hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Lihat Statistik Harga & Detail Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-slate-500 font-mono-tabular">
              Halaman {currentPage} dari {totalPages} ({filteredSales.length} data penjualan)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sale Detail & Stock Market Price Chart + Order Overlay Modal */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sale-detail-title"
        >
          <div
            className={`rounded-xl border max-w-3xl w-full p-6 shadow-2xl my-8 space-y-6 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs text-teal-600 dark:text-teal-400 font-mono-tabular font-semibold">
                  Kode Penjualan: {selectedSale.saleCode} · Status: {selectedSale.status}
                </div>
                <h2 id="sale-detail-title" className="font-display text-2xl font-bold mt-0.5">
                  {selectedSale.fishName} ({selectedSale.weightKg} kg — Kelas {selectedSale.sizeClass})
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup Detail Penjualan"
                onClick={() => {
                  setIsPaymentPopupOpen(false);
                  setSelectedSale(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                <img
                  src={getFishImage(selectedSale.fishName)}
                  alt={selectedSale.fishName}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="md:col-span-7 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Harga Penawaran</span>
                  <span className="font-mono-tabular text-lg font-bold text-teal-600 dark:text-teal-400">
                    Rp {selectedSale.priceIdr.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Berat & Kelas</span>
                  <span className="font-mono-tabular text-sm font-bold">
                    {selectedSale.weightKg} kg ({selectedSale.sizeClass})
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Didapat dari Kolam</span>
                  <span className="font-semibold">{selectedSale.pondName}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Penjual & Masa Aktif</span>
                  <span className="font-semibold">
                    {selectedSale.sellerName} · s/d {selectedSale.activeUntil}
                  </span>
                </div>
              </div>
            </div>

            {/* Historical Price Chart per Date, Month, or Year */}
            <StockChart
              selectedFish={selectedSale.fishName}
              allowFishSelection={false}
              darkMode={darkMode}
              compact={true}
            />

            {/* Order / Payment Section */}
            {orderFeedback && (
              <div
                role="alert"
                className={`p-3.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  orderFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{orderFeedback.message}</span>
              </div>
            )}

            {selectedSale.status === 'Open' ? (
              <form
                onSubmit={handleConfirmPaymentMethod}
                className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold">
                    Formulir Pemesanan & Pembayaran Bursa Ikan
                  </h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pembayaran Terverifikasi</span>
                  </span>
                </div>

                {/* Step 1: Visual Bank & QRIS Provider Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold">
                    Pilih Metode & Kanal Pembayaran
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {PAYMENT_PROVIDERS.map((provider) => {
                      const isSelected = provider.id === selectedProviderId;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedProviderId(provider.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-teal-600 ring-2 ring-teal-600/20 bg-teal-50/50 dark:bg-teal-950/30'
                              : darkMode
                              ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                              : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-12 h-8 rounded-md flex items-center justify-center font-display font-extrabold text-[11px] tracking-tight shrink-0 shadow-xs ${provider.badgeBg} ${provider.badgeText}`}
                          >
                            {provider.logoText}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{provider.label}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {provider.sublabel}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Catatan Pengambilan / Pengiriman (Opsional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Contoh: Ambil di Clubhouse Telaga Semanan pukul 16.00 WIB"
                    className={`w-full px-3 py-2 text-xs rounded-lg border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      Konfirmasi Metode Pembayaran ({activeProvider.logoText})
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Ikan ini berstatus <strong>{selectedSale.status}</strong>
                  {selectedSale.buyerName ? ` oleh ${selectedSale.buyerName}` : ''}.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
                >
                  Tutup Detail
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Centered Payment Instruction Pop-up Modal with Blurred Backdrop */}
      {selectedSale && isPaymentPopupOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-gateway-popup-title"
        >
          <div
            className={`rounded-2xl border max-w-md w-full p-6 shadow-2xl space-y-5 ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Instruksi Pembayaran · {selectedSale.saleCode}
                </div>
                <h3
                  id="payment-gateway-popup-title"
                  className="font-display text-lg font-bold mt-0.5"
                >
                  {activeProvider.label}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Tutup Pop-up Pembayaran"
                onClick={() => setIsPaymentPopupOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amount Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                darkMode
                  ? 'bg-slate-800/70 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs">
                <span className="text-slate-500 block">Total Pembayaran</span>
                <span className="font-semibold">
                  {selectedSale.fishName} ({selectedSale.weightKg} kg)
                </span>
              </div>
              <div className="font-mono-tabular text-lg font-bold text-teal-600 dark:text-teal-400">
                Rp {selectedSale.priceIdr.toLocaleString('id-ID')}
              </div>
            </div>

            {/* QRIS or Bank Virtual Account Display */}
            {activeProvider.id === 'QRIS' ? (
              <div className="flex flex-col items-center text-center space-y-3 py-2">
                <div className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold tracking-wide">
                  QRIS · TELAGA SEMANAN OFFICIAL
                </div>
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm">
                  <QrCode className="w-40 h-40 text-slate-900" />
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-500">
                  NMID: ID1026008819204
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                  Pindai kode QR di atas menggunakan aplikasi <strong>Mobile Banking</strong> atau{' '}
                  <strong>E-Wallet</strong> Anda untuk menyelesaikan pembayaran.
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-9 rounded-lg flex items-center justify-center font-display font-extrabold text-xs shrink-0 ${activeProvider.badgeBg} ${activeProvider.badgeText}`}
                  >
                    {activeProvider.logoText}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold">{activeProvider.label}</div>
                    <div className="text-slate-500 text-[11px]">
                      Penerima: <strong>PT Telaga Semanan Nusantara</strong>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[11px] text-slate-500 block">
                    Nomor Virtual Account
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tabular text-base sm:text-lg font-bold tracking-wider">
                      {activeProvider.vaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyVa(activeProvider.vaNumber || '')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copiedVa ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin VA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lakukan transfer sesuai nominal tagihan ke nomor Virtual Account di atas melalui{' '}
                  {activeProvider.sublabel}.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPaymentPopupOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Ganti Metode
              </button>
              <button
                type="button"
                onClick={handleFinalizeOrder}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Pembayaran Selesai</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};