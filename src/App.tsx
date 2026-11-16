import React, { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { BursaIkan } from './components/BursaIkan';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import {
  addMonthsToDate,
  classifyFishSize,
  validateReservationInput,
  type AppUser,
  type FishSale,
  type Membership,
  type PaymentMethod,
  type Pond,
  type Reservation,
} from './utils/domainLogic';
import { generateInitialDatabase, type DatabaseState } from './utils/seedData';

const STORAGE_KEY = 'telaga_semanan_db_v1';
const SESSION_USER_KEY = 'telaga_semanan_session_user_id';
const DARK_MODE_KEY = 'telaga_semanan_dark_mode';

export type ActiveRoute = 'landing' | 'dashboard' | 'marketplace';

export default function App() {
  const [db, setDb] = useState<DatabaseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DatabaseState;
        if (
          parsed &&
          Array.isArray(parsed.users) &&
          parsed.users.length >= 100 &&
          Array.isArray(parsed.sales) &&
          parsed.sales.length >= 150
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors and use deterministic seed
    }
    return generateInitialDatabase();
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_USER_KEY);
    } catch {
      return null;
    }
  });

  const [route, setRoute] = useState<ActiveRoute>('landing');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DARK_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore quota errors
    }
  }, [db]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(SESSION_USER_KEY, currentUserId);
      } else {
        localStorage.removeItem(SESSION_USER_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_KEY, String(darkMode));
    } catch {
      // ignore
    }
  }, [darkMode]);

  const currentUser: AppUser | null =
    db.users.find((u) => u.id === currentUserId) || null;

  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = (
    identifier: string,
    password: string,
    expectedRole?: 'user' | 'admin'
  ): { ok: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const matched = db.users.find(
      (u) =>
        (u.name.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
        u.password === password
    );

    if (!matched) {
      return {
        ok: false,
        error:
          'Nama pengguna/Gmail atau password tidak cocok. Silakan periksa kembali dan coba lagi.',
      };
    }

    if (expectedRole && matched.role !== expectedRole) {
      return {
        ok: false,
        error:
          expectedRole === 'admin'
            ? 'Akun ini adalah akun Member biasa. Silakan gunakan Portal Member / Pemancing.'
            : 'Akun ini adalah akun Administrator. Silakan pilih tab Portal Administrator.',
      };
    }

    if (matched.isBanned) {
      return {
        ok: false,
        error: `Akun ${matched.name} sedang di-ban oleh Administrator: ${
          matched.banReason || 'Pelanggaran TOS'
        }.`,
      };
    }

    setCurrentUserId(matched.id);
    setRoute('dashboard');
    return { ok: true };
  };

  const handleSignUp = (params: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
    membershipId: string;
    durationMonths: number;
    paymentMethod: PaymentMethod;
  }): { ok: boolean; error?: string } => {
    const cleanName = params.name.trim();
    const cleanEmail = params.email.trim().toLowerCase();

    const exists = db.users.some(
      (u) =>
        u.name.toLowerCase() === cleanName.toLowerCase() ||
        u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return {
        ok: false,
        error: 'Nama pengguna atau alamat Gmail tersebut sudah terdaftar.',
      };
    }

    const expiresAt = addMonthsToDate('2026-10-23', params.durationMonths);
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: params.password,
      role: params.role || 'user',
      membershipId: params.membershipId,
      membershipExpiresAt: expiresAt,
      paymentMethod: params.paymentMethod,
      signedUpAt: '2026-10-23',
      isBanned: false,
    };

    setDb((prev) => ({
      ...prev,
      users: [newUser, ...prev.users],
    }));
    setCurrentUserId(newUser.id);
    setRoute('dashboard');
    return { ok: true };
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setRoute('landing');
  };

  // --- USER DASHBOARD HANDLERS ---
  const handleUpdateUserMembership = (params: {
    membershipId: string;
    durationMonths: number;
    paymentMethod: PaymentMethod;
    isRenewal: boolean;
  }) => {
    if (!currentUser) return;
    const baseDate = params.isRenewal ? currentUser.membershipExpiresAt : '2026-10-23';
    const nextExpiry = addMonthsToDate(baseDate, params.durationMonths);

    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              membershipId: params.membershipId,
              membershipExpiresAt: nextExpiry,
              paymentMethod: params.paymentMethod,
            }
          : u
      ),
    }));
  };

  const handleCreateReservation = (params: {
    pondId: string;
    date: string;
    startTime: string;
    endTime: string;
  }): { ok: boolean; error?: string } => {
    if (!currentUser) return { ok: false, error: 'Silakan masuk terlebih dahulu.' };
    const membership = db.memberships.find((m) => m.id === currentUser.membershipId);
    const pond = db.ponds.find((p) => p.id === params.pondId);
    const userReservations = db.reservations.filter((r) => r.userId === currentUser.id);

    const check = validateReservationInput({
      user: currentUser,
      membership,
      pond,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      existingUserReservations: userReservations,
    });

    if (!check.valid || !pond) {
      return { ok: false, error: check.error || 'Reservasi tidak valid.' };
    }

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      pondId: pond.id,
      pondName: pond.name,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      status: 'Menunggu Konfirmasi',
    };

    setDb((prev) => ({
      ...prev,
      reservations: [newRes, ...prev.reservations],
      ponds: prev.ponds.map((p) =>
        p.id === pond.id
          ? { ...p, currentVisitors: Math.min(p.maxVisitors, p.currentVisitors + 1) }
          : p
      ),
    }));

    return { ok: true };
  };

  // Pengajuan pembatalan oleh user -> status menjadi 'Menunggu Pembatalan' untuk di-ACC Admin
  const handleCancelReservation = (reservationId: string, reason?: string) => {
    const targetRes = db.reservations.find((r) => r.id === reservationId);
    if (
      !targetRes ||
      targetRes.status === 'Dibatalkan' ||
      targetRes.status === 'Menunggu Pembatalan' ||
      targetRes.status === 'Sudah selesai'
    ) {
      return;
    }

    setDb((prev) => ({
      ...prev,
      reservations: prev.reservations.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: 'Menunggu Pembatalan',
              cancelReason: reason || 'Pengajuan pembatalan oleh pemancing',
            }
          : r
      ),
    }));
  };

  const handleCreateUserSale = (params: {
    fishName: string;
    weightKg: number;
    priceIdr: number;
    pondId: string;
    activeUntil: string;
  }) => {
    if (!currentUser) return;
    const pond = db.ponds.find((p) => p.id === params.pondId) || db.ponds[0];
    const nextCodeNum = db.sales.length + 1;
    const newSale: FishSale = {
      id: `sale-${Date.now()}`,
      saleCode: `EF-2026-${String(nextCodeNum).padStart(4, '0')}`,
      fishName: params.fishName,
      weightKg: params.weightKg,
      sizeClass: classifyFishSize(params.weightKg),
      priceIdr: params.priceIdr,
      status: 'Open',
      createdAt: '2026-10-23',
      activeUntil: params.activeUntil,
      pondId: pond.id,
      pondName: pond.name,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      buyerId: null,
      buyerName: null,
      isVerified: false, // Requires Admin ACC to enter public marketplace
    };

    setDb((prev) => ({
      ...prev,
      sales: [newSale, ...prev.sales],
    }));
  };

  const handleDeleteSale = (saleId: string) => {
    setDb((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== saleId),
    }));
  };

  // --- MARKETPLACE ORDER HANDLER ---
  const handlePlaceOrder = (
    saleId: string,
    paymentMethod: PaymentMethod,
    _notes: string
  ): { ok: boolean; error?: string } => {
    if (!currentUser) {
      return { ok: false, error: 'Silakan login terlebih dahulu untuk membeli ikan.' };
    }
    const target = db.sales.find((s) => s.id === saleId);
    if (!target) {
      return { ok: false, error: 'Data penjualan tidak ditemukan.' };
    }
    if (target.status !== 'Open') {
      return { ok: false, error: 'Ikan ini sudah tidak berstatus Open.' };
    }
    if (target.sellerId === currentUser.id) {
      return { ok: false, error: 'Anda tidak dapat membeli ikan yang Anda jual sendiri.' };
    }

    setDb((prev) => ({
      ...prev,
      sales: prev.sales.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: 'Sudah dibeli',
              buyerId: currentUser.id,
              buyerName: currentUser.name,
              paymentMethod,
            }
          : s
      ),
    }));

    return { ok: true };
  };

  // --- ADMIN HANDLERS ---
  const handleSaveMembership = (membership: Membership, isNew: boolean) => {
    setDb((prev) => ({
      ...prev,
      memberships: isNew
        ? [...prev.memberships, membership]
        : prev.memberships.map((m) => (m.id === membership.id ? membership : m)),
    }));
  };

  const handleLaunchMembership = (membershipId: string) => {
    setDb((prev) => ({
      ...prev,
      memberships: prev.memberships.map((m) =>
        m.id === membershipId ? { ...m, isLaunched: true } : m
      ),
    }));
  };

  const handleDeleteMembership = (membershipId: string) => {
    setDb((prev) => ({
      ...prev,
      memberships: prev.memberships.filter(
        (m) => !(m.id === membershipId && !m.isLaunched)
      ),
    }));
  };

  const handleSavePond = (pond: Pond, isNew: boolean) => {
    setDb((prev) => ({
      ...prev,
      ponds: isNew
        ? [...prev.ponds, pond]
        : prev.ponds.map((p) => (p.id === pond.id ? pond : p)),
    }));
  };

  const handleDeletePond = (pondId: string) => {
    setDb((prev) => ({
      ...prev,
      ponds: prev.ponds.filter((p) => p.id !== pondId),
    }));
  };

  const handleSaveReservation = (reservation: Reservation) => {
    const prevRes = db.reservations.find((r) => r.id === reservation.id);
    const becameCancelled =
      prevRes && prevRes.status !== 'Dibatalkan' && reservation.status === 'Dibatalkan';

    setDb((prev) => ({
      ...prev,
      reservations: prev.reservations.map((r) =>
        r.id === reservation.id ? reservation : r
      ),
      ponds: becameCancelled
        ? prev.ponds.map((p) =>
            p.id === reservation.pondId
              ? { ...p, currentVisitors: Math.max(0, p.currentVisitors - 1) }
              : p
          )
        : prev.ponds,
    }));
  };

  const handleDeleteReservation = (reservationId: string) => {
    setDb((prev) => ({
      ...prev,
      reservations: prev.reservations.filter((r) => r.id !== reservationId),
    }));
  };

  const handleSaveUser = (user: AppUser, isNew: boolean) => {
    setDb((prev) => ({
      ...prev,
      users: isNew
        ? [user, ...prev.users]
        : prev.users.map((u) => (u.id === user.id ? user : u)),
    }));
  };

  const handleToggleBanUser = (userId: string, reason?: string) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              isBanned: !u.isBanned,
              banReason: !u.isBanned ? reason : undefined,
            }
          : u
      ),
    }));
  };

  const handleDeleteUser = (userId: string) => {
    setDb((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  const handleVerifySale = (saleId: string) => {
    setDb((prev) => ({
      ...prev,
      sales: prev.sales.map((s) =>
        s.id === saleId ? { ...s, isVerified: true } : s
      ),
    }));
  };

  // --- ROUTING & ROLE-BASED ACCESS CONTROL ---
  if (route === 'marketplace') {
    return (
      <BursaIkan
        sales={db.sales}
        ponds={db.ponds}
        currentUser={currentUser}
        darkMode={darkMode}
        onBack={() => setRoute(currentUser ? 'dashboard' : 'landing')}
        onPlaceOrder={handlePlaceOrder}
        onRequireLogin={() => setRoute('landing')}
      />
    );
  }

  if (route === 'dashboard' && currentUser) {
    if (currentUser.role === 'admin') {
      return (
        <AdminDashboard
          admin={currentUser}
          users={db.users}
          memberships={db.memberships}
          ponds={db.ponds}
          reservations={db.reservations}
          sales={db.sales}
          darkMode={darkMode}
          onLogout={handleLogout}
          onNavigateLanding={() => setRoute('landing')}
          onNavigateMarketplace={() => setRoute('marketplace')}
          onSaveMembership={handleSaveMembership}
          onLaunchMembership={handleLaunchMembership}
          onDeleteMembership={handleDeleteMembership}
          onSavePond={handleSavePond}
          onDeletePond={handleDeletePond}
          onSaveReservation={handleSaveReservation}
          onDeleteReservation={handleDeleteReservation}
          onSaveUser={handleSaveUser}
          onToggleBanUser={handleToggleBanUser}
          onDeleteUser={handleDeleteUser}
          onVerifySale={handleVerifySale}
          onVoidSale={handleDeleteSale}
        />
      );
    }

    return (
      <UserDashboard
        user={currentUser}
        memberships={db.memberships}
        ponds={db.ponds}
        reservations={db.reservations}
        sales={db.sales}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onLogout={handleLogout}
        onNavigateMarketplace={() => setRoute('marketplace')}
        onNavigateLanding={() => setRoute('landing')}
        onUpdateMembership={handleUpdateUserMembership}
        onCreateReservation={handleCreateReservation}
        onCancelReservation={handleCancelReservation}
        onCreateSale={handleCreateUserSale}
        onDeleteSale={handleDeleteSale}
      />
    );
  }

  return (
    <LandingPage
      memberships={db.memberships}
      ponds={db.ponds}
      currentUser={currentUser}
      onLogin={handleLogin}
      onSignUp={handleSignUp}
      onNavigateDashboard={() => setRoute('dashboard')}
      onNavigateMarketplace={() => setRoute('marketplace')}
      totalSalesCount={db.sales.filter((s) => s.isVerified).length}
    />
  );
}