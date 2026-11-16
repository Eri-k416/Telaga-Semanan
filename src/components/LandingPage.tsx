import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Lock,
  MapPin,
  ShieldCheck,
  Users,
  ArrowRight,
  LogIn,
  UserPlus,
  Check,
  X,
} from 'lucide-react';
import { HERO_LAKE_IMAGE, POND_IMAGES, getFishImage } from '../utils/artwork';
import {
  calculateFishPercentages,
  type AppUser,
  type Membership,
  type PaymentMethod,
  type Pond,
} from '../utils/domainLogic';

interface LandingPageProps {
  memberships: Membership[];
  ponds: Pond[];
  currentUser: AppUser | null;
  onLogin: (identifier: string, password: string, expectedRole?: 'user' | 'admin') => { ok: boolean; error?: string };
  onSignUp: (params: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
    membershipId: string;
    durationMonths: number;
    paymentMethod: PaymentMethod;
  }) => { ok: boolean; error?: string };
  onNavigateDashboard: () => void;
  onNavigateMarketplace: () => void;
  totalSalesCount: number;
}

const RevealSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.08 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  memberships,
  ponds,
  currentUser,
  onLogin,
  onSignUp,
  onNavigateDashboard,
  onNavigateMarketplace,
  totalSalesCount,
}) => {
  const launchedMemberships = memberships.filter((m) => m.isLaunched);

  // auth states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authRole, setAuthRole] = useState<'user' | 'admin'>('user');
  const [authError, setAuthError] = useState<string | null>(null);

  // login states
  const [loginIdentity, setLoginIdentity] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMembershipId, setSignupMembershipId] = useState(
    launchedMemberships[0]?.id || 'mem-bronze'
  );
  
  const [signupDurationMonths, setSignupDurationMonths] = useState<number>(3);
  const [signupPaymentMethod, setSignupPaymentMethod] = useState<PaymentMethod>('QRIS');

  // Selected pond preview in landing page
  const [selectedPondId, setSelectedPondId] = useState<string>(ponds[0]?.id || 'pond-1');
  const activePond = ponds.find((p) => p.id === selectedPondId) || ponds[0];

  const openAuth = (mode: 'login' | 'signup', preselectMembershipId?: string, role: 'user' | 'admin' = 'user') => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthError(null);
    if (preselectMembershipId) {
      setSignupMembershipId(preselectMembershipId);
    }
    setAuthModalOpen(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginIdentity.trim() || !loginPassword.trim()) {
      setAuthError('Silakan masukkan nama/email dan password Anda.');
      return;
    }
    const res = onLogin(loginIdentity.trim(), loginPassword, authRole);
    if (!res.ok) {
      setAuthError(res.error || 'Gagal masuk.');
    } else {
      setAuthModalOpen(false);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!signupName.trim()) {
      setAuthError('Nama lengkap wajib diisi.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setAuthError('Alamat Gmail yang valid wajib diisi (contoh: nama@gmail.com).');
      return;
    }
    if (signupPassword.length < 3) {
      setAuthError('Password minimal terdiri dari 3 karakter.');
      return;
    }
    const res = onSignUp({
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      role: authRole,
      membershipId: signupMembershipId,
      durationMonths: signupDurationMonths,
      paymentMethod: signupPaymentMethod,
    });
    if (!res.ok) {
      setAuthError(res.error || 'Gagal mendaftar.');
    } else {
      setAuthModalOpen(false);
    }
  };

  const handleQuickDemoLogin = (username: string, role?: 'user' | 'admin') => {
    setAuthError(null);
    const res = onLogin(username, username, role);
    if (res.ok) {
      setAuthModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-[#0A192F] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 w-full bg-[#0A192F]/95 backdrop-blur border-b border-slate-800 px-4 sm:px-6 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-8">
        <a
          href="#beranda"
          className="font-display text-base sm:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Telaga Semanan
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a
            href="/"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Informasi Dasar
          </a>
          <a
            href="#kolam"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Eksplorasi Kolam
          </a>
          <a
            href="#membership"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Membership
          </a>
          <button
            type="button"
            onClick={onNavigateMarketplace}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Pasar Bursa Ikan
          </button>
          
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          {currentUser ? (
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap truncate max-w-[175px] sm:max-w-none cursor-pointer"
            >
              Buka Dashboard ({currentUser.name})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap truncate max-w-[185px] sm:max-w-none cursor-pointer"
            >
              Masuk / Daftar Membership
            </button>
          )}
        </div>
      </header>

      <main id="beranda" className="flex-1">
        {/* Hero Split Section */}
        <section className="bg-[#0A192F] text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="text-xs font-medium text-cyan-400 tracking-wide mb-3">
                  Kawasan Wisata & Olahraga Memancing Air Tawar · Jakarta Barat
                </p>
                <h1
                  className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12] mb-5"
                  style={{ textWrap: 'balance' }}
                >
                  Sensasi Memancing Eksklusif & Bursa Ikan Segar Terintegrasi di Telaga Semanan.
                </h1>
                <p className="text-slate-300 text-base leading-relaxed max-w-2xl mb-8">
                  Nikmati lima kolam pemancingan berstandar kompetisi dan keluarga dengan sistem
                  kuota pengunjung langsung (live report), keanggotaan fleksibel, serta pasar
                  jual-beli hasil pancingan Bursa Ikan yang terverifikasi.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      currentUser ? onNavigateDashboard() : openAuth('signup', 'mem-silver')
                    }
                    className="px-6 py-3 text-sm font-semibold text-white bg-[#F97316] hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{currentUser ? 'Ke Dashboard Saya' : 'Daftar Membership Sekarang'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateMarketplace}
                    className="px-5 py-3 text-sm font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Jelajahi Pasar Bursa Ikan ({totalSalesCount} Listing)
                  </button>
                  {!currentUser && (
                    <button
                      type="button"
                      onClick={() => openAuth('login')}
                      className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Sudah Punya Akun? Masuk
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 flex">
                <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 flex flex-col justify-end min-h-[290px]">
                  <img
                    src={HERO_LAKE_IMAGE}
                    alt="Panorama Danau dan Dermaga Kayu Pemancingan Telaga Semanan"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/75 to-transparent p-6 pt-16">
                    <div className="text-xs text-cyan-300 font-medium mb-1">
                      Kondisi Air & Cuaca Hari Ini · Jam Operasional 06:00 – 24:00 WIB
                    </div>
                    <p className="text-sm font-semibold text-white">
                      5 Kolam Tematik dengan Pemantauan Kapasitas Real-Time & Populasi Ikan Terukur
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width 4-column metric bar below hero split */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-800/90">
              <div>
                <div className="text-xs text-slate-400">Total Kolam Tematik</div>
                <div className="font-mono-tabular text-2xl font-bold text-white mt-1">
                  {ponds.reduce((acc, pond) => acc + (pond.status === 'Available' ? 1 : 0), 0)} Kolam Aktif
                </div>
                <div className="text-xs text-teal-400 mt-0.5">
                  Reguler, Harian, Galatama & VIP
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Komunitas Pemancing Terdaftar</div>
                <div className="font-mono-tabular text-2xl font-bold text-white mt-1">
                  100+ Anggota
                </div>
                <div className="text-xs text-teal-400 mt-0.5">
                  Tersebar di tier Bronze, Silver & Gold
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Bursa Pasar Bursa Ikan</div>
                <div className="font-mono-tabular text-2xl font-bold text-white mt-1">
                  {totalSalesCount} Transaksi
                </div>
                <div className="text-xs text-teal-400 mt-0.5">
                  Jual-beli tangkapan segar terverifikasi
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Varietas Ikan Air Tawar</div>
                <div className="font-mono-tabular text-2xl font-bold text-white mt-1">
                  8 Spesies Unggulan
                </div>
                <div className="text-xs text-teal-400 mt-0.5">
                  Mas Kumpay, Gurame, Tombro & Toman
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informasi Dasar & Eksplorasi 5 Kolam */}
        <RevealSection className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div id="tentang" className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-teal-700 mb-1">
                01. Informasi Dasar & Fasilitas Kolam
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Eksplorasi 5 Kolam Pemancingan Telaga Semanan
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Pilih salah satu kolam di bawah untuk melihat lokasi cabang, jam buka, laporan jumlah
              pengunjung hari ini, serta persentase kelangkaan ikan.
            </p>
          </div>

          <div id="kolam" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left column: Pond Selector List */}
            <div className="lg:col-span-5 space-y-3">
              {ponds.map((pond) => {
                const isSelected = pond.id === activePond?.id;
                const accessTiers = launchedMemberships
                  .filter((m) => m.accessiblePondIds.includes(pond.id))
                  .map((m) => m.name)
                  .join(', ');

                return (
                  <button
                    key={pond.id}
                    type="button"
                    onClick={() => setSelectedPondId(pond.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A192F] text-white border-[#0A192F]'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-teal-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-base">{pond.name}</span>
                      <span
                        className={`text-xs font-medium ${
                          pond.status === 'Available'
                            ? isSelected
                              ? 'text-cyan-300'
                              : 'text-teal-700'
                            : 'text-amber-500'
                        }`}
                      >
                        {pond.status === 'Available' ? 'Buka · Available' : 'Sedang Maintenance'}
                      </span>
                    </div>
                    <div
                      className={`text-xs mt-1 flex flex-wrap items-center gap-2 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span>{pond.branch}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {pond.openTime} - {pond.closeTime} WIB
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">
                        {pond.currentVisitors}/{pond.maxVisitors} Pemancing
                      </span>
                    </div>
                    <div
                      className={`text-xs mt-2 pt-2 border-t ${
                        isSelected
                          ? 'border-slate-800 text-cyan-300'
                          : 'border-slate-100 text-slate-600'
                      }`}
                    >
                      Akses Membership: <strong>{accessTiers || 'Khusus VIP'}</strong>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right column: Detailed Live Pond Report */}
            {activePond && (
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative h-56 bg-slate-900">
                  <img
                    src={POND_IMAGES[activePond.id] || HERO_LAKE_IMAGE}
                    alt={activePond.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/45 to-transparent flex flex-col justify-end p-6">
                    <div className="text-xs text-cyan-300 font-medium">
                      {activePond.branch} · {activePond.status}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white mt-0.5">
                      {activePond.name}
                    </h3>
                    <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{activePond.location}</span>
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-sm text-slate-600 leading-relaxed">{activePond.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>Jam Operasional</span>
                      </div>
                      <div className="font-mono-tabular text-sm font-bold text-slate-900 mt-1">
                        {activePond.openTime} – {activePond.closeTime} WIB
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span>Live Report Pengunjung</span>
                      </div>
                      <div className="font-mono-tabular text-sm font-bold text-slate-900 mt-1">
                        {activePond.currentVisitors} / {activePond.maxVisitors} Orang
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Ketersediaan Kuota</div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-teal-600 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((activePond.currentVisitors / activePond.maxVisitors) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fish Population & Rarity Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-3">
                      Komposisi & Persentase Kelangkaan Ikan di {activePond.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {calculateFishPercentages(activePond.fishPopulation).map((fish) => (
                        <div
                          key={fish.speciesName}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60"
                        >
                          <img
                            src={getFishImage(fish.speciesName)}
                            alt={fish.speciesName}
                            referrerPolicy="no-referrer"
                            className="w-14 h-10 rounded object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {fish.speciesName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono-tabular font-semibold text-teal-700">
                                {fish.percentage}%
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>Rarity: {fish.rarityLabel}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </RevealSection>

        {/* Membership Tiers Section */}
        <RevealSection className="bg-white border-y border-slate-200 py-16">
          <div id="membership" className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-teal-700 mb-1">
                  02. Pilihan Paket Keanggotaan Resmi
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Membership Pemancingan Telaga Semanan
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-md">
                Setiap tingkatan membership menentukan batas durasi sesi memancing per kunjungan dan
                hak akses kolam yang dapat Anda reservasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {launchedMemberships.map((tier) => {
                const tierPonds = ponds.filter((p) => tier.accessiblePondIds.includes(p.id));
                const LockedPonds = ponds.filter((p) => !tier.accessiblePondIds.includes(p.id));

                return (
                  <div
                    key={tier.id}
                    className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-teal-700">
                          Paket Keanggotaan
                        </span>
                        <span className="font-mono-tabular text-xs font-semibold text-slate-600">
                          Maks. {tier.maxHoursPerSession} Jam / Sesi
                        </span>
                      </div>

                      <h3 className="font-display text-2xl font-bold text-slate-900 mt-1">
                        Membership {tier.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">{tier.tagline}</p>

                      <div className="mt-5 pb-5 border-b border-slate-200">
                        <span className="font-mono-tabular text-3xl font-bold text-slate-900">
                          Rp {tier.priceMonthly.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-slate-500"> / bulan</span>
                      </div>

                      {/* Accessible Ponds */}
                      <div className="mt-5">
                        <div className="text-xs font-semibold text-slate-800 mb-2">
                          Akses Kolam ({tierPonds.length} dari {ponds.length} Kolam):
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {tierPonds.map((p) => (
                            <li key={p.id} className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{p.name}</span>
                            </li>
                          ))}
                          {LockedPonds.map((p) => (
                            <li key={p.id} className="flex items-center gap-2 text-slate-400">
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="line-through">{p.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div className="mt-5">
                        <div className="text-xs font-semibold text-slate-800 mb-2">
                          Benefit Eksklusif:
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {tier.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openAuth('signup', tier.id)}
                      className="mt-6 w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#0A192F] hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Pilih Membership {tier.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </RevealSection>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#0A192F] text-slate-400 text-xs py-10 px-6 lg:px-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-display font-bold text-white text-sm">Telaga Semanan</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Jl. Raya Semanan Kalideres, Jakarta Barat</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#kolam" className="hover:text-white transition-colors">
              Kolam
            </a>
            <a href="#membership" className="hover:text-white transition-colors">
              Membership
            </a>
            <button
              type="button"
              onClick={onNavigateMarketplace}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Marketplace Bursa Ikan
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login & Sign Up with Membership + Payment Method Debit/QRIS) */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="bg-white text-slate-900 rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#0A192F] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Masuk Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-[#0A192F] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Daftar Membership Baru
                </button>
              </div>
              <button
                type="button"
                aria-label="Tutup Dialog Autentikasi"
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Selector: Regular User vs Administrator */}
            <div className="mt-4 p-1 bg-slate-100 rounded-lg grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthRole('user');
                  setAuthError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  authRole === 'user'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portal Member / Pemancing
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthRole('admin');
                  setAuthError(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  authRole === 'admin'
                    ? 'bg-white text-orange-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portal Administrator
              </button>
            </div>

            {authError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
              >
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                <h3 id="auth-modal-title" className="font-display text-lg font-bold">
                  Log in akun Telaga Semanan
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pengguna atau Gmail
                  </label>
                  <input
                    type="text"
                    value={loginIdentity}
                    onChange={(e) => setLoginIdentity(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#0A192F] hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Sekarang</span>
                </button>

                {/* Instant Demo Login Shortcuts for Seeded Accounts */}
                <div className="pt-4 border-t border-slate-10 hidden">
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">
                    Akses Cepat Akun Seed Database: (view admin)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('User1', 'user')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-600 text-slate-800 cursor-pointer"
                    >
                      Masuk sebagai User1 (Silver)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('User2', 'user')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-600 text-slate-800 cursor-pointer"
                    >
                      Masuk sebagai User2 (Gold)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('admin1', 'admin')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900 cursor-pointer"
                    >
                      Masuk sebagai admin1 (Admin)
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="mt-5 space-y-4">
                <h3 id="auth-modal-title" className="font-display text-lg font-bold">
                  Registrasi Anggota & Pembelian Membership
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Pengguna
                    </label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Gmail
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="budi@gmail.com"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Buat password akun"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih Membership
                    </label>
                    <select
                      aria-label="Pilih Membership"
                      value={signupMembershipId}
                      onChange={(e) => setSignupMembershipId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {launchedMemberships.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (Maks {m.maxHoursPerSession} Jam)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Masa Berlaku
                    </label>
                    <select
                      aria-label="Pilih Masa Berlaku"
                      value={signupDurationMonths}
                      onChange={(e) => setSignupDurationMonths(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value={1}>1 Bulan</option>
                      <option value={3}>3 Bulan</option>
                      <option value={6}>6 Bulan</option>
                      <option value={12}>12 Bulan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      aria-label="Metode Pembayaran"
                      value={signupPaymentMethod}
                      onChange={(e) => setSignupPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="Debit">Debit</option>
                      <option value="QRIS">QRIS</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#F97316] hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar & Aktifkan Membership</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
