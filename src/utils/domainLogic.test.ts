import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyFishSize,
  calculateFishPercentages,
  validateReservationInput,
  canDeleteMembership,
  addMonthsToDate,
  type AppUser,
  type Membership,
  type Pond,
  type Reservation,
} from './domainLogic';

const mockBronze: Membership = {
  id: 'mem-bronze',
  name: 'Bronze',
  maxHoursPerSession: 3,
  accessiblePondIds: ['pond-1', 'pond-2'],
  priceMonthly: 150000,
  benefits: ['Akses 2 kolam'],
  badgeColor: '#B45309',
  tagline: 'Untuk pemancing rekreasi akhir pekan',
  isLaunched: true,
};

const mockDraftMembership: Membership = {
  ...mockBronze,
  id: 'mem-draft',
  name: 'Platinum',
  isLaunched: false,
};

const mockUser: AppUser = {
  id: 'u-1',
  name: 'User1',
  email: 'user1@gmail.com',
  password: 'User1',
  role: 'user',
  membershipId: 'mem-bronze',
  membershipExpiresAt: '2026-12-31',
  paymentMethod: 'QRIS',
  signedUpAt: '2026-01-15',
  isBanned: false,
};

const mockPondAvailable: Pond = {
  id: 'pond-1',
  name: 'Kolam Nusantara',
  location: ' Area Semanan Blok A',
  branch: 'Semanan Utama',
  openTime: '06:00',
  closeTime: '22:00',
  status: 'Available',
  currentVisitors: 20,
  maxVisitors: 60,
  previousDaysVisitors: [],
  fishPopulation: [
    { speciesName: 'Ikan Mas Kumpay', count: 60, rarityLabel: 'Umum' },
    { speciesName: 'Ikan Gurame Soang', count: 30, rarityLabel: 'Langka' },
    { speciesName: 'Ikan Tombro Agung', count: 10, rarityLabel: 'Legendaris' },
  ],
  description: 'Kolam utama keluarga.',
};

test('classifyFishSize categorizes weights into Kecil, Sedang, and Besar accurately', () => {
  assert.equal(classifyFishSize(1.2), 'Kecil');
  assert.equal(classifyFishSize(2.0), 'Sedang');
  assert.equal(classifyFishSize(4.8), 'Sedang');
  assert.equal(classifyFishSize(5.5), 'Besar');
});

test('calculateFishPercentages computes exact percentages and rarity tiers', () => {
  const results = calculateFishPercentages(mockPondAvailable.fishPopulation);
  assert.equal(results.length, 3);
  assert.equal(results[0].percentage, 60);
  assert.equal(results[0].rarityLabel, 'Umum');
  assert.equal(results[1].percentage, 30);
  assert.equal(results[2].percentage, 10);
  assert.equal(results[2].rarityLabel, 'Legendaris');
});

test('validateReservationInput blocks sessions exceeding membership max hours', () => {
  const res = validateReservationInput({
    user: mockUser,
    membership: mockBronze,
    pond: mockPondAvailable,
    date: '2026-10-25',
    startTime: '08:00',
    endTime: '12:00', // 4 hours > Bronze 3 hours max
    existingUserReservations: [],
  });
  assert.equal(res.valid, false);
  assert.match(res.error || '', /melebihi batas maksimal membership Bronze/);
});

test('validateReservationInput blocks overlapping reservations on the same date and time', () => {
  const existing: Reservation[] = [
    {
      id: 'res-1',
      userId: 'u-1',
      userName: 'User1',
      pondId: 'pond-1',
      pondName: 'Kolam Nusantara',
      date: '2026-10-25',
      startTime: '09:00',
      endTime: '11:00',
      status: 'Belum datang',
    },
  ];

  const conflictRes = validateReservationInput({
    user: mockUser,
    membership: mockBronze,
    pond: mockPondAvailable,
    date: '2026-10-25',
    startTime: '10:00',
    endTime: '12:00',
    existingUserReservations: existing,
  });
  assert.equal(conflictRes.valid, false);
  assert.match(conflictRes.error || '', /sudah memiliki jadwal reservasi/);

  const validRes = validateReservationInput({
    user: mockUser,
    membership: mockBronze,
    pond: mockPondAvailable,
    date: '2026-10-25',
    startTime: '11:00',
    endTime: '13:30',
    existingUserReservations: existing,
  });
  assert.equal(validRes.valid, true);
});

test('canDeleteMembership allows deleting unlaunched memberships and protects launched ones', () => {
  assert.equal(canDeleteMembership(mockDraftMembership), true);
  assert.equal(canDeleteMembership(mockBronze), false);
});

test('addMonthsToDate advances membership expiration date accurately', () => {
  assert.equal(addMonthsToDate('2026-10-23', 3), '2027-01-23');
});

import { generateInitialDatabase } from './seedData';

test('generateInitialDatabase seeds 100 users, 5 admins, 5 ponds, and 200 sales instances', () => {
  const db = generateInitialDatabase();
  const regularUsers = db.users.filter((u) => u.role === 'user');
  const adminUsers = db.users.filter((u) => u.role === 'admin');
  assert.equal(regularUsers.length, 100);
  assert.equal(adminUsers.length, 5);
  assert.equal(regularUsers[0].name, 'User1');
  assert.equal(regularUsers[0].password, 'User1');
  assert.equal(adminUsers[0].name, 'admin1');
  assert.equal(adminUsers[0].password, 'admin1');
  assert.equal(db.ponds.length, 5);
  assert.equal(db.sales.length, 200);
});
