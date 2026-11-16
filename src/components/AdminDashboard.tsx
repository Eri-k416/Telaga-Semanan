import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Edit3,
  Fish,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Plus,
  Rocket,
  Search,
  Store,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { FISH_SPECIES_LIST } from '../utils/seedData';
import { StockChart } from './StockChart';
import {
  calculateFishPercentages,
  canDeleteMembership,
  type AppUser,
  type FishSale,
  type Membership,
  type Pond,
  type PondFishEntry,
  type PondStatus,
  type Reservation,
  type ReservationStatus,
} from '../utils/domainLogic';

export type AdminTab =
  | 'dashboard'
  | 'memberships'
  | 'ponds'
  | 'reservations'
  | 'users'
  | 'sales';

interface AdminDashboardProps {
  admin: AppUser;
  users: AppUser[];
  memberships: Membership[];
  ponds: Pond[];
  reservations: Reservation[];
  sales: FishSale[];
  darkMode: boolean;
  onLogout: () => void;
  onNavigateLanding: () => void;
  onNavigateMarketplace: () => void;
  // Membership handlers
  onSaveMembership: (membership: Membership, isNew: boolean) => void;
  onLaunchMembership: (membershipId: string) => void;
  onDeleteMembership: (membershipId: string) => void;
  // Pond handlers
  onSavePond: (pond: Pond, isNew: boolean) => void;
  onDeletePond: (pondId: string) => void;
  // Reservation handlers
  onSaveReservation: (reservation: Reservation) => void;
  onDeleteReservation: (reservationId: string) => void;
  // User handlers
  onSaveUser: (user: AppUser, isNew: boolean) => void;
  onToggleBanUser: (userId: string, reason?: string) => void;
  onDeleteUser: (userId: string) => void;
  // Sales handlers
  onVerifySale: (saleId: string) => void;
  onVoidSale: (saleId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  users,
  memberships,
  ponds,
  reservations,
  sales,
  darkMode,
  onLogout,
  onNavigateLanding,
  onNavigateMarketplace,
  onSaveMembership,
  onLaunchMembership,
  onDeleteMembership,
  onSavePond,
  onDeletePond,
  onSaveReservation,
  onDeleteReservation,
  onSaveUser,
  onToggleBanUser,
  onDeleteUser,
  onVerifySale,
  onVoidSale,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // --- MANAGE MEMBERSHIP STATE ---
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [isNewMembership, setIsNewMembership] = useState(false);
  const [memBenefitsInput, setMemBenefitsInput] = useState('');

  // --- MANAGE KOLAM STATE ---
  const [editingPond, setEditingPond] = useState<Pond | null>(null);
  const [isNewPond, setIsNewPond] = useState(false);

  // --- MANAGE RESERVASI STATE ---
  const [resSearch, setResSearch] = useState('');
  const [resDateFilter, setResDateFilter] = useState('');
  const [resStatusFilter, setResStatusFilter] = useState<string>('ALL');
  const [resSortBy, setResSortBy] = useState<'date' | 'user' | 'pond' | 'pending'>('pending');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editingResInitialStatus, setEditingResInitialStatus] = useState<ReservationStatus | null>(null);

