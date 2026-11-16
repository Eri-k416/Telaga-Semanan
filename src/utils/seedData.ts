import {
  classifyFishSize,
  type AppUser,
  type FishSale,
  type Membership,
  type Pond,
  type PriceTimeframe,
  type Reservation,
  type ReservationStatus,
  type SaleStatus,
} from './domainLogic';

export interface StockPricePoint {
  label: string;
  price: number;
  volume: number;
}

export interface DatabaseState {
  users: AppUser[];
  memberships: Membership[];
  ponds: Pond[];
  reservations: Reservation[];
  sales: FishSale[];
}

export const FISH_SPECIES_LIST = [
  'Ikan Mas Kumpay',
  'Ikan Gurame Soang',
  'Ikan Patin Siam',
  'Ikan Bawal Bintang',
  'Ikan Nila Merah',
  'Ikan Tombro Agung',
  'Ikan Lele Sangkuriang',
  'Ikan Gabus Toman',
] as const;

const BASE_PRICES: Record<string, number> = {
  'Ikan Mas Kumpay': 65000,
  'Ikan Gurame Soang': 85000,
  'Ikan Patin Siam': 48000,
  'Ikan Bawal Bintang': 72000,
  'Ikan Nila Merah': 45000,
  'Ikan Tombro Agung': 110000,
  'Ikan Lele Sangkuriang': 38000,
  'Ikan Gabus Toman': 95000,
};

// membuat harga deteministik seperti harga pasar stock dengan timeframe tanggal, bulan, dan tahun
export function getFishStockChartData(fishName: string, timeframe: PriceTimeframe): StockPricePoint[] {
  const base = BASE_PRICES[fishName] || 60000;
  const seed = fishName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  if (timeframe === 'Tanggal') {
    const days = [
      '14 Okt', '15 Okt', '16 Okt', '17 Okt', '18 Okt',
      '19 Okt', '20 Okt', '21 Okt', '22 Okt', '23 Okt',
    ];
    return days.map((label, idx) => {
      const wave = Math.sin((idx + seed) * 0.85) * 0.12 + (idx * 0.015);
      const price = Math.round((base * (1 + wave)) / 500) * 500;
      const volume = 12 + ((seed + idx * 7) % 28);
      return { label, price, volume };
    });
  }

  if (timeframe === 'Bulan') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
    return months.map((label, idx) => {
      const wave = Math.cos((idx + seed) * 0.7) * 0.16 + (idx * 0.02);
      const price = Math.round((base * (1 + wave)) / 500) * 500;
      const volume = 85 + ((seed * 3 + idx * 19) % 140);
      return { label, price, volume };
    });
  }

  const years = ['2021', '2022', '2023', '2024', '2025', '2026'];
  return years.map((label, idx) => {
    const trend = idx * 0.08 + Math.sin(seed + idx) * 0.05;
    const price = Math.round((base * (0.72 + trend)) / 500) * 500;
    const volume = 620 + ((seed * 11 + idx * 130) % 500);
    return { label, price, volume };
  });
}

/**
 * database seeder mockup
 * - 5 Admins (admin1..admin5, password same as name)
 * - 100 Users (User1..User100, password same as name)
 * - 3 Launched Memberships (Bronze, Silver, Gold) + 1 Draft Membership (Platinum Exclusive)
 * - 5 Ponds with varied creative fish distributions and visitor stats
 * - Reservations across users (Sudah selesai, Sedang berkunjung, Belum datang)
 * - 200 E-Fishery Sales instances matching pond fish species
 */
