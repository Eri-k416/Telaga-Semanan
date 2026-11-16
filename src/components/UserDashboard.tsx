import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CreditCard,
  Fish,
  Home,
  Lock,
  LogOut,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { POND_IMAGES, getFishImage } from '../utils/artwork';
import { FISH_SPECIES_LIST } from '../utils/seedData';
import { PaymentSelector } from './PaymentSelector';
import {
  calculateFishPercentages,
  classifyFishSize,
  parseTimeToMinutes,
  validateReservationInput,
  type AppUser,
  type FishSale,
  type Membership,
  type PaymentMethod,
  type Pond,
  type Reservation,
} from '../utils/domainLogic';

export type UserTab = 'main' | 'reservasi' | 'penjualan' | 'pembelian' | 'settings';

interface UserDashboardProps {
  user: AppUser;
  memberships: Membership[];
  ponds: Pond[];
  reservations: Reservation[];
  sales: FishSale[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onNavigateMarketplace: () => void;
  onNavigateLanding: () => void;
  onUpdateMembership: (params: {
    membershipId: string;
    durationMonths: number;
    paymentMethod: PaymentMethod;
    isRenewal: boolean;
  }) => void;
  onCreateReservation: (params: {
    pondId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => { ok: boolean; error?: string };
  onCancelReservation: (reservationId: string, reason?: string) => void;
  onCreateSale: (params: {
    fishName: string;
    weightKg: number;
    priceIdr: number;
    pondId: string;
    activeUntil: string;
  }) => void;
  onDeleteSale: (saleId: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  memberships,
  ponds,
  reservations,
  sales,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onNavigateMarketplace,
  onNavigateLanding,
  onUpdateMembership,
  onCreateReservation,
  onCancelReservation,
  onCreateSale,
  onDeleteSale,
}) => {
  const [activeTab, setActiveTab] = useState<UserTab>('main');
  const [compactTable, setCompactTable] = useState(false);
  const [autoExpandPonds, setAutoExpandPonds] = useState(false);

  const currentMembership = memberships.find((m) => m.id === user.membershipId) || memberships[0];
  const launchedMemberships = memberships.filter((m) => m.isLaunched);

  // Membership Extend / Change Overlay State
  const [membershipModalMode, setMembershipModalMode] = useState<'extend' | 'change' | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState(user.membershipId);
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(user.paymentMethod || 'QRIS');
  const [membershipToast, setMembershipToast] = useState<string | null>(null);

  // Reservasi Page State
  const [expandedPondId, setExpandedPondId] = useState<string | null>(ponds[0]?.id || null);
  const [bookingPond, setBookingPond] = useState<Pond | null>(null);
  const [bookingDate, setBookingDate] = useState('2026-10-26');
  const [bookingStartTime, setBookingStartTime] = useState('08:00');
  const [bookingEndTime, setBookingEndTime] = useState('10:00');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

  // Cancel Reservation Modal State
  const [cancelingReservation, setCancelingReservation] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Penjualan Bursa Ikan State
  const [saleSearch, setSaleSearch] = useState('');
  const [saleSortBy, setSaleSortBy] = useState<'price' | 'date' | 'status'>('date');
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [newFishName, setNewFishName] = useState<string>(FISH_SPECIES_LIST[0]);
  const [newFishWeight, setNewFishWeight] = useState<string>('2.5');
  const [newFishPrice, setNewFishPrice] = useState<string>('165000');
  const [newFishPondId, setNewFishPondId] = useState<string>(ponds[0]?.id || 'pond-1');
  const [newFishActiveUntil, setNewFishActiveUntil] = useState<string>('2026-11-30');
  const [saleFormError, setSaleFormError] = useState<string | null>(null);

  // Pembelian Bursa Ikan State
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSortBy, setPurchaseSortBy] = useState<'price' | 'date' | 'status'>('date');

  // Filter reservations for this user
  const userReservations = useMemo(() => {
    return reservations
      .filter((r) => r.userId === user.id)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  }, [reservations, user.id]);

  const upcomingReservations = userReservations.filter(
    (r) => r.status !== 'Sudah selesai' && r.status !== 'Dibatalkan'
  );
  const historyReservations = userReservations.filter(
    (r) => r.status === 'Sudah selesai' || r.status === 'Dibatalkan'
  );

  // Filter sales sold by this user
  const mySales = useMemo(() => {
    const q = saleSearch.trim().toLowerCase();
    const list = sales.filter((s) => {
      if (s.sellerId !== user.id) return false;
      if (q) {
        return (
          s.fishName.toLowerCase().includes(q) ||
          s.saleCode.toLowerCase().includes(q) ||
          s.pondName.toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (saleSortBy === 'price') return b.priceIdr - a.priceIdr;
      if (saleSortBy === 'status') return a.status.localeCompare(b.status);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [sales, user.id, saleSearch, saleSortBy]);

  // Filter purchases bought by this user
  const myPurchases = useMemo(() => {
    const q = purchaseSearch.trim().toLowerCase();
    const list = sales.filter((s) => {
      if (s.buyerId !== user.id) return false;
      if (q) {
        return (
          s.fishName.toLowerCase().includes(q) ||
          s.saleCode.toLowerCase().includes(q) ||
          s.pondName.toLowerCase().includes(q) ||
          s.sellerName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (purchaseSortBy === 'price') return b.priceIdr - a.priceIdr;
      if (purchaseSortBy === 'status') return a.status.localeCompare(b.status);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [sales, user.id, purchaseSearch, purchaseSortBy]);

  const activeTargetMembership =
    memberships.find(
      (m) => m.id === (membershipModalMode === 'extend' ? user.membershipId : selectedMembershipId)
    ) || currentMembership;

  const membershipTotalAmount = activeTargetMembership.priceMonthly * selectedDuration;

  const handleMembershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isRenewal = membershipModalMode === 'extend';
    const targetId = isRenewal ? user.membershipId : selectedMembershipId;
    onUpdateMembership({
      membershipId: targetId,
      durationMonths: selectedDuration,
      paymentMethod: selectedPayment,
      isRenewal,
    });
    const tierObj = memberships.find((m) => m.id === targetId);
    setMembershipToast(
      isRenewal
        ? `Membership ${tierObj?.name} berhasil diperpanjang ${selectedDuration} bulan via ${selectedPayment}.`
        : `Membership berhasil diganti ke ${tierObj?.name} (${selectedDuration} bulan) via ${selectedPayment}.`
    );
    setMembershipModalMode(null);
  };

  const handleOpenBookingModal = (pond: Pond) => {
    setBookingPond(pond);
    setBookingError(null);
    setBookingSuccess(null);
    setIsConfirmingBooking(false);
    setBookingDate('2026-10-26');
    setBookingStartTime(pond.openTime);
    const startH = Number(pond.openTime.split(':')[0]) || 8;
    const defaultEndH = Math.min(startH + Math.min(2, currentMembership.maxHoursPerSession), 21);
    setBookingEndTime(`${String(defaultEndH).padStart(2, '0')}:00`);
  };

  // Langkah 1: Validasi input lalu masuk ke tampilan konfirmasi reservasi
  const handleProceedToConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPond) return;
    setBookingError(null);

    const check = validateReservationInput({
      user,
      membership: currentMembership,
      pond: bookingPond,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      existingUserReservations: userReservations,
    });

    if (!check.valid) {
      setBookingError(check.error || 'Reservasi tidak valid.');
      return;
    }

    setIsConfirmingBooking(true);
  };

  // Langkah 2: Simpan reservasi setelah user mengonfirmasi ringkasan
  const handleFinalConfirmBooking = () => {
    if (!bookingPond) return;
    const res = onCreateReservation({
      pondId: bookingPond.id,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
    });

    if (!res.ok) {
      setBookingError(res.error || 'Gagal menyimpan reservasi.');
      setIsConfirmingBooking(false);
      return;
    }

    setBookingSuccess(
      `Reservasi di ${bookingPond.name} pada ${bookingDate} (${bookingStartTime} - ${bookingEndTime}) berhasil diajukan dan sedang menunggu konfirmasi Admin.`
    );
    setIsConfirmingBooking(false);
    setBookingPond(null);
  };

  const handleConfirmCancelReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelingReservation) return;
    if (cancelingReservation.status === 'Sedang berkunjung') {
      setCancelingReservation(null);
      return;
    }
    onCancelReservation(cancelingReservation.id, cancelReason.trim() || 'Dibatalkan oleh pengguna');
    setMembershipToast(
      `Pengajuan pembatalan reservasi di ${cancelingReservation.pondName} (${cancelingReservation.date}) berhasil dikirim dan menunggu ACC Admin.`
    );
    setCancelingReservation(null);
    setCancelReason('');
  };

  const handleCreateSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleFormError(null);
    const w = parseFloat(newFishWeight);
    const p = parseInt(newFishPrice, 10);
    if (Number.isNaN(w) || w <= 0 || w > 50) {
      setSaleFormError('Berat ikan harus berupa angka antara 0.1 kg hingga 50 kg.');
      return;
    }
    if (Number.isNaN(p) || p < 5000) {
      setSaleFormError('Harga ikan minimal Rp 5.000.');
      return;
    }
    if (!newFishActiveUntil) {
      setSaleFormError('Tanggal batas aktif penjualan wajib diisi.');
      return;
    }
    onCreateSale({
      fishName: newFishName,
      weightKg: Math.round(w * 10) / 10,
      priceIdr: p,
      pondId: newFishPondId,
      activeUntil: newFishActiveUntil,
    });
    setAddSaleOpen(false);
  };

  const bookingDurationHours = useMemo(() => {
    const s = parseTimeToMinutes(bookingStartTime);
    const e = parseTimeToMinutes(bookingEndTime);
    if (s < 0 || e <= s) return 0;
    return (e - s) / 60;
  }, [bookingStartTime, bookingEndTime]);

  const renderStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'Menunggu Konfirmasi':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
            Menunggu Konfirmasi Admin
          </span>
        );
      case 'Dikonfirmasi':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
            Dikonfirmasi Admin
          </span>
        );
      case 'Menunggu Pembatalan':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300/60 dark:border-orange-700/60">
            Menunggu ACC Pembatalan
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/60 dark:border-rose-700/60">
            Dibatalkan
          </span>
        );
      case 'Sudah selesai':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Sudah selesai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F7F9] text-[#0A192F]'
      }`}
    >
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#0A192F] text-white border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <button
                type="button"
                onClick={onNavigateLanding}
                className="font-display text-lg font-bold tracking-tight text-white hover:text-cyan-300 transition-colors cursor-pointer text-left"
              >
                Telaga Semanan
              </button>
              <div className="text-xs text-cyan-400 mt-0.5">
                Dashboard Anggota · {currentMembership.name}
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('main')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'main'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Main Page & Histori</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reservasi')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'reservasi'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Reservasi Kolam</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('penjualan')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'penjualan'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Fish className="w-4 h-4 shrink-0" />
              <span>Penjualan Bursa Ikan ({mySales.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pembelian')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'pembelian'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Pembelian Bursa Ikan ({myPurchases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings & Tampilan</span>
            </button>

            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onNavigateMarketplace}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 shrink-0" />
                <span>Buka Pasar Bursa Ikan</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <div className="text-xs font-bold text-white truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Workspace Header */}
        <header
          className={`px-6 lg:px-10 py-4 border-b flex items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Sistem Informasi Pemancingan</span>
            <span className="mx-2">/</span>
            <strong className={darkMode ? 'text-white' : 'text-slate-900'}>
              {activeTab === 'main' && 'Main Page & Ringkasan Membership'}
              {activeTab === 'reservasi' && 'Reservasi Kolam Pemancingan'}
              {activeTab === 'penjualan' && 'Penjualan Ikan Bursa Ikan Saya'}
              {activeTab === 'pembelian' && 'Riwayat Pembelian Ikan Bursa Ikan'}
              {activeTab === 'settings' && 'Pengaturan UX & Quality of Life'}
            </strong>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </header>

        <main className="p-6 lg:p-10 space-y-8 flex-1">
          {/* TAB 1: MAIN PAGE */}
          {activeTab === 'main' && (
            <div className="space-y-8">
              {membershipToast && (
                <div
                  role="status"
                  className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-200 text-xs font-medium flex items-center justify-between"
                >
                  <span>{membershipToast}</span>
                  <button
                    type="button"
                    onClick={() => setMembershipToast(null)}
                    className="text-xs font-bold underline ml-4 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* Active Membership Card */}
              <section
                className={`rounded-xl border p-6 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                      Status Keanggotaan Aktif · Metode Pembayaran: {user.paymentMethod}
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold">
                      Membership {currentMembership.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Berlaku sampai:{' '}
                        <strong className="font-mono-tabular text-slate-900 dark:text-white">
                          {user.membershipExpiresAt}
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Maksimal Sesi Memancing:{' '}
                        <strong className="font-mono-tabular text-slate-900 dark:text-white">
                          {currentMembership.maxHoursPerSession} Jam / Sesi
                        </strong>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Akses Kolam:{' '}
                        <strong className="font-mono-tabular text-slate-900 dark:text-white">
                          {currentMembership.accessiblePondIds.length} dari {ponds.length} Kolam
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMembershipId(user.membershipId);
                        setSelectedDuration(3);
                        setSelectedPayment(user.paymentMethod || 'QRIS');
                        setMembershipModalMode('extend');
                      }}
                      className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Perpanjang Membership
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const otherTier =
                          launchedMemberships.find((m) => m.id !== user.membershipId) ||
                          launchedMemberships[0];
                        setSelectedMembershipId(otherTier.id);
                        setSelectedDuration(3);
                        setSelectedPayment(user.paymentMethod || 'QRIS');
                        setMembershipModalMode('change');
                      }}
                      className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0A192F] hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Ganti Membership
                    </button>
                  </div>
                </div>
              </section>

              {/* Visit History Section: Upcoming & Completed/Cancelled */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming / Active Visits */}
                <section
                  className={`rounded-xl border p-6 space-y-4 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold">
                        Jadwal Aktivitas Memancing (Aktif)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Reservasi yang menunggu konfirmasi, sudah di-ACC, atau sedang diproses
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reservasi')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 cursor-pointer whitespace-nowrap"
                    >
                      + Reservasi Baru
                    </button>
                  </div>

                  {upcomingReservations.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500">
                      Belum ada jadwal reservasi aktif. Klik tombol Reservasi Kolam untuk memilih
                      jadwal.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingReservations.map((res) => (
                        <div
                          key={res.id}
                          className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            darkMode
                              ? 'bg-slate-800/60 border-slate-700'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="font-display font-bold text-sm">{res.pondName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                              Tanggal: {res.date} · Jam: {res.startTime} – {res.endTime} WIB
                            </div>
                            <div>{renderStatusBadge(res.status)}</div>
                            {res.status === 'Menunggu Pembatalan' && res.cancelReason && (
                              <div className="text-[11px] text-orange-600 dark:text-orange-400">
                                Alasan diajukan: {res.cancelReason}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap sm:flex-col gap-2 self-start sm:self-end shrink-0">
                            {res.status === 'Sedang berkunjung' ? null : res.status ===
                              'Menunggu Pembatalan' ? (
                              <span className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/60 whitespace-nowrap">
                                Menunggu ACC Pembatalan
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (res.status === 'Sedang berkunjung') return;
                                  setCancelingReservation(res);
                                  setCancelReason('');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 border border-rose-200 hover:bg-rose-50 dark:border-rose-800/70 dark:text-rose-400 dark:hover:bg-rose-950/50 cursor-pointer whitespace-nowrap"
                              >
                                Ajukan Pembatalan
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Completed & Cancelled Visits */}
                <section
                  className={`rounded-xl border p-6 space-y-4 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <h2 className="font-display text-lg font-bold">
                      Riwayat Selesai & Dibatalkan
                    </h2>
                    <p className="text-xs text-slate-500">
                      Riwayat kunjungan yang telah selesai maupun pembatalan yang sudah di-ACC Admin
                    </p>
                  </div>

                  {historyReservations.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500">
                      Belum ada riwayat kunjungan yang selesai atau dibatalkan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historyReservations.map((res) => (
                        <div
                          key={res.id}
                          className={`p-4 rounded-lg border flex items-center justify-between gap-3 ${
                            darkMode
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-display font-bold text-sm">{res.pondName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                              Tanggal: {res.date} · Jam: {res.startTime} – {res.endTime} WIB
                            </div>
                            {res.status === 'Dibatalkan' && res.cancelReason && (
                              <div className="text-[11px] text-rose-500">
                                Alasan: {res.cancelReason}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0">{renderStatusBadge(res.status)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: RESERVASI PAGE */}
          {activeTab === 'reservasi' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    Reservasi Kolam Pemancingan
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Membership Anda (<strong>{currentMembership.name}</strong>) memberikan durasi
                    maksimal <strong>{currentMembership.maxHoursPerSession} jam/sesi</strong>. Klik
                    elemen kolam untuk melihat live report dan populasi ikan.
                  </p>
                </div>
              </div>

              {bookingSuccess && (
                <div
                  role="status"
                  className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center justify-between"
                >
                  <span>{bookingSuccess}</span>
                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="text-xs font-bold underline ml-4 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {ponds.map((pond) => {
                  const hasAccess = currentMembership.accessiblePondIds.includes(pond.id);
                  const isMaintenance = pond.status === 'Sedang Maintenance';
                  const isExpanded = autoExpandPonds || expandedPondId === pond.id;
                  const fishPercentages = calculateFishPercentages(pond.fishPopulation);

                  return (
                    <div
                      key={pond.id}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        !hasAccess
                          ? 'border-slate-700 bg-slate-950 text-slate-400'
                          : darkMode
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Combo Box Header with Pond Background Artwork */}
                      <div className="relative min-h-[135px] flex items-end">
                        <img
                          src={POND_IMAGES[pond.id]}
                          alt={pond.name}
                          referrerPolicy="no-referrer"
                          className={`absolute inset-0 w-full h-full object-cover transition-all ${
                            !hasAccess ? 'brightness-[0.25] grayscale' : 'brightness-[0.65]'
                          }`}
                        />
                        <div className="relative z-10 w-full p-5 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPondId(expandedPondId === pond.id ? null : pond.id)
                            }
                            className="text-left flex-1 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
                              <span>{pond.branch}</span>
                              <span aria-hidden="true">·</span>
                              <span>{pond.status}</span>
                              {!hasAccess && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                                    <Lock className="w-3.5 h-3.5" />
                                    Terkunci (Butuh Upgrade Membership)
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {!hasAccess && <Lock className="w-5 h-5 text-amber-400 shrink-0" />}
                              <h2 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {pond.name}
                              </h2>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-300" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">
                              Klik untuk {isExpanded ? 'menyembunyikan' : 'menampilkan'} lokasi,
                              live report pengunjung, dan persentase ikan
                            </p>
                          </button>

                          <div className="flex items-center gap-3 shrink-0">
                            {!hasAccess ? (
                              <div className="px-4 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-semibold text-amber-400 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span>Tidak Dapat Diakses ({currentMembership.name})</span>
                              </div>
                            ) : isMaintenance ? (
                              <button
                                type="button"
                                disabled
                                className="px-4 py-2 rounded-lg bg-amber-950/80 border border-amber-700/60 text-xs font-semibold text-amber-300 opacity-75 cursor-not-allowed"
                              >
                                Sedang Maintenance
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenBookingModal(pond)}
                                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Reservasi {pond.name}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Combo-Box Body */}
                      {isExpanded && (
                        <div className="p-6 space-y-6 border-t border-slate-200 dark:border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500 block">Lokasi & Tempat Branch</span>
                              <strong className="block mt-1">{pond.branch}</strong>
                              <span className="text-slate-500 mt-0.5 block">{pond.location}</span>
                            </div>
                            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500 block">Jam Buka Operasional</span>
                              <strong className="font-mono-tabular text-sm block mt-1">
                                {pond.openTime} – {pond.closeTime} WIB
                              </strong>
                              <span className="text-slate-500 mt-0.5 block">Buka Setiap Hari</span>
                            </div>
                            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500 block">
                                Pengunjung Hari Ini (Live Report)
                              </span>
                              <strong className="font-mono-tabular text-sm block mt-1">
                                {pond.currentVisitors} Pengunjung Aktif
                              </strong>
                              <span className="text-teal-600 dark:text-teal-400 mt-0.5 block">
                                Tersisa {Math.max(0, pond.maxVisitors - pond.currentVisitors)} slot
                              </span>
                            </div>
                            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              <span className="text-slate-500 block">
                                Kapasitas Maksimum Pengunjung
                              </span>
                              <strong className="font-mono-tabular text-sm block mt-1">
                                {pond.maxVisitors} Pemancing
                              </strong>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                                <div
                                  className="h-full bg-teal-600 rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round((pond.currentVisitors / pond.maxVisitors) * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fish Species & Rarity Percentages with Images */}
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                              Populasi Ikan & Persentase Rarity di {pond.name}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {fishPercentages.map((fish) => (
                                <div
                                  key={fish.speciesName}
                                  className={`rounded-lg border p-3 flex items-center gap-3 ${
                                    darkMode
                                      ? 'bg-slate-800/60 border-slate-700'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <img
                                    src={getFishImage(fish.speciesName)}
                                    alt={fish.speciesName}
                                    referrerPolicy="no-referrer"
                                    className="w-16 h-12 rounded object-cover shrink-0 border border-slate-300 dark:border-slate-700"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate">
                                      {fish.speciesName}
                                    </div>
                                    <div className="font-mono-tabular text-sm font-bold text-teal-600 dark:text-teal-400">
                                      {fish.percentage}%
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Rarity: {fish.rarityLabel}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PENJUALAN Bursa Ikan PAGE */}
          {activeTab === 'penjualan' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    Penjualan Bursa Ikan Saya
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Kelola ikan hasil pancingan yang Anda jual ke marketplace Bursa Ikan Telaga
                    Semanan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSaleFormError(null);
                    setAddSaleOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Penjualan Ikan</span>
                </button>
              </div>

              {/* Search & Sort Bar */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Cari Penjualan Saya"
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    placeholder="Cari nama ikan, kolam, atau status..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
                  <button
                    type="button"
                    onClick={() => setSaleSortBy('price')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      saleSortBy === 'price'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Harga
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleSortBy('date')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      saleSortBy === 'date'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Tanggal Penjualan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleSortBy('status')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      saleSortBy === 'status'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Status Penjualan
                  </button>
                </div>
              </div>

              {mySales.length === 0 ? (
                <div
                  className={`p-10 rounded-xl border text-center ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold">Belum ada data penjualan ikan</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Klik tombol &ldquo;Tambah Penjualan Ikan&rdquo; untuk menjual hasil pancingan
                    Anda ke Bursa Ikan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mySales.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border overflow-hidden flex flex-col justify-between ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="relative h-36 bg-slate-900">
                          <img
                            src={getFishImage(item.fishName)}
                            alt={item.fishName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-end p-3.5">
                            <div className="text-[11px] text-cyan-300 font-mono-tabular">
                              {item.saleCode} · {item.isVerified ? 'Terverifikasi Admin' : 'Menunggu ACC Admin'}
                            </div>
                            <h3 className="font-display font-bold text-white text-base">
                              {item.fishName}
                            </h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Harga Ikan</span>
                            <span className="font-mono-tabular font-bold text-sm text-teal-600 dark:text-teal-400">
                              Rp {item.priceIdr.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Berat & Kelas</span>
                            <span className="font-mono-tabular font-semibold">
                              {item.weightKg} kg ({item.sizeClass})
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Asal Kolam</span>
                            <span className="font-semibold">{item.pondName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Status Penjualan</span>
                            <span className="font-semibold text-teal-600 dark:text-teal-400">
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Aktif Hingga</span>
                            <span className="font-mono-tabular">{item.activeUntil}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          onClick={() => onDeleteSale(item.id)}
                          aria-label={`Hapus penjualan ${item.fishName} ${item.saleCode}`}
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Nonaktifkan & Hapus Penjualan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PEMBELIAN Bursa Ikan PAGE */}
          {activeTab === 'pembelian' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    Data Pembelian Bursa Ikan Saya
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Daftar ikan segar yang telah Anda beli atau pesan dari marketplace Bursa Ikan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onNavigateMarketplace}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
                >
                  <Store className="w-4 h-4" />
                  <span>Cari & Beli Ikan di Marketplace</span>
                </button>
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Cari Pembelian Saya"
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                    placeholder="Cari nama ikan, penjual, atau kolam..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
                  <button
                    type="button"
                    onClick={() => setPurchaseSortBy('price')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      purchaseSortBy === 'price'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Harga
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseSortBy('date')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      purchaseSortBy === 'date'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Tanggal Pembelian
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseSortBy('status')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      purchaseSortBy === 'status'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Status
                  </button>
                </div>
              </div>

              {myPurchases.length === 0 ? (
                <div
                  className={`p-10 rounded-xl border text-center ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold">Belum ada transaksi pembelian ikan</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Kunjungi Pasar Bursa Ikan untuk memesan ikan segar hasil tangkapan pemancing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myPurchases.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border overflow-hidden ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="relative h-36 bg-slate-900">
                        <img
                          src={getFishImage(item.fishName)}
                          alt={item.fishName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-end p-3.5">
                          <div className="text-[11px] text-cyan-300 font-mono-tabular">
                            {item.saleCode} · Penjual: {item.sellerName}
                          </div>
                          <h3 className="font-display font-bold text-white text-base">
                            {item.fishName}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Harga Beli</span>
                          <span className="font-mono-tabular font-bold text-sm text-teal-600 dark:text-teal-400">
                            Rp {item.priceIdr.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Berat & Kelas</span>
                          <span className="font-mono-tabular font-semibold">
                            {item.weightKg} kg ({item.sizeClass})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Asal Kolam</span>
                          <span className="font-semibold">{item.pondName}</span>
                        </div>
                        {item.paymentMethod && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Metode Pembayaran</span>
                            <span className="font-semibold">{item.paymentMethod}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status Transaksi</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tanggal Transaksi</span>
                          <span className="font-mono-tabular">{item.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS PAGE */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Pengaturan UX & Quality of Life
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sesuaikan tema warna tampilan dan kenyamanan navigasi dashboard Anda.
                </p>
              </div>

              <div
                className={`rounded-xl border divide-y ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 divide-slate-800'
                    : 'bg-white border-slate-200 divide-slate-200'
                }`}
              >
                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold">Tema Warna (Dark Mode / Light Mode)</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Beralih antara Light Mist (terang) dan Deep Ocean Slate (gelap).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 cursor-pointer whitespace-nowrap"
                  >
                    {darkMode ? 'Aktif: Dark Mode (Ubah ke Light)' : 'Aktif: Light Mode (Ubah ke Dark)'}
                  </button>
                </div>

                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold">Buka Otomatis Detail Semua Kolam</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan seluruh live report dan persentase ikan tanpa perlu mengklik satu
                      per satu.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Buka Otomatis Detail Semua Kolam"
                    checked={autoExpandPonds}
                    onChange={(e) => setAutoExpandPonds(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer"
                  />
                </div>

                <div className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold">Mode Kerapatan Tabel Ringkas</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mengurangi jarak antar baris pada riwayat kunjungan dan daftar transaksi.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Mode Kerapatan Tabel Ringkas"
                    checked={compactTable}
                    onChange={(e) => setCompactTable(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* OVERLAY MODAL 1: Perpanjang / Ganti Membership (dengan Logo Bank & QRIS Dummy) */}
      {membershipModalMode && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="membership-modal-title"
        >
          <form
            onSubmit={handleMembershipSubmit}
            className={`rounded-xl border max-w-lg w-full p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 id="membership-modal-title" className="font-display text-lg font-bold">
                {membershipModalMode === 'extend'
                  ? `Perpanjang Membership ${currentMembership.name}`
                  : 'Ganti Tingkatan Membership'}
              </h3>
              <button
                type="button"
                aria-label="Tutup Form Membership"
                onClick={() => setMembershipModalMode(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {membershipModalMode === 'change' && (
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Pilih Tingkatan Membership Baru
                </label>
                <select
                  aria-label="Pilih Tingkatan Membership Baru"
                  value={selectedMembershipId}
                  onChange={(e) => setSelectedMembershipId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {launchedMemberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — Maks {m.maxHoursPerSession} Jam/Sesi (Rp{' '}
                      {m.priceMonthly.toLocaleString('id-ID')}/bln)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">
                Masa Berlaku Tambahan
              </label>
              <select
                aria-label="Masa Berlaku Tambahan"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value={1}>1 Bulan — Rp {(activeTargetMembership.priceMonthly * 1).toLocaleString('id-ID')}</option>
                <option value={3}>3 Bulan — Rp {(activeTargetMembership.priceMonthly * 3).toLocaleString('id-ID')}</option>
                <option value={6}>6 Bulan — Rp {(activeTargetMembership.priceMonthly * 6).toLocaleString('id-ID')}</option>
                <option value={12}>12 Bulan — Rp {(activeTargetMembership.priceMonthly * 12).toLocaleString('id-ID')}</option>
              </select>
            </div>

            <PaymentSelector
              selectedMethod={selectedPayment}
              onChange={setSelectedPayment}
              amountIdr={membershipTotalAmount}
              darkMode={darkMode}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMembershipModalMode(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Konfirmasi Pembayaran</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OVERLAY MODAL 2: Buat & Konfirmasi Reservasi Kolam */}
      {bookingPond && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          {!isConfirmingBooking ? (
            <form
              onSubmit={handleProceedToConfirmBooking}
              className={`rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4 ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs text-teal-600 font-semibold">
                    Formulir Reservasi Sesi Memancing
                  </div>
                  <h3 id="booking-modal-title" className="font-display text-lg font-bold">
                    {bookingPond.name}
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Tutup Form Reservasi"
                  onClick={() => setBookingPond(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <div>
                  Jam Operasional Kolam:{' '}
                  <strong className="font-mono-tabular">
                    {bookingPond.openTime} – {bookingPond.closeTime} WIB
                  </strong>
                </div>
                <div>
                  Batas Durasi Membership {currentMembership.name}:{' '}
                  <strong className="font-mono-tabular text-teal-600 dark:text-teal-400">
                    Maksimal {currentMembership.maxHoursPerSession} Jam
                  </strong>
                </div>
              </div>

              {bookingError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
                >
                  {bookingError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">Tanggal Memancing</label>
                <input
                  type="date"
                  aria-label="Tanggal Memancing"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Waktu Mulai Memancing
                  </label>
                  <input
                    type="time"
                    aria-label="Waktu Mulai Memancing"
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Waktu Berakhir Sesi
                  </label>
                  <input
                    type="time"
                    aria-label="Waktu Berakhir Sesi"
                    value={bookingEndTime}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingPond(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 rounded-lg cursor-pointer"
                >
                  Lanjut Konfirmasi
                </button>
              </div>
            </form>
          ) : (
            /* Langkah Konfirmasi Ringkasan Reservasi */
            <div
              className={`rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4 ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                <div>
                  <h3 id="booking-modal-title" className="font-display text-lg font-bold">
                    Konfirmasi Detail Reservasi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pastikan jadwal memancing Anda sudah sesuai sebelum diajukan ke Admin
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                  darkMode
                    ? 'bg-slate-800/70 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pemancing</span>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kolam Tujuan</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {bookingPond.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-mono-tabular font-semibold">{bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jam Sesi</span>
                  <span className="font-mono-tabular font-semibold">
                    {bookingStartTime} – {bookingEndTime} WIB ({bookingDurationHours.toFixed(1)} Jam)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Awal</span>
                  <span className="font-semibold text-amber-500">Menunggu Konfirmasi Admin</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingBooking(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Ubah Jadwal
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirmBooking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer"
                >
                  Ya, Konfirmasi Reservasi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY MODAL 3: Ajukan Pembatalan Reservasi (Membutuhkan ACC Admin) */}
      {cancelingReservation && cancelingReservation.status !== 'Sedang berkunjung' && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-res-modal-title"
        >
          <form
            onSubmit={handleConfirmCancelReservation}
            className={`rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <h3 id="cancel-res-modal-title" className="font-display text-lg font-bold">
                Ajukan Pembatalan Reservasi?
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pengajuan pembatalan jadwal memancing di{' '}
              <strong className={darkMode ? 'text-white' : 'text-slate-900'}>
                {cancelingReservation.pondName}
              </strong>{' '}
              pada tanggal <strong>{cancelingReservation.date}</strong> ({cancelingReservation.startTime} –{' '}
              {cancelingReservation.endTime} WIB) akan dikirim ke Admin untuk di-ACC.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Alasan Pembatalan (Opsional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Ada keperluan mendadak / ganti jadwal"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelingReservation(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
              >
                Ajukan Pembatalan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OVERLAY MODAL 4: Tambah Penjualan Bursa Ikan */}
      {addSaleOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-sale-modal-title"
        >
          <form
            onSubmit={handleCreateSaleSubmit}
            className={`rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 id="add-sale-modal-title" className="font-display text-lg font-bold">
                Tambah Penjualan Ikan ke Bursa Ikan
              </h3>
              <button
                type="button"
                aria-label="Tutup Form Tambah Penjualan"
                onClick={() => setAddSaleOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saleFormError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
              >
                {saleFormError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">Nama Ikan</label>
              <select
                aria-label="Pilih Nama Ikan"
                value={newFishName}
                onChange={(e) => setNewFishName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {FISH_SPECIES_LIST.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Berat Ikan (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  aria-label="Berat Ikan (Kg)"
                  value={newFishWeight}
                  onChange={(e) => setNewFishWeight(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <span className="text-[11px] text-teal-600 block mt-1">
                  Kelas Otomatis: {classifyFishSize(parseFloat(newFishWeight) || 0)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  aria-label="Harga Jual (Rp)"
                  value={newFishPrice}
                  onChange={(e) => setNewFishPrice(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Ikan Didapat dari Kolam Mana
              </label>
              <select
                aria-label="Asal Kolam Ikan"
                value={newFishPondId}
                onChange={(e) => setNewFishPondId(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Penjualan Aktif Hingga Tanggal
              </label>
              <input
                type="date"
                aria-label="Penjualan Aktif Hingga Tanggal"
                value={newFishActiveUntil}
                onChange={(e) => setNewFishActiveUntil(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddSaleOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 rounded-lg cursor-pointer"
              >
                Simpan & Ajukan ke Bursa Ikan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};