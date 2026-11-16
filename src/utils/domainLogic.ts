export type PaymentMethod =
  | 'QRIS'
  | 'VA BCA'
  | 'VA Mandiri'
  | 'VA BNI'
  | 'VA BRI'
  | 'Debit'
  | 'Tunai';

export type PondStatus = 'Available' | 'Sedang Maintenance';

export type ReservationStatus =
  | 'Menunggu Konfirmasi'
  | 'Dikonfirmasi'
  | 'Belum datang'
  | 'Sedang berkunjung'
  | 'Sudah selesai'
  | 'Dibatalkan';

export type SaleStatus = 'Open' | 'On progress' | 'Sudah dibeli';
export type FishSizeClass = 'Kecil' | 'Sedang' | 'Besar';
export type PriceTimeframe = 'Tanggal' | 'Bulan' | 'Tahun';

export interface PaymentOption {
  value: PaymentMethod;
  label: string;
  category: 'QRIS' | 'Virtual Account' | 'Lainnya';
  vaPrefix?: string;
  accentColor: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentOption[] = [
  { value: 'QRIS', label: 'QRIS Instan', category: 'QRIS', accentColor: '#E11D48' },
  { value: 'VA BCA', label: 'BCA Virtual Account', category: 'Virtual Account', vaPrefix: '88010', accentColor: '#0060AF' },
  { value: 'VA Mandiri', label: 'Mandiri Virtual Account', category: 'Virtual Account', vaPrefix: '89022', accentColor: '#003D79' },
  { value: 'VA BNI', label: 'BNI Virtual Account', category: 'Virtual Account', vaPrefix: '82410', accentColor: '#F15A23' },
  { value: 'VA BRI', label: 'BRI Virtual Account', category: 'Virtual Account', vaPrefix: '26215', accentColor: '#00529C' },
  { value: 'Debit', label: 'Kartu Debit (EDC)', category: 'Lainnya', accentColor: '#0F766E' },
  { value: 'Tunai', label: 'Tunai di Loket', category: 'Lainnya', accentColor: '#475569' },
];

export interface Membership {
  id: string;
  name: string;
  maxHoursPerSession: number;
  accessiblePondIds: string[];
  priceMonthly: number;
  benefits: string[];
  badgeColor: string;
  tagline: string;
  isLaunched: boolean;
  isActive?: boolean;
}

export interface PondFishEntry {
  speciesName: string;
  count: number;
  rarityLabel: 'Umum' | 'Langka' | 'Legendaris';
}

export interface DailyVisitorStat {
  date: string;
  visitors: number;
}

export interface Pond {
  id: string;
  name: string;
  location: string;
  branch: string;
  openTime: string;
  closeTime: string;
  status: PondStatus;
  currentVisitors: number;
  maxVisitors: number;
  previousDaysVisitors: DailyVisitorStat[];
  fishPopulation: PondFishEntry[];
  description: string;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  pondId: string;
  pondName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: ReservationStatus;
  cancelReason?: string;
  confirmedAt?: string;
}

export interface FishSale {
  id: string;
  saleCode: string;
  fishName: string;
  weightKg: number;
  sizeClass: FishSizeClass;
  priceIdr: number;
  status: SaleStatus;
  activeUntil: string; // YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
  pondId: string;
  pondName: string;
  sellerId: string;
  sellerName: string;
  buyerId: string | null;
  buyerName: string | null;
  paymentMethod?: PaymentMethod;
  isVerified: boolean; // Admin ACC required to appear in public marketplace
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  membershipId: string;
  membershipExpiresAt: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  signedUpAt: string; // YYYY-MM-DD
  isBanned: boolean;
  banReason?: string;
}

export interface FishPercentagesResult {
  speciesName: string;
  count: number;
  percentage: number;
  rarityLabel: 'Umum' | 'Langka' | 'Legendaris';
}

// klasifikasi ikan: ringan (<2kg), Sedang (2-5kg), or Besar (>5kg)
export function classifyFishSize(weightKg: number): FishSizeClass {
  if (weightKg < 2.0) return 'Kecil';
  if (weightKg <= 5.0) return 'Sedang';
  return 'Besar';
}

// konversi jumlah ikan menjadi persentase
export function calculateFishPercentages(entries: PondFishEntry[]): FishPercentagesResult[] {
  const total = entries.reduce((acc, item) => acc + Math.max(0, item.count), 0);
  if (total === 0) {
    return entries.map((e) => ({
      ...e,
      percentage: 0,
    }));
  }
  return entries.map((e) => {
    const rawPct = (Math.max(0, e.count) / total) * 100;
    const rounded = Math.round(rawPct * 10) / 10;
    const rarityLabel: 'Umum' | 'Langka' | 'Legendaris' =
      rounded < 12 ? 'Legendaris' : rounded < 25 ? 'Langka' : 'Umum';
    return {
      speciesName: e.speciesName,
      count: e.count,
      percentage: rounded,
      rarityLabel,
    };
  });
}

// mengubah / parsing "HH:mm" menjadi waktu dalam satuan menit
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return -1;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || hours > 24 || minutes < 0 || minutes >= 60) {
    return -1;
  }
  return hours * 60 + minutes;
}