export function generateInitialDatabase(): DatabaseState {
  const memberships: Membership[] = [
    {
      id: 'mem-bronze',
      name: 'Bronze',
      maxHoursPerSession: 3,
      accessiblePondIds: ['pond-1', 'pond-2'],
      priceMonthly: 150000,
      benefits: [
        'Maksimal sesi memancing 3 jam per kunjungan',
        'Akses 2 kolam reguler (Kolam Nusantara & Telaga Semanan Timur)',
        'Umpan pelet racikan dasar gratis 250gr/kunjungan',
        'Akses jual-beli pasar ikan segar E-Fishery',
      ],
      badgeColor: '#B45309',
      tagline: 'Pilihan ideal pemancing rekreasi mingguan',
      isLaunched: true,
    },
    {
      id: 'mem-silver',
      name: 'Silver',
      maxHoursPerSession: 5,
      accessiblePondIds: ['pond-1', 'pond-2', 'pond-3', 'pond-4'],
      priceMonthly: 295000,
      benefits: [
        'Maksimal sesi memancing 5 jam per kunjungan',
        'Akses 4 kolam termasuk Kolam Galatama Prestasi & Lembah Patin',
        'Saung gazebo teduh tepi kolam tanpa biaya tambahan',
        'Potongan biaya layanan 15% di pasar E-Fishery',
      ],
      badgeColor: '#0D9488',
      tagline: 'Untuk pemancing aktif & penggemar tarikan Galatama',
      isLaunched: true,
    },
    {
      id: 'mem-gold',
      name: 'Gold',
      maxHoursPerSession: 8,
      accessiblePondIds: ['pond-1', 'pond-2', 'pond-3', 'pond-4', 'pond-5'],
      priceMonthly: 490000,
      benefits: [
        'Maksimal sesi memancing 8 jam penuh per kunjungan',
        'Akses seluruh 5 kolam termasuk Danau Kencana VIP Sanctuary',
        'Prioritas saung VIP privat & layanan pembersihan/fillet ikan gratis',
        'Bebas biaya komisi penjualan & prioritas listing E-Fishery',
      ],
      badgeColor: '#D97706',
      tagline: 'Akses paripurna seluruh danau & fasilitas VIP',
      isLaunched: true,
    },
    {
      id: 'mem-platinum-draft',
      name: 'Platinum Tournament',
      maxHoursPerSession: 12,
      accessiblePondIds: ['pond-1', 'pond-2', 'pond-3', 'pond-4', 'pond-5'],
      priceMonthly: 750000,
      benefits: [
        'Maksimal sesi memancing 12 jam penuh (Siang & Malam)',
        'Akses seluruh 5 kolam + slot khusus turnamen bulanan',
        'Loker peralatan pancing pribadi di Clubhouse Telaga Semanan',
      ],
      badgeColor: '#0284C7',
      tagline: 'Paket turnamen yang sedang disiapkan untuk peluncuran',
      isLaunched: false,
    },
  ];

  const ponds: Pond[] = [
    {
      id: 'pond-1',
      name: 'Kolam Nusantara',
      location: 'Kawasan Telaga Semanan Blok A1, Kalideres, Jakarta Barat',
      branch: 'Cabang Semanan Utama',
      openTime: '06:00',
      closeTime: '22:00',
      status: 'Available',
      currentVisitors: 38,
      maxVisitors: 60,
      previousDaysVisitors: [
        { date: '18 Okt', visitors: 42 },
        { date: '19 Okt', visitors: 51 },
        { date: '20 Okt', visitors: 35 },
        { date: '21 Okt', visitors: 44 },
        { date: '22 Okt', visitors: 49 },
      ],
      fishPopulation: [
        { speciesName: 'Ikan Mas Kumpay', count: 420, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Nila Merah', count: 310, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Gurame Soang', count: 180, rarityLabel: 'Langka' },
        { speciesName: 'Ikan Tombro Agung', count: 90, rarityLabel: 'Legendaris' },
      ],
      description: 'Kolam keluarga berair jernih dengan deretan saung kayu jati dan populasi Ikan Mas serta Nila yang melimpah.',
    },
    {
      id: 'pond-2',
      name: 'Telaga Semanan Timur',
      location: 'Jl. Raya Semanan Pintu Timur No. 14, Jakarta Barat',
      branch: 'Cabang Semanan Timur',
      openTime: '06:00',
      closeTime: '21:00',
      status: 'Available',
      currentVisitors: 29,
      maxVisitors: 50,
      previousDaysVisitors: [
        { date: '18 Okt', visitors: 31 },
        { date: '19 Okt', visitors: 45 },
        { date: '20 Okt', visitors: 28 },
        { date: '21 Okt', visitors: 33 },
        { date: '22 Okt', visitors: 39 },
      ],
      fishPopulation: [
        { speciesName: 'Ikan Lele Sangkuriang', count: 380, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Patin Siam', count: 290, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Bawal Bintang', count: 210, rarityLabel: 'Langka' },
        { speciesName: 'Ikan Gurame Soang', count: 120, rarityLabel: 'Legendaris' },
      ],
      description: 'Kolam harian teduh dengan sirkulasi air alami yang menjadi favorit pemburu Patin, Bawal, dan Lele Sangkuriang.',
    },
    {
      id: 'pond-3',
      name: 'Kolam Galatama Prestasi',
      location: 'Kawasan Telaga Semanan Blok C (Arena Kompetisi), Jakarta Barat',
      branch: 'Cabang Semanan Arena',
      openTime: '08:00',
      closeTime: '23:00',
      status: 'Available',
      currentVisitors: 34,
      maxVisitors: 40,
      previousDaysVisitors: [
        { date: '18 Okt', visitors: 38 },
        { date: '19 Okt', visitors: 40 },
        { date: '20 Okt', visitors: 32 },
        { date: '21 Okt', visitors: 36 },
        { date: '22 Okt', visitors: 39 },
      ],
      fishPopulation: [
        { speciesName: 'Ikan Mas Kumpay', count: 310, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Tombro Agung', count: 240, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Bawal Bintang', count: 150, rarityLabel: 'Langka' },
        { speciesName: 'Ikan Gabus Toman', count: 80, rarityLabel: 'Legendaris' },
      ],
      description: 'Kolam kedalaman 2.5 meter khusus tarikan berat dan kompetisi Galatama dengan dek pancing bernomor.',
    },
    {
      id: 'pond-4',
      name: 'Lembah Patin & Bawal',
      location: 'Jl. Semanan Kalideres Sektor Selatan Blok D2, Jakarta Barat',
      branch: 'Cabang Semanan Selatan',
      openTime: '07:00',
      closeTime: '21:00',
      status: 'Sedang Maintenance',
      currentVisitors: 0,
      maxVisitors: 45,
      previousDaysVisitors: [
        { date: '18 Okt', visitors: 41 },
        { date: '19 Okt', visitors: 43 },
        { date: '20 Okt', visitors: 30 },
        { date: '21 Okt', visitors: 18 },
        { date: '22 Okt', visitors: 0 },
      ],
      fishPopulation: [
        { speciesName: 'Ikan Patin Siam', count: 450, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Bawal Bintang', count: 350, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Gabus Toman', count: 110, rarityLabel: 'Langka' },
      ],
      description: 'Kolam khusus ikan predator air tawar dan tarikan agresif (Saat ini sedang pengurasan filter biologis & restocking).',
    },
    {
      id: 'pond-5',
      name: 'Danau Kencana VIP',
      location: 'Kawasan Sanctuary Telaga Semanan Blok VIP, Jakarta Barat',
      branch: 'Cabang Semanan Sanctuary',
      openTime: '06:00',
      closeTime: '24:00',
      status: 'Available',
      currentVisitors: 19,
      maxVisitors: 25,
      previousDaysVisitors: [
        { date: '18 Okt', visitors: 22 },
        { date: '19 Okt', visitors: 25 },
        { date: '20 Okt', visitors: 18 },
        { date: '21 Okt', visitors: 21 },
        { date: '22 Okt', visitors: 24 },
      ],
      fishPopulation: [
        { speciesName: 'Ikan Tombro Agung', count: 220, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Gurame Soang', count: 190, rarityLabel: 'Umum' },
        { speciesName: 'Ikan Gabus Toman', count: 115, rarityLabel: 'Langka' },
        { speciesName: 'Ikan Mas Kumpay', count: 75, rarityLabel: 'Legendaris' },
      ],
      description: 'Laguna eksklusif khusus pemegang membership Gold dengan kabana bambu privat dan indukan ikan kualitas terbaik.',
    },
  ];

  const users: AppUser[] = [];

  // Seed 5 Admins: admin1 .. admin5
  for (let i = 1; i <= 5; i++) {
    users.push({
      id: `admin-${i}`,
      name: `admin${i}`,
      email: `admin${i}@gmail.com`,
      password: `admin${i}`,
      role: 'admin',
      membershipId: 'mem-gold',
      membershipExpiresAt: '2027-12-31',
      paymentMethod: 'Debit',
      signedUpAt: `2026-01-0${i}`,
      isBanned: false,
    });
  }

  // Seed 100 Users: User1 .. User100
  const launchedIds = ['mem-bronze', 'mem-silver', 'mem-gold'];
  for (let i = 1; i <= 100; i++) {
    // Give User1 Silver membership so User1 can see both accessible ponds, a locked Gold pond (Danau Kencana VIP), and a Maintenance pond (Lembah Patin & Bawal)!
    const membershipId =
      i === 1
        ? 'mem-silver'
        : i === 2
        ? 'mem-gold'
        : i === 3
        ? 'mem-bronze'
        : launchedIds[i % 3];

    const month = String(((i - 1) % 9) + 1).padStart(2, '0');
    const day = String(((i * 3) % 27) + 1).padStart(2, '0');
    const expMonth = String(((i % 6) + 11) > 12 ? (i % 6) - 1 : (i % 6) + 11).padStart(2, '0');
    const expYear = expMonth < '11' ? '2027' : '2026';

    users.push({
      id: `user-${i}`,
      name: `User${i}`,
      email: `user${i}@gmail.com`,
      password: `User${i}`,
      role: 'user',
      membershipId,
      membershipExpiresAt: `${expYear}-${expMonth}-${day}`,
      paymentMethod: i % 2 === 0 ? 'Debit' : 'QRIS',
      signedUpAt: `2026-${month}-${day}`,
      isBanned: i === 99, // User99 seeded as banned example for Admin review
      banReason: i === 99 ? 'Melanggar aturan pengunjungan kolam Galatama' : undefined,
    });
  }

  // Seed Reservations across Users 1..100
  const reservations: Reservation[] = [
    // Explicit rich history for User1 (completed & upcoming)
    {
      id: 'res-u1-past-1',
      userId: 'user-1',
      userName: 'User1',
      pondId: 'pond-1',
      pondName: 'Kolam Nusantara',
      date: '2026-10-12',
      startTime: '07:00',
      endTime: '11:00',
      status: 'Sudah selesai',
    },
    {
      id: 'res-u1-past-2',
      userId: 'user-1',
      userName: 'User1',
      pondId: 'pond-3',
      pondName: 'Kolam Galatama Prestasi',
      date: '2026-10-18',
      startTime: '14:00',
      endTime: '18:00',
      status: 'Sudah selesai',
    },
    {
      id: 'res-u1-upcoming-1',
      userId: 'user-1',
      userName: 'User1',
      pondId: 'pond-2',
      pondName: 'Telaga Semanan Timur',
      date: '2026-10-25',
      startTime: '08:00',
      endTime: '12:00',
      status: 'Belum datang',
    },
  ];

  const statuses: ReservationStatus[] = ['Sudah selesai', 'Sedang berkunjung', 'Belum datang'];
  const availablePonds = [ponds[0], ponds[1], ponds[2], ponds[4]];

  for (let i = 1; i <= 100; i++) {
    const u = users[4 + i]; // user-1 is at index 5
    const status = statuses[i % 3];
    const pond =
      u.membershipId === 'mem-bronze'
        ? ponds[i % 2]
        : u.membershipId === 'mem-silver'
        ? ponds[i % 3]
        : availablePonds[i % 4];

    const date =
      status === 'Sudah selesai'
        ? `2026-10-${String((i % 18) + 1).padStart(2, '0')}`
        : status === 'Sedang berkunjung'
        ? '2026-10-23'
        : `2026-10-${String(24 + (i % 6)).padStart(2, '0')}`;

    const startHour = 7 + (i % 8);
    const maxDur = u.membershipId === 'mem-bronze' ? 2 : u.membershipId === 'mem-silver' ? 3 : 4;
    const endHour = startHour + maxDur;

    reservations.push({
      id: `res-seed-${i}`,
      userId: u.id,
      userName: u.name,
      pondId: pond.id,
      pondName: pond.name,
      date,
      startTime: `${String(startHour).padStart(2, '0')}:00`,
      endTime: `${String(endHour).padStart(2, '0')}:00`,
      status,
    });
  }

  // Seed 200 E-Fishery Sales instances matching fish in the ponds
  const sales: FishSale[] = [];
  const saleStatuses: SaleStatus[] = ['Open', 'On progress', 'Sudah dibeli'];

  for (let i = 1; i <= 200; i++) {
    const pond = ponds[(i - 1) % ponds.length];
    const fishEntry = pond.fishPopulation[(i - 1) % pond.fishPopulation.length];
    const fishName = fishEntry.speciesName;

    // Make sure User1 has several sales and several purchases so User1's Penjualan & Pembelian tabs are rich immediately
    let sellerIndex = ((i * 7) % 100) + 1;
    if (i <= 6) {
      sellerIndex = 1; // User1 sells items 1..6
    } else if (sellerIndex === 1 && i <= 15) {
      sellerIndex = 2;
    }

    const sellerName = `User${sellerIndex}`;
    const sellerId = `user-${sellerIndex}`;

    const status: SaleStatus =
      i <= 3
        ? 'Open'
        : i === 4
        ? 'On progress'
        : i === 5
        ? 'Sudah dibeli'
        : saleStatuses[i % 3];

    let buyerId: string | null = null;
    let buyerName: string | null = null;

    if (status !== 'Open') {
      if (i >= 7 && i <= 11) {
        // User1 bought items 7..11
        buyerId = 'user-1';
        buyerName = 'User1';
      } else {
        const buyerIdx = ((sellerIndex + 13) % 100) + 1;
        buyerId = `user-${buyerIdx}`;
        buyerName = `User${buyerIdx}`;
      }
    }

    // Generate varied weight from 0.9 kg to 8.4 kg
    const weightKg = Math.round((0.9 + ((i * 1.37) % 7.5)) * 10) / 10;
    const sizeClass = classifyFishSize(weightKg);
    const basePerKg = BASE_PRICES[fishName] || 60000;
    const priceIdr = Math.round((weightKg * basePerKg) / 1000) * 1000;

    const createdDay = String(((i * 3) % 22) + 1).padStart(2, '0');
    const activeDay = String(((i * 5) % 27) + 1).padStart(2, '0');

    // Keep ~15 Open listings unverified so Admin has a real queue to verify/ACC in Manage Penjualan!
    const isVerified = status !== 'Open' ? true : i % 11 !== 0;

    sales.push({
      id: `sale-${i}`,
      saleCode: `EF-2026-${String(i).padStart(4, '0')}`,
      fishName,
      weightKg,
      sizeClass,
      priceIdr,
      status,
      createdAt: `2026-10-${createdDay}`,
      activeUntil: `2026-11-${activeDay}`,
      pondId: pond.id,
      pondName: pond.name,
      sellerId,
      sellerName,
      buyerId,
      buyerName,
      isVerified,
    });
  }

  return {
    users,
    memberships,
    ponds,
    reservations,
    sales,
  };
}
