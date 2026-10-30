import type { TransportData } from '../types/transport'

/*
  ⚠ FICTIONAL DEMONSTRATION DATA ⚠

  Every stop name, route, fare and date below is INVENTED for testing.
  Names carry "(demo)" / "(نمونہ)" so nobody mistakes them for real
  Peshawar places. Do not edit these into real-looking data — real,
  verified routes will come from the database in Phase 4.

  The set is designed to exercise the search rules:
  - R1 / R2: same corridor in opposite directions (order matters)
  - R1: verified flat fare;  R2: verified route, no fare
  - R3: unverified route with an unverified fare
  - R4: loop route where one stop appears twice
  - R5: stops where boarding or alighting is not allowed
*/

export const sampleData: TransportData = {
  stops: [
    { id: 'stop-sitara', nameEn: 'Sitara Chowk (demo)', nameUr: 'ستارہ چوک (نمونہ)', aliases: ['Sitara Square'] },
    { id: 'stop-anaar', nameEn: 'Anaar Bagh (demo)', nameUr: 'انار باغ (نمونہ)', aliases: [] },
    { id: 'stop-lalpul', nameEn: 'Lal Pul (demo)', nameUr: 'لال پل (نمونہ)', aliases: ['Red Bridge'] },
    { id: 'stop-noor', nameEn: 'Noor Market (demo)', nameUr: 'نور مارکیٹ (نمونہ)', aliases: [] },
    { id: 'stop-sabz', nameEn: 'Sabz Mandi Terminal (demo)', nameUr: 'سبزی منڈی ٹرمینل (نمونہ)', aliases: ['Sabz Adda'] },
    { id: 'stop-kehkashan', nameEn: 'Kehkashan Colony (demo)', nameUr: 'کہکشاں کالونی (نمونہ)', aliases: [] },
    { id: 'stop-pahari', nameEn: 'Pahari Gate (demo)', nameUr: 'پہاڑی گیٹ (نمونہ)', aliases: [] },
    { id: 'stop-gulshan', nameEn: 'Gulshan Morr (demo)', nameUr: 'گلشن موڑ (نمونہ)', aliases: [] },
    { id: 'stop-chashma', nameEn: 'Chashma Road (demo)', nameUr: 'چشمہ روڈ (نمونہ)', aliases: [] },
    { id: 'stop-overpass', nameEn: 'Overpass Stop (demo)', nameUr: 'اوورپاس اسٹاپ (نمونہ)', aliases: [] },
  ],

  routes: [
    {
      id: 'route-r1',
      code: 'R1',
      nameEn: 'Sitara – Sabz Mandi Van (demo)',
      nameUr: 'ستارہ – سبزی منڈی وین (نمونہ)',
      vehicleType: 'suzuki_van',
      directionEn: 'Towards Sabz Mandi Terminal',
      directionUr: 'سبزی منڈی ٹرمینل کی طرف',
      verificationStatus: 'verified',
      lastVerifiedAt: '2026-10-01',
      sourceNotes: 'Fictional sample record for testing.',
      isFictional: true,
      stops: [
        { stopId: 'stop-sitara', sequence: 1, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-anaar', sequence: 2, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-lalpul', sequence: 3, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-noor', sequence: 4, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-sabz', sequence: 5, boardingAllowed: true, alightingAllowed: true },
      ],
    },
    {
      id: 'route-r2',
      code: 'R2',
      nameEn: 'Sabz Mandi – Sitara Van (demo)',
      nameUr: 'سبزی منڈی – ستارہ وین (نمونہ)',
      vehicleType: 'suzuki_van',
      directionEn: 'Towards Sitara Chowk',
      directionUr: 'ستارہ چوک کی طرف',
      verificationStatus: 'verified',
      lastVerifiedAt: '2026-10-01',
      sourceNotes: 'Fictional sample record for testing.',
      isFictional: true,
      stops: [
        { stopId: 'stop-sabz', sequence: 1, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-noor', sequence: 2, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-lalpul', sequence: 3, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-anaar', sequence: 4, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-sitara', sequence: 5, boardingAllowed: true, alightingAllowed: true },
      ],
    },
    {
      id: 'route-r3',
      code: 'R3',
      nameEn: 'Sitara – Pahari Gate Wagon (demo)',
      nameUr: 'ستارہ – پہاڑی گیٹ ویگن (نمونہ)',
      vehicleType: 'wagon',
      directionEn: 'Towards Pahari Gate',
      directionUr: 'پہاڑی گیٹ کی طرف',
      verificationStatus: 'unverified',
      lastVerifiedAt: null,
      sourceNotes: 'Fictional sample record: simulates an unconfirmed user submission.',
      isFictional: true,
      stops: [
        { stopId: 'stop-sitara', sequence: 1, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-kehkashan', sequence: 2, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-noor', sequence: 3, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-pahari', sequence: 4, boardingAllowed: true, alightingAllowed: true },
      ],
    },
    {
      id: 'route-r4',
      code: 'R4',
      nameEn: 'Sabz Mandi Loop Minibus (demo)',
      nameUr: 'سبزی منڈی لوپ منی بس (نمونہ)',
      vehicleType: 'minibus',
      directionEn: 'Loop via Chashma Road',
      directionUr: 'چشمہ روڈ سے ہوتے ہوئے چکر',
      verificationStatus: 'verified',
      lastVerifiedAt: '2026-09-15',
      sourceNotes: 'Fictional sample record: loop route that passes Lal Pul twice.',
      isFictional: true,
      stops: [
        { stopId: 'stop-sabz', sequence: 1, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-lalpul', sequence: 2, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-gulshan', sequence: 3, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-chashma', sequence: 4, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'stop-lalpul', sequence: 5, boardingAllowed: true, alightingAllowed: true },
      ],
    },
    {
      id: 'route-r5',
      code: 'R5',
      nameEn: 'Noor Market Chingchi (demo)',
      nameUr: 'نور مارکیٹ چنگچی (نمونہ)',
      vehicleType: 'chingchi',
      directionEn: 'Towards Gulshan Morr',
      directionUr: 'گلشن موڑ کی طرف',
      verificationStatus: 'verified',
      lastVerifiedAt: '2026-10-10',
      sourceNotes: 'Fictional sample record: overpass stop is drop-off only.',
      isFictional: true,
      stops: [
        { stopId: 'stop-noor', sequence: 1, boardingAllowed: true, alightingAllowed: false },
        { stopId: 'stop-overpass', sequence: 2, boardingAllowed: false, alightingAllowed: true },
        { stopId: 'stop-gulshan', sequence: 3, boardingAllowed: true, alightingAllowed: true },
      ],
    },
  ],

  fares: [
    // R1: verified flat fare for any trip on the route.
    { routeId: 'route-r1', fromStopId: null, toStopId: null, amountPkr: 50, isVerified: true, verifiedAt: '2026-10-01' },
    // R2: intentionally no fare -> "Fare not verified".
    // R3: a fare exists but is NOT verified -> must still show "Fare not verified".
    { routeId: 'route-r3', fromStopId: null, toStopId: null, amountPkr: 60, isVerified: false, verifiedAt: null },
    // R4: fare known only for one specific segment.
    { routeId: 'route-r4', fromStopId: 'stop-sabz', toStopId: 'stop-chashma', amountPkr: 40, isVerified: true, verifiedAt: '2026-09-15' },
    // R5: verified flat fare.
    { routeId: 'route-r5', fromStopId: null, toStopId: null, amountPkr: 30, isVerified: true, verifiedAt: '2026-10-10' },
  ],
}