// memvalidasi apakah user dapat reservasi untuk tanggal dan waktu
export function validateReservationInput(params: {
  user: AppUser;
  membership: Membership | undefined;
  pond: Pond | undefined;
  date: string;
  startTime: string;
  endTime: string;
  existingUserReservations: Reservation[];
  excludeReservationId?: string;
}): { valid: boolean; error?: string; durationHours?: number } {
  const { user, membership, pond, date, startTime, endTime, existingUserReservations, excludeReservationId } = params;

  if (user.isBanned) {
    return { valid: false, error: 'Akun Anda sedang dibekukan karena pelanggaran aturan.' };
  }
  if (!membership) {
    return { valid: false, error: 'Membership pengguna tidak ditemukan.' };
  }
  if (!pond) {
    return { valid: false, error: 'Kolam tidak ditemukan.' };
  }
  if (!membership.accessiblePondIds.includes(pond.id)) {
    return { valid: false, error: `Membership ${membership.name} tidak memiliki akses ke ${pond.name}.` };
  }
  if (pond.status === 'Sedang Maintenance') {
    return { valid: false, error: `${pond.name} sedang dalam masa pemeliharaan (Maintenance) dan tidak dapat direservasi.` };
  }
  if (pond.currentVisitors >= pond.maxVisitors) {
    return { valid: false, error: `Kapasitas pengunjung ${pond.name} hari ini sudah penuh.` };
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Tanggal reservasi wajib diisi dengan format yang benar.' };
  }

  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  if (startMin < 0 || endMin < 0) {
    return { valid: false, error: 'Waktu mulai dan waktu selesai wajib diisi.' };
  }
  if (endMin <= startMin) {
    return { valid: false, error: 'Waktu berakhir memancing harus lebih besar dari waktu mulai.' };
  }

  const pondOpenMin = parseTimeToMinutes(pond.openTime);
  const pondCloseMin = parseTimeToMinutes(pond.closeTime);
  if (startMin < pondOpenMin || endMin > pondCloseMin) {
    return {
      valid: false,
      error: `Jam operasional ${pond.name} adalah ${pond.openTime} - ${pond.closeTime} WIB.`,
    };
  }

  const durationHours = (endMin - startMin) / 60;
  if (durationHours > membership.maxHoursPerSession) {
    return {
      valid: false,
      error: `Durasi sesi (${durationHours.toFixed(1)} jam) melebihi batas maksimal membership ${membership.name} (${membership.maxHoursPerSession} jam).`,
    };
  }

  // Check overlapping reservations on the same date for this user
  const conflict = existingUserReservations.find((res) => {
    if (excludeReservationId && res.id === excludeReservationId) return false;
    if (res.userId !== user.id || res.date !== date) return false;
    if (res.status === 'Sudah selesai' || res.status === 'Dibatalkan') return false;
    const existStart = parseTimeToMinutes(res.startTime);
    const existEnd = parseTimeToMinutes(res.endTime);
    return startMin < existEnd && endMin > existStart;
  });

  if (conflict) {
    return {
      valid: false,
      error: `Anda sudah memiliki jadwal reservasi di ${conflict.pondName} pada tanggal ${date} pukul ${conflict.startTime} - ${conflict.endTime}.`,
    };
  }

  return { valid: true, durationHours };
}

// untuk admin yang mau mendelete membership, jika membership sudah launch, tidak bisa didelete
export function canDeleteMembership(membership: Membership): boolean {
  return !membership.isLaunched;
}

// menambahkan bulan ke format YYYY-MM-DD
export function addMonthsToDate(baseDateStr: string, monthsToAdd: number): string {
  const parts = baseDateStr.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = (parts[1] || 10) - 1;
  const day = parts[2] || 23;
  const dt = new Date(Date.UTC(year, month + monthsToAdd, day));
  return dt.toISOString().slice(0, 10);
}