  // --- MANAGE USER STATE ---
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'user' | 'admin'>('ALL');
  const [userPage, setUserPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // --- MANAGE PENJUALAN STATE ---
  const [saleSearch, setSaleSearch] = useState('');
  const [saleVerifyFilter, setSaleVerifyFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [saleClassFilter, setSaleClassFilter] = useState<'ALL' | 'Kecil' | 'Sedang' | 'Besar'>('ALL');
  const [salePage, setSalePage] = useState(1);
  const [chartFishSpecies, setChartFishSpecies] = useState<string>(FISH_SPECIES_LIST[0]);

  const showToast = (msg: string) => {
    setAdminToast(msg);
  };

  // Filtered Reservations
  const filteredReservations = useMemo(() => {
    const q = resSearch.trim().toLowerCase();
    const list = reservations.filter((r) => {
      if (resDateFilter && r.date !== resDateFilter) return false;
      if (resStatusFilter !== 'ALL' && r.status !== resStatusFilter) return false;
      if (q) {
        return (
          r.userName.toLowerCase().includes(q) ||
          r.pondName.toLowerCase().includes(q) ||
          r.date.includes(q)
        );
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (resSortBy === 'pending') {
        const aNeedsAction =
          a.status === 'Menunggu Konfirmasi' || a.status === 'Menunggu Pembatalan' ? 0 : 1;
        const bNeedsAction =
          b.status === 'Menunggu Konfirmasi' || b.status === 'Menunggu Pembatalan' ? 0 : 1;
        if (aNeedsAction !== bNeedsAction) return aNeedsAction - bNeedsAction;
      }
      if (resSortBy === 'user') return a.userName.localeCompare(b.userName);
      if (resSortBy === 'pond') return a.pondName.localeCompare(b.pondName);
      return `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`);
    });
  }, [reservations, resSearch, resDateFilter, resStatusFilter, resSortBy]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
      if (q) {
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, userSearch, userRoleFilter]);

  const userPageSize = 15;
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const pagedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    const q = saleSearch.trim().toLowerCase();
    return sales.filter((s) => {
      if (saleVerifyFilter === 'PENDING' && s.isVerified) return false;
      if (saleVerifyFilter === 'VERIFIED' && !s.isVerified) return false;
      if (saleClassFilter !== 'ALL' && s.sizeClass !== saleClassFilter) return false;
      if (q) {
        return (
          s.saleCode.toLowerCase().includes(q) ||
          s.fishName.toLowerCase().includes(q) ||
          s.sellerName.toLowerCase().includes(q) ||
          (s.buyerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sales, saleSearch, saleVerifyFilter, saleClassFilter]);

  const salePageSize = 15;
  const totalSalePages = Math.max(1, Math.ceil(filteredSales.length / salePageSize));
  const pagedSales = filteredSales.slice((salePage - 1) * salePageSize, salePage * salePageSize);

  // Handlers for Membership Modal
  const openCreateMembership = () => {
    const draft: Membership = {
      id: `mem-${Date.now()}`,
      name: '',
      maxHoursPerSession: 4,
      accessiblePondIds: [ponds[0]?.id || 'pond-1'],
      priceMonthly: 200000,
      benefits: ['Akses kolam pilihan', 'Diskon umpan pancing 10%'],
      badgeColor: '#0284C7',
      tagline: 'Paket keanggotaan baru (Belum Launch)',
      isLaunched: false,
    };
    setEditingMembership(draft);
    setMemBenefitsInput(draft.benefits.join('\n'));
    setIsNewMembership(true);
  };

  const openEditMembership = (m: Membership) => {
    setEditingMembership({ ...m, accessiblePondIds: [...m.accessiblePondIds] });
    setMemBenefitsInput(m.benefits.join('\n'));
    setIsNewMembership(false);
  };

  const handleMembershipFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembership || !editingMembership.name.trim()) return;
    const benefits = memBenefitsInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onSaveMembership(
      {
        ...editingMembership,
        name: editingMembership.name.trim(),
        benefits: benefits.length > 0 ? benefits : ['Benefit standar anggota Telaga Semanan'],
      },
      isNewMembership
    );
    showToast(
      isNewMembership
        ? `Membership "${editingMembership.name}" dibuat dalam status Draft (Belum Launch).`
        : `Perubahan pada Membership "${editingMembership.name}" berhasil disimpan.`
    );
    setEditingMembership(null);
  };

  // Handlers for Pond Modal
  const openCreatePond = () => {
    const newPond: Pond = {
      id: `pond-${Date.now()}`,
      name: '',
      location: 'Kawasan Telaga Semanan Blok Baru, Jakarta Barat',
      branch: 'Cabang Semanan Baru',
      openTime: '06:00',
      closeTime: '22:00',
      status: 'Available',
      currentVisitors: 0,
      maxVisitors: 45,
      previousDaysVisitors: [
        { date: '19 Okt', visitors: 20 },
        { date: '20 Okt', visitors: 25 },
        { date: '21 Okt', visitors: 28 },
        { date: '22 Okt', visitors: 30 },
      ],
      fishPopulation: [
        { speciesName: 'Ikan Mas Kumpay', count: 250, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Gurame Soang', count: 150, rarityLabel: 'Langka' },
      ],
      description: 'Kolam pemancingan baru Telaga Semanan.',
    };
    setEditingPond(newPond);
    setIsNewPond(true);
  };

  const handlePondFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPond || !editingPond.name.trim()) return;
    onSavePond(editingPond, isNewPond);
    showToast(`Data kolam "${editingPond.name}" berhasil disimpan.`);
    setEditingPond(null);
  };

  // Handlers for User Modal
  const openCreateUser = () => {
    setEditingUser({
      id: `user-${Date.now()}`,
      name: '',
      email: '',
      password: '',
      role: 'user',
      membershipId: memberships[0]?.id || 'mem-bronze',
      membershipExpiresAt: '2027-01-23',
      paymentMethod: 'QRIS',
      signedUpAt: '2026-10-23',
      isBanned: false,
    });
    setIsNewUser(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.name.trim()) return;
    onSaveUser(
      {
        ...editingUser,
        name: editingUser.name.trim(),
        email: editingUser.email.trim() || `${editingUser.name.trim().toLowerCase()}@gmail.com`,
        password: editingUser.password || editingUser.name.trim(),
      },
      isNewUser
    );
    showToast(
      isNewUser
        ? `Akun ${editingUser.role.toUpperCase()} "${editingUser.name}" berhasil ditambahkan.`
        : `Data pengguna "${editingUser.name}" berhasil diperbarui.`
    );
    setEditingUser(null);
  };

  const pendingSalesCount = sales.filter((s) => !s.isVerified).length;
  const pendingReservationsCount = reservations.filter(
    (r) => r.status === 'Menunggu Konfirmasi'
  ).length;
  const pendingCancellationsCount = reservations.filter(
    (r) => r.status === 'Menunggu Pembatalan'
  ).length;
  const totalResActionCount = pendingReservationsCount + pendingCancellationsCount;
  const activeVisitorsTotal = ponds.reduce((acc, p) => acc + p.currentVisitors, 0);

  const renderResStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'Menunggu Konfirmasi':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
            Menunggu Konfirmasi
          </span>
        );
      case 'Dikonfirmasi':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
            Dikonfirmasi
          </span>
        );
      case 'Menunggu Pembatalan':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300/60 dark:border-orange-700/60">
            Menunggu ACC Pembatalan
          </span>
        );
      case 'Sedang berkunjung':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
            Sedang berkunjung
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-64 bg-[#0A192F] text-white border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800">
            <button
              type="button"
              onClick={onNavigateLanding}
              className="font-display text-lg font-bold tracking-tight text-white hover:text-cyan-300 cursor-pointer text-left"
            >
              Telaga Semanan
            </button>
            <div className="text-xs text-orange-400 font-semibold mt-0.5">
              Panel Administrator · {admin.name}
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Dashboard Utama</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('memberships')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'memberships'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Manage Membership ({memberships.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ponds')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'ponds'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Manage Kolam ({ponds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reservations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'reservations'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Manage Reservasi ({reservations.length})</span>
              </span>
              {totalResActionCount > 0 && (
                <span className="font-mono-tabular text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {totalResActionCount} ACC
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Manage User ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Fish className="w-4 h-4 shrink-0" />
                <span>Manage Penjualan ({sales.length})</span>
              </span>
              {pendingSalesCount > 0 && (
                <span className="font-mono-tabular text-[11px] text-amber-300">
                  {pendingSalesCount} ACC
                </span>
              )}
            </button>

            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onNavigateMarketplace}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 shrink-0" />
                <span>Lihat Marketplace Publik</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <div className="text-xs font-bold text-white">{admin.name}</div>
            <div className="text-[11px] text-slate-400">{admin.email}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`px-6 lg:px-10 py-4 border-b flex items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-500">
            <span>Panel Kendali Admin Telaga Semanan</span>
            <span className="mx-2">/</span>
            <strong className={darkMode ? 'text-white' : 'text-slate-900'}>
              {activeTab === 'dashboard' && 'Dashboard Utama & Statistik Aktivitas'}
              {activeTab === 'memberships' && 'Manage Membership (Launch & Benefit)'}
              {activeTab === 'ponds' && 'Manage Kolam & Live Populasi Ikan'}
              {activeTab === 'reservations' && 'Manage & Konfirmasi Reservasi Pengunjung'}
              {activeTab === 'users' && 'Manage User & Moderator'}
              {activeTab === 'sales' && 'Manage Penjualan & Verifikasi Bursa Ikan'}
            </strong>
          </div>
        </header>

        <main className="p-6 lg:p-10 space-y-6 flex-1">
          {adminToast && (
            <div
              role="status"
              className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-200 text-xs font-medium flex items-center justify-between"
            >
              <span>{adminToast}</span>
              <button
                type="button"
                onClick={() => setAdminToast(null)}
                className="text-xs font-bold underline ml-4 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* 1. DASHBOARD UTAMA */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Statistik & Aktivitas Overall Pemancingan Telaga Semanan
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Ringkasan langsung operasional 5 kolam, keanggotaan aktif, reservasi, dan bursa
                  Bursa Ikan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-xs text-slate-500">Total Akun Terdaftar</span>
                  <div className="font-mono-tabular text-2xl font-bold mt-1">
                    {users.length} Akun
                  </div>
                  <div className="text-xs text-teal-600 mt-1">
                    {users.filter((u) => u.role === 'user').length} Member ·{' '}
                    {users.filter((u) => u.role === 'admin').length} Admin
                  </div>
                </div>

                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-xs text-slate-500">Pengunjung di Kolam Hari Ini</span>
                  <div className="font-mono-tabular text-2xl font-bold mt-1">
                    {activeVisitorsTotal} Pemancing
                  </div>
                  <div className="text-xs text-teal-600 mt-1">
                    {ponds.filter((p) => p.status === 'Available').length} Kolam Available ·{' '}
                    {ponds.filter((p) => p.status === 'Sedang Maintenance').length} Maintenance
                  </div>
                </div>

                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-xs text-slate-500">Total Jadwal Reservasi</span>
                  <div className="font-mono-tabular text-2xl font-bold mt-1">
                    {reservations.length} Sesi
                  </div>
                  <div className="text-xs mt-1 space-y-0.5">
                    {pendingReservationsCount > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setResStatusFilter('Menunggu Konfirmasi');
                            setActiveTab('reservations');
                          }}
                          className="text-amber-600 font-semibold hover:underline cursor-pointer"
                        >
                          {pendingReservationsCount} Menunggu Konfirmasi →
                        </button>
                      </div>
                    )}
                    {pendingCancellationsCount > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setResStatusFilter('Menunggu Pembatalan');
                            setActiveTab('reservations');
                          }}
                          className="text-orange-600 font-semibold hover:underline cursor-pointer"
                        >
                          {pendingCancellationsCount} Pengajuan Pembatalan →
                        </button>
                      </div>
                    )}
                    {totalResActionCount === 0 && (
                      <span className="text-teal-600">
                        {reservations.filter((r) => r.status === 'Dikonfirmasi').length}{' '}
                        Dikonfirmasi ·{' '}
                        {reservations.filter((r) => r.status === 'Sedang berkunjung').length}{' '}
                        Berkunjung
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`p-5 rounded-xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-xs text-slate-500">Instance Penjualan Bursa Ikan</span>
                  <div className="font-mono-tabular text-2xl font-bold mt-1">
                    {sales.length} Penjualan
                  </div>
                  <div className="text-xs text-amber-600 font-semibold mt-1">
                    {pendingSalesCount} Menunggu Verifikasi (ACC) Admin
                  </div>
                </div>
              </div>

              {/* Pond Live Occupancy Table */}
              <div
                className={`rounded-xl border p-6 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold">
                    Status Operasional & Keterisian 5 Kolam Hari Ini
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ponds')}
                    className="text-xs font-semibold text-teal-600 hover:underline cursor-pointer"
                  >
                    Kelola Kolam →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-3 pr-4">Nama Kolam</th>
                        <th className="py-3 px-4">Cabang</th>
                        <th className="py-3 px-4">Jam Buka</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Pengunjung / Maks</th>
                        <th className="py-3 pl-4 text-right">Total Ikan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ponds.map((p) => {
                        const totalFish = p.fishPopulation.reduce((acc, f) => acc + f.count, 0);
                        return (
                          <tr key={p.id}>
                            <td className="py-3 pr-4 font-bold">{p.name}</td>
                            <td className="py-3 px-4 text-slate-500">{p.branch}</td>
                            <td className="py-3 px-4 font-mono-tabular">
                              {p.openTime} – {p.closeTime}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-semibold ${
                                  p.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-tabular font-semibold">
                              {p.currentVisitors} / {p.maxVisitors}
                            </td>
                            <td className="py-3 pl-4 text-right font-mono-tabular">
                              {totalFish.toLocaleString('id-ID')} Ekor
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. MANAGE MEMBERSHIP PAGE */}
          {activeTab === 'memberships' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">Manage Membership</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Membership baru dibuat dengan status tidak aktif (Draft) terlebih dahulu.
                    Setelah dilaunching, membership tidak dapat dihapus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateMembership}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Membership Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memberships.map((m) => {
                  const deletable = canDeleteMembership(m);
                  const pondNames = ponds
                    .filter((p) => m.accessiblePondIds.includes(p.id))
                    .map((p) => p.name);

                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-6 flex flex-col justify-between ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold text-teal-600">
                              {m.isLaunched
                                ? 'Status: Aktif (Sudah Launch)'
                                : 'Status: Tidak Aktif (Draft / Siap Launch)'}
                            </div>
                            <h2 className="font-display text-xl font-bold mt-0.5">
                              Membership {m.name}
                            </h2>
                            <p className="text-xs text-slate-500">{m.tagline}</p>
                          </div>
                          <div className="text-right font-mono-tabular">
                            <div className="text-lg font-bold">
                              Rp {m.priceMonthly.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-slate-500">
                              Maks. {m.maxHoursPerSession} Jam / Sesi
                            </div>
                          </div>
                        </div>

                        <div className="text-xs space-y-1">
                          <strong className="block text-slate-700 dark:text-slate-300">
                            Kolam yang Dapat Diakses ({pondNames.length}):
                          </strong>
                          <p className="text-slate-600 dark:text-slate-400">
                            {pondNames.join(' · ') || 'Belum ada kolam dipilih'}
                          </p>
                        </div>

                        <div className="text-xs space-y-1">
                          <strong className="block text-slate-700 dark:text-slate-300">
                            Benefit Membership:
                          </strong>
                          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                            {m.benefits.map((b, idx) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-5 mt-5 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => openEditMembership(m)}
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Membership</span>
                        </button>

                        {!m.isLaunched && (
                          <button
                            type="button"
                            onClick={() => {
                              onLaunchMembership(m.id);
                              showToast(
                                `Membership "${m.name}" berhasil di-launch! Sekarang aktif dan tidak dapat dihapus.`
                              );
                            }}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            <span>Launch Membership</span>
                          </button>
                        )}

                        {deletable ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteMembership(m.id);
                              showToast(`Draft Membership "${m.name}" telah dihapus.`);
                            }}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Draft</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="Membership yang sudah launch tidak dapat dihapus"
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-400 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 cursor-not-allowed ml-auto opacity-60"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Sudah Launch (Terkunci)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. MANAGE KOLAM PAGE */}
          {activeTab === 'ponds' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">Manage Kolam Pemancingan</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Atur status operasional kolam (Available / Sedang Maintenance), kapasitas
                    maksimum, statistik pengunjung, dan populasi ikan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreatePond}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Data Kolam</span>
                </button>
              </div>

              <div className="space-y-5">
                {ponds.map((pond) => {
                  const fishStats = calculateFishPercentages(pond.fishPopulation);
                  return (
                    <div
                      key={pond.id}
                      className={`rounded-xl border p-6 space-y-5 ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`font-bold ${
                                pond.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              Status: {pond.status}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500">{pond.branch}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular text-slate-500">
                              {pond.openTime} – {pond.closeTime} WIB
                            </span>
                          </div>
                          <h2 className="font-display text-xl font-bold mt-1">{pond.name}</h2>
                          <p className="text-xs text-slate-500">{pond.location}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus: PondStatus =
                                pond.status === 'Available' ? 'Sedang Maintenance' : 'Available';
                              onSavePond(
                                {
                                  ...pond,
                                  status: nextStatus,
                                  currentVisitors:
                                    nextStatus === 'Sedang Maintenance' ? 0 : pond.currentVisitors,
                                },
                                false
                              );
                              showToast(
                                `Status ${pond.name} diubah menjadi "${nextStatus}".`
                              );
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Ubah ke{' '}
                            {pond.status === 'Available' ? 'Sedang Maintenance' : 'Available'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPond({
                                ...pond,
                                fishPopulation: pond.fishPopulation.map((f) => ({ ...f })),
                              });
                              setIsNewPond(false);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#0A192F] hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Kolam & Ikan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onDeletePond(pond.id);
                              showToast(`Kolam "${pond.name}" telah dihapus.`);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                        {/* Visitor Statistics (Current & Previous Days) */}
                        <div className="lg:col-span-5 space-y-2">
                          <div className="font-bold text-slate-700 dark:text-slate-300">
                            Statistik Pengunjung Sekarang & Hari Sebelumnya (Maks:{' '}
                            <span className="font-mono-tabular">{pond.maxVisitors}</span>):
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex justify-between font-mono-tabular font-bold text-teal-600 dark:text-teal-300">
                              <span>Hari Ini (Live)</span>
                              <span>
                                {pond.currentVisitors} / {pond.maxVisitors} Pengunjung
                              </span>
                            </div>
                            {pond.previousDaysVisitors.map((stat) => (
                              <div
                                key={stat.date}
                                className="flex items-center justify-between text-slate-500 dark:text-slate-100 font-mono-tabular"
                              >
                                <span>{stat.date}</span>
                                <span>{stat.visitors} Pengunjung</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Fish Population Breakdown */}
                        <div className="lg:col-span-7 space-y-2">
                          <div className="font-bold text-slate-700 dark:text-slate-300">
                            Persentase Ikan di Dalam Kolam:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {fishStats.map((f) => (
                              <div
                                key={f.speciesName}
                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-bold">{f.speciesName}</div>
                                  <div className="text-[11px] text-slate-500">
                                    Populasi: {f.count} ekor · {f.rarityLabel}
                                  </div>
                                </div>
                                <span className="font-mono-tabular text-sm font-bold text-teal-600">
                                  {f.percentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. MANAGE RESERVASI PAGE */}
          {activeTab === 'reservations' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Manage & Konfirmasi Reservasi Pengunjung
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Konfirmasi (ACC) reservasi baru maupun pengajuan pembatalan sebelum berkunjung.
                  Jika status sudah <strong>Sedang berkunjung</strong>, reservasi tidak dapat
                  dibatalkan dan hanya dapat ditandai <strong>Sudah selesai</strong>.
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Cari Reservasi"
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    placeholder="Cari nama user atau kolam..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <input
                  type="date"
                  aria-label="Filter Tanggal Reservasi"
                  value={resDateFilter}
                  onChange={(e) => setResDateFilter(e.target.value)}
                  className={`px-3 py-2 text-xs rounded-lg border font-mono-tabular ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />

                <select
                  aria-label="Filter Status Reservasi"
                  value={resStatusFilter}
                  onChange={(e) => setResStatusFilter(e.target.value)}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">Semua Status Reservasi ({reservations.length})</option>
                  <option value="Menunggu Konfirmasi">
                    Menunggu Konfirmasi ({pendingReservationsCount})
                  </option>
                  <option value="Menunggu Pembatalan">
                    Menunggu ACC Pembatalan ({pendingCancellationsCount})
                  </option>
                  <option value="Dikonfirmasi">Dikonfirmasi</option>
                  <option value="Sedang berkunjung">Sedang berkunjung</option>
                  <option value="Sudah selesai">Sudah selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>

                <select
                  aria-label="Urutkan Reservasi"
                  value={resSortBy}
                  onChange={(e) => setResSortBy(e.target.value as typeof resSortBy)}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="pending">Sort by: Butuh ACC Admin Dulu</option>
                  <option value="date">Sort by: Tanggal & Jam</option>
                  <option value="user">Sort by: Nama User</option>
                  <option value="pond">Sort by: Nama Kolam</option>
                </select>
              </div>

              <div
                className={`rounded-xl border overflow-hidden ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-3.5 px-4">Nama Pemancing</th>
                        <th className="py-3.5 px-4">Kolam Tujuan</th>
                        <th className="py-3.5 px-4">Tanggal</th>
                        <th className="py-3.5 px-4">Waktu Sesi</th>
                        <th className="py-3.5 px-4">Status Reservasi</th>
                        <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReservations.slice(0, 40).map((r) => (
                        <tr
                          key={r.id}
                          className={
                            r.status === 'Menunggu Konfirmasi'
                              ? darkMode
                                ? 'bg-amber-950/20'
                                : 'bg-amber-50/50'
                              : r.status === 'Menunggu Pembatalan'
                              ? darkMode
                                ? 'bg-orange-950/20'
                                : 'bg-orange-50/50'
                              : ''
                          }
                        >
                          <td className="py-3 px-4 font-bold">{r.userName}</td>
                          <td className="py-3 px-4">{r.pondName}</td>
                          <td className="py-3 px-4 font-mono-tabular">{r.date}</td>
                          <td className="py-3 px-4 font-mono-tabular">
                            {r.startTime} – {r.endTime} WIB
                          </td>
                          <td className="py-3 px-4">
                            <div>{renderResStatusBadge(r.status)}</div>
                            {(r.status === 'Dibatalkan' || r.status === 'Menunggu Pembatalan') &&
                              r.cancelReason && (
                                <div
                                  className={`text-[11px] mt-0.5 ${
                                    r.status === 'Menunggu Pembatalan'
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-rose-500'
                                  }`}
                                >
                                  Alasan: {r.cancelReason}
                                </div>
                              )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* 1. Belum dikonfirmasi -> ACC atau Tolak */}
                            {r.status === 'Menunggu Konfirmasi' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveReservation({ ...r, status: 'Dikonfirmasi' });
                                    showToast(
                                      `Reservasi ${r.userName} di ${r.pondName} (${r.date}) telah DIKONFIRMASI.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded bg-teal-600 text-white hover:bg-teal-500 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>ACC Konfirmasi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveReservation({
                                      ...r,
                                      status: 'Dibatalkan',
                                      cancelReason: 'Ditolak oleh Admin',
                                    });
                                    showToast(
                                      `Reservasi ${r.userName} (${r.date}) telah ditolak/dibatalkan.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded border border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </>
                            )}

                            {/* 2. Dikonfirmasi / Belum datang -> Mulai Berkunjung atau Batalkan */}
                            {(r.status === 'Dikonfirmasi' || r.status === 'Belum datang') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveReservation({ ...r, status: 'Sedang berkunjung' });
                                    showToast(
                                      `${r.userName} kini berstatus Sedang berkunjung di ${r.pondName}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded bg-teal-600 text-white hover:bg-teal-500 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>Mulai Berkunjung</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveReservation({
                                      ...r,
                                      status: 'Dibatalkan',
                                      cancelReason: 'Dibatalkan oleh Admin sebelum kunjungan',
                                    });
                                    showToast(
                                      `Reservasi ${r.userName} (${r.date}) telah dibatalkan oleh Admin.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Batalkan</span>
                                </button>
                              </>
                            )}

                            {/* 3. Sedang berkunjung -> TIDAK BISA DIBATALKAN, hanya bisa Tandai Selesai */}
                            {r.status === 'Sedang berkunjung' && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSaveReservation({ ...r, status: 'Sudah selesai' });
                                  showToast(
                                    `Sesi memancing ${r.userName} di ${r.pondName} telah ditandai Sudah selesai.`
                                  );
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tandai Selesai</span>
                              </button>
                            )}

                            {/* 4. Menunggu Pembatalan -> ACC Pembatalan atau Tolak Batal */}
                            {r.status === 'Menunggu Pembatalan' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveReservation({
                                      ...r,
                                      status: 'Dibatalkan',
                                      cancelReason: r.cancelReason || 'Dibatalkan (ACC Admin)',
                                    });
                                    showToast(
                                      `Pembatalan reservasi ${r.userName} di ${r.pondName} (${r.date}) telah di-ACC Admin.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-500 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>ACC Pembatalan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveReservation({
                                      ...r,
                                      status: 'Dikonfirmasi',
                                      cancelReason: undefined,
                                    });
                                    showToast(
                                      `Pengajuan pembatalan ${r.userName} (${r.date}) ditolak; jadwal tetap Dikonfirmasi.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Tolak Batal</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingReservation({ ...r });
                                setEditingResInitialStatus(r.status);
                              }}
                              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteReservation(r.id);
                                showToast(`Reservasi ${r.userName} (${r.date}) dihapus.`);
                              }}
                              className="px-2.5 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. MANAGE USER PAGE */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">
                    Manage User & Administrator ({users.length} Akun)
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Pantau membership, tanggal sign up, reservasi, dan ikan yang dijual di Bursa Ikan,
                    serta tambahkan atau ban user yang melanggar TOS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateUser}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah User / Admin Baru</span>
                </button>
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Cari Nama atau Email User"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Cari User1..User100 atau admin1..admin5..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoleFilter('ALL');
                      setUserPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      userRoleFilter === 'ALL'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Semua ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoleFilter('user');
                      setUserPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      userRoleFilter === 'user'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    User Biasa ({users.filter((u) => u.role === 'user').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoleFilter('admin');
                      setUserPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                      userRoleFilter === 'admin'
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Admin ({users.filter((u) => u.role === 'admin').length})
                  </button>
                </div>
              </div>

              <div
                className={`rounded-xl border overflow-hidden ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-3.5 px-4">Nama & Email</th>
                        <th className="py-3.5 px-4">Role & Membership</th>
                        <th className="py-3.5 px-4">Sign Up</th>
                        <th className="py-3.5 px-4">Info Reservasi</th>
                        <th className="py-3.5 px-4">Penjualan Bursa Ikan</th>
                        <th className="py-3.5 px-4 text-right">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pagedUsers.map((u) => {
                        const mem = memberships.find((m) => m.id === u.membershipId);
                        const uRes = reservations.filter((r) => r.userId === u.id);
                        const uSales = sales.filter((s) => s.sellerId === u.id);

                        return (
                          <tr key={u.id} className={u.isBanned ? 'opacity-60 bg-rose-50/30' : ''}>
                            <td className="py-3 px-4">
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.isBanned && (
                                  <span className="text-[10px] text-rose-600 font-bold">
                                    [BANNED]
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold uppercase text-[11px] text-teal-600">
                                {u.role}
                              </span>
                              <div className="text-slate-500">
                                {mem?.name || 'Bronze'} (s/d {u.membershipExpiresAt})
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono-tabular">{u.signedUpAt}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono-tabular font-semibold">
                                {uRes.length} sesi
                              </span>
                              {uRes[0] && (
                                <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                  Terakhir: {uRes[0].pondName} ({uRes[0].date})
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono-tabular font-semibold">
                                {uSales.length} ikan dijual
                              </span>
                              {uSales[0] && (
                                <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                                  {uSales.map((s) => s.fishName).slice(0, 2).join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser({ ...u });
                                  setIsNewUser(false);
                                }}
                                className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleBanUser(u.id, 'Pelanggaran TOS / Aturan Pengunjungan');
                                  showToast(
                                    u.isBanned
                                      ? `Status ban ${u.name} telah dicabut.`
                                      : `User ${u.name} telah di-ban karena pelanggaran TOS.`
                                  );
                                }}
                                className="px-2.5 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold cursor-pointer"
                              >
                                {u.isBanned ? 'Unban' : 'Ban TOS'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteUser(u.id);
                                  showToast(`Akun ${u.name} telah dihapus.`);
                                }}
                                className="px-2.5 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono-tabular text-slate-500">
                    Halaman {userPage} dari {totalUserPages} ({filteredUsers.length} pengguna)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={userPage >= totalUserPages}
                      onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                      className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. MANAGE PENJUALAN PAGE */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  Manage Penjualan Bursa Ikan & Verifikasi Marketplace
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau grafik harga ikan seperti bursa saham (per tanggal, bulan, atau tahun),
                  verifikasi (ACC) penjualan user agar masuk ke marketplace, atau tiadakan
                  penjualan.
                </p>
              </div>

              {/* Stock Market Price Chart with X-Axis Combo Box (Tanggal, Bulan, Tahun) */}
              <StockChart
                selectedFish={chartFishSpecies}
                onSelectFish={setChartFishSpecies}
                allowFishSelection={true}
                darkMode={darkMode}
                compact={true}
              />

              {/* Filter & Search Bar for 200 Sales Instances */}
              <div
                className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    aria-label="Cari Kode Penjualan atau Ikan"
                    value={saleSearch}
                    onChange={(e) => {
                      setSaleSearch(e.target.value);
                      setSalePage(1);
                    }}
                    placeholder="Cari kode EF-2026, ikan, penjual, pembeli..."
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${
                      darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <select
                  aria-label="Filter Status Verifikasi Admin"
                  value={saleVerifyFilter}
                  onChange={(e) => {
                    setSaleVerifyFilter(e.target.value as typeof saleVerifyFilter);
                    setSalePage(1);
                  }}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">Semua Penjualan ({sales.length})</option>
                  <option value="PENDING">
                    Menunggu Verifikasi / ACC Admin ({pendingSalesCount})
                  </option>
                  <option value="VERIFIED">
                    Sudah Di-ACC Masuk Marketplace ({sales.length - pendingSalesCount})
                  </option>
                </select>

                <select
                  aria-label="Filter Kelas Ikan"
                  value={saleClassFilter}
                  onChange={(e) => {
                    setSaleClassFilter(e.target.value as typeof saleClassFilter);
                    setSalePage(1);
                  }}
                  className={`px-3 py-2 text-xs rounded-lg border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">Semua Kelas Ikan (Kecil / Sedang / Besar)</option>
                  <option value="Kecil">Kelas Kecil (&lt; 2 kg)</option>
                  <option value="Sedang">Kelas Sedang (2 – 5 kg)</option>
                  <option value="Besar">Kelas Besar (&gt; 5 kg)</option>
                </select>
              </div>

              <div
                className={`rounded-xl border overflow-hidden ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-3.5 px-4">Kode Penjualan</th>
                        <th className="py-3.5 px-4">Nama Ikan & Kolam</th>
                        <th className="py-3.5 px-4">Kelas & Berat</th>
                        <th className="py-3.5 px-4 text-right">Harga</th>
                        <th className="py-3.5 px-4">Penjual & Pembeli</th>
                        <th className="py-3.5 px-4">Status & Verifikasi</th>
                        <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {pagedSales.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 px-4 font-mono-tabular font-bold">{s.saleCode}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold">{s.fishName}</div>
                            <div className="text-slate-500">{s.pondName}</div>
                          </td>
                          <td className="py-3 px-4 font-mono-tabular">
                            Kelas {s.sizeClass} ({s.weightKg} kg)
                          </td>
                          <td className="py-3 px-4 text-right font-mono-tabular font-bold text-teal-600">
                            Rp {s.priceIdr.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            <div>Penjual: <strong>{s.sellerName}</strong></div>
                            <div className="text-slate-500">
                              Pembeli: {s.buyerName ? <strong>{s.buyerName}</strong> : 'Belum ada'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold">{s.status}</div>
                            <div
                              className={`text-[11px] font-semibold ${
                                s.isVerified ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {s.isVerified ? 'Terverifikasi (Di Marketplace)' : 'Menunggu ACC Admin'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            {!s.isVerified && (
                              <button
                                type="button"
                                onClick={() => {
                                  onVerifySale(s.id);
                                  showToast(
                                    `Penjualan ${s.saleCode} (${s.fishName}) telah di-ACC masuk ke Marketplace Bursa Ikan!`
                                  );
                                }}
                                className="px-2.5 py-1 rounded bg-teal-600 text-white hover:bg-teal-500 font-semibold cursor-pointer inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ACC Verifikasi</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onVoidSale(s.id);
                                showToast(`Penjualan ${s.saleCode} telah ditiadakan oleh Admin.`);
                              }}
                              className="px-2.5 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                            >
                              Tiadakan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono-tabular text-slate-500">
                    Halaman {salePage} dari {totalSalePages} ({filteredSales.length} instance
                    penjualan)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={salePage <= 1}
                      onClick={() => setSalePage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={salePage >= totalSalePages}
                      onClick={() => setSalePage((p) => Math.min(totalSalePages, p + 1))}
                      className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Add / Edit Membership */}
      {editingMembership && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-membership-modal-title"
        >
          <form
            onSubmit={handleMembershipFormSubmit}
            className={`rounded-xl border max-w-lg w-full p-6 shadow-xl space-y-4 my-8 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 id="admin-membership-modal-title" className="font-display text-lg font-bold">
                {isNewMembership ? 'Tambah Membership Baru (Draft)' : `Edit Membership ${editingMembership.name}`}
              </h3>
              <button
                type="button"
                aria-label="Tutup Modal Membership"
                onClick={() => setEditingMembership(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Membership</label>
                <input
                  type="text"
                  required
                  value={editingMembership.name}
                  onChange={(e) =>
                    setEditingMembership({ ...editingMembership, name: e.target.value })
                  }
                  placeholder="Contoh: Titanium VIP"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Waktu Maksimal Sesi (Jam)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={editingMembership.maxHoursPerSession}
                  onChange={(e) =>
                    setEditingMembership({
                      ...editingMembership,
                      maxHoursPerSession: Number(e.target.value) || 3,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Harga Bulanan (Rp)</label>
                <input
                  type="number"
                  step={5000}
                  required
                  value={editingMembership.priceMonthly}
                  onChange={(e) =>
                    setEditingMembership({
                      ...editingMembership,
                      priceMonthly: Number(e.target.value) || 150000,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={editingMembership.tagline}
                  onChange={(e) =>
                    setEditingMembership({ ...editingMembership, tagline: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Kolam yang Dapat Diakses:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {ponds.map((p) => {
                  const checked = editingMembership.accessiblePondIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...editingMembership.accessiblePondIds, p.id]
                            : editingMembership.accessiblePondIds.filter((id) => id !== p.id);
                          setEditingMembership({
                            ...editingMembership,
                            accessiblePondIds: next,
                          });
                        }}
                        className="accent-teal-600"
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Daftar Benefit (Satu per baris)
              </label>
              <textarea
                rows={3}
                value={memBenefitsInput}
                onChange={(e) => setMemBenefitsInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMembership(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer"
              >
                Simpan Membership
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Add / Edit Pond */}
      {editingPond && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-pond-modal-title"
        >
          <form
            onSubmit={handlePondFormSubmit}
            className={`rounded-xl border max-w-lg w-full p-6 shadow-xl space-y-4 my-8 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 id="admin-pond-modal-title" className="font-display text-lg font-bold">
                {isNewPond ? 'Tambah Kolam Baru' : `Edit Data ${editingPond.name}`}
              </h3>
              <button
                type="button"
                aria-label="Tutup Modal Kolam"
                onClick={() => setEditingPond(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Kolam</label>
                <input
                  type="text"
                  required
                  value={editingPond.name}
                  onChange={(e) => setEditingPond({ ...editingPond, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Status Kolam</label>
                <select
                  aria-label="Status Kolam"
                  value={editingPond.status}
                  onChange={(e) =>
                    setEditingPond({ ...editingPond, status: e.target.value as PondStatus })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  <option value="Available">Available</option>
                  <option value="Sedang Maintenance">Sedang Maintenance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Pengunjung Hari Ini</label>
                <input
                  type="number"
                  min={0}
                  value={editingPond.currentVisitors}
                  onChange={(e) =>
                    setEditingPond({
                      ...editingPond,
                      currentVisitors: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Maksimum Pengunjung</label>
                <input
                  type="number"
                  min={5}
                  value={editingPond.maxVisitors}
                  onChange={(e) =>
                    setEditingPond({
                      ...editingPond,
                      maxVisitors: Number(e.target.value) || 40,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Populasi Ikan di Kolam (Otomatis Dihitung Persentase)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {editingPond.fishPopulation.map((fp, idx) => (
                  <div key={fp.speciesName} className="flex items-center justify-between gap-2 text-xs">
                    <span>{fp.speciesName}</span>
                    <input
                      type="number"
                      min={0}
                      value={fp.count}
                      onChange={(e) => {
                        const nextPop: PondFishEntry[] = editingPond.fishPopulation.map((item, i) =>
                          i === idx ? { ...item, count: Number(e.target.value) || 0 } : item
                        );
                        setEditingPond({ ...editingPond, fishPopulation: nextPop });
                      }}
                      className="w-24 px-2 py-1 rounded border border-slate-300 font-mono-tabular text-right"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPond(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer"
              >
                Simpan Kolam
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Edit Reservation */}
      {editingReservation && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-res-modal-title"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveReservation(editingReservation);
              showToast(`Reservasi ${editingReservation.userName} berhasil diperbarui.`);
              setEditingReservation(null);
              setEditingResInitialStatus(null);
            }}
            className={`rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 id="admin-res-modal-title" className="font-display text-lg font-bold">
                Edit Reservasi ({editingReservation.userName})
              </h3>
              <button
                type="button"
                aria-label="Tutup Edit Reservasi"
                onClick={() => {
                  setEditingReservation(null);
                  setEditingResInitialStatus(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Tanggal Reservasi</label>
              <input
                type="date"
                value={editingReservation.date}
                onChange={(e) =>
                  setEditingReservation({ ...editingReservation, date: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Jam Mulai</label>
                <input
                  type="time"
                  value={editingReservation.startTime}
                  onChange={(e) =>
                    setEditingReservation({ ...editingReservation, startTime: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Jam Selesai</label>
                <input
                  type="time"
                  value={editingReservation.endTime}
                  onChange={(e) =>
                    setEditingReservation({ ...editingReservation, endTime: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Status Reservasi</label>
              <select
                aria-label="Ubah Status Reservasi"
                value={editingReservation.status}
                onChange={(e) =>
                  setEditingReservation({
                    ...editingReservation,
                    status: e.target.value as ReservationStatus,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
              >
                <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                <option value="Dikonfirmasi">Dikonfirmasi</option>
                <option value="Sedang berkunjung">Sedang berkunjung</option>
                <option value="Sudah selesai">Sudah selesai</option>
                {editingResInitialStatus !== 'Sedang berkunjung' && (
                  <>
                    <option value="Menunggu Pembatalan">Menunggu Pembatalan</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </>
                )}
              </select>
              {editingResInitialStatus === 'Sedang berkunjung' && (
                <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">
                  Pengunjung sedang berada di kolam. Status hanya dapat dilanjutkan menjadi Sudah
                  selesai (tidak dapat dibatalkan).
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingReservation(null);
                  setEditingResInitialStatus(null);
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Add / Edit User or Admin */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-modal-title"
        >
          <form
            onSubmit={handleUserFormSubmit}
            className={`rounded-xl border max-w-md w-full p-6 shadow-xl space-y-4 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 id="admin-user-modal-title" className="font-display text-lg font-bold">
                {isNewUser ? 'Tambah Akun User / Admin Baru' : `Edit Akun ${editingUser.name}`}
              </h3>
              <button
                type="button"
                aria-label="Tutup Modal User"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Peran Akun (Role)</label>
              <select
                aria-label="Pilih Peran Akun"
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              >
                <option value="user">User Biasa (Pemancing)</option>
                <option value="admin">User Admin (Pengelola)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Nama Pengguna</label>
              <input
                type="text"
                required
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                placeholder="Contoh: User101 atau admin6"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Alamat Gmail</label>
              <input
                type="email"
                required
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                placeholder="nama@gmail.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Tingkatan Membership</label>
              <select
                aria-label="Pilih Tingkatan Membership User"
                value={editingUser.membershipId}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, membershipId: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              >
                {memberships.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg cursor-pointer"
              >
                Simpan Akun
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};