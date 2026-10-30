-- =====================================================================
-- ⚠ FICTIONAL DEMONSTRATION DATA — NOT REAL PESHAWAR TRANSPORT ⚠
-- Same records as src/data/sampleData.ts. Every name ends in
-- "(demo)" / "(نمونہ)" and every row has is_fictional = true.
-- Run AFTER the schema migration. Safe to run twice (it skips existing rows).
-- Remove with:  supabase/remove_fictional.sql
-- =====================================================================

begin;

insert into public.stops (id, name_en, name_ur, aliases, is_fictional) values
  ('00000000-0000-4000-a000-000000000001', 'Sitara Chowk (demo)',        'ستارہ چوک (نمونہ)',        '{"Sitara Square"}', true),
  ('00000000-0000-4000-a000-000000000002', 'Anaar Bagh (demo)',          'انار باغ (نمونہ)',          '{}',                true),
  ('00000000-0000-4000-a000-000000000003', 'Lal Pul (demo)',             'لال پل (نمونہ)',             '{"Red Bridge"}',    true),
  ('00000000-0000-4000-a000-000000000004', 'Noor Market (demo)',         'نور مارکیٹ (نمونہ)',         '{}',                true),
  ('00000000-0000-4000-a000-000000000005', 'Sabz Mandi Terminal (demo)', 'سبزی منڈی ٹرمینل (نمونہ)',  '{"Sabz Adda"}',     true),
  ('00000000-0000-4000-a000-000000000006', 'Kehkashan Colony (demo)',    'کہکشاں کالونی (نمونہ)',     '{}',                true),
  ('00000000-0000-4000-a000-000000000007', 'Pahari Gate (demo)',         'پہاڑی گیٹ (نمونہ)',         '{}',                true),
  ('00000000-0000-4000-a000-000000000008', 'Gulshan Morr (demo)',        'گلشن موڑ (نمونہ)',          '{}',                true),
  ('00000000-0000-4000-a000-000000000009', 'Chashma Road (demo)',        'چشمہ روڈ (نمونہ)',          '{}',                true),
  ('00000000-0000-4000-a000-000000000010', 'Overpass Stop (demo)',       'اوورپاس اسٹاپ (نمونہ)',     '{}',                true)
on conflict (id) do nothing;

insert into public.routes
  (id, code, name_en, name_ur, vehicle_type, direction_en, direction_ur,
   verification_status, last_verified_at, source_notes, is_published, is_fictional)
values
  ('00000000-0000-4000-b000-000000000001', 'R1', 'Sitara – Sabz Mandi Van (demo)', 'ستارہ – سبزی منڈی وین (نمونہ)', 'suzuki_van',
   'Towards Sabz Mandi Terminal', 'سبزی منڈی ٹرمینل کی طرف', 'verified', '2026-10-01', 'Fictional sample record for testing.', true, true),
  ('00000000-0000-4000-b000-000000000002', 'R2', 'Sabz Mandi – Sitara Van (demo)', 'سبزی منڈی – ستارہ وین (نمونہ)', 'suzuki_van',
   'Towards Sitara Chowk', 'ستارہ چوک کی طرف', 'verified', '2026-10-01', 'Fictional sample record for testing.', true, true),
  ('00000000-0000-4000-b000-000000000003', 'R3', 'Sitara – Pahari Gate Wagon (demo)', 'ستارہ – پہاڑی گیٹ ویگن (نمونہ)', 'wagon',
   'Towards Pahari Gate', 'پہاڑی گیٹ کی طرف', 'unverified', null, 'Fictional sample record: simulates an unconfirmed user submission.', true, true),
  ('00000000-0000-4000-b000-000000000004', 'R4', 'Sabz Mandi Loop Minibus (demo)', 'سبزی منڈی لوپ منی بس (نمونہ)', 'minibus',
   'Loop via Chashma Road', 'چشمہ روڈ سے ہوتے ہوئے چکر', 'verified', '2026-09-15', 'Fictional sample record: loop route that passes Lal Pul twice.', true, true),
  ('00000000-0000-4000-b000-000000000005', 'R5', 'Noor Market Chingchi (demo)', 'نور مارکیٹ چنگچی (نمونہ)', 'chingchi',
   'Towards Gulshan Morr', 'گلشن موڑ کی طرف', 'verified', '2026-10-10', 'Fictional sample record: overpass stop is drop-off only.', true, true),
  -- R6: a DRAFT (unpublished) route. The public must never see it.
  ('00000000-0000-4000-b000-000000000006', 'R6', 'Draft Route (demo)', 'مسودہ راستہ (نمونہ)', 'wagon',
   'Towards Pahari Gate', 'پہاڑی گیٹ کی طرف', 'unverified', null, 'Fictional draft for testing publish rules.', false, true)
on conflict (id) do nothing;

insert into public.route_stops (route_id, stop_id, stop_sequence, boarding_allowed, alighting_allowed)
select v.route_id::uuid, v.stop_id::uuid, v.seq, v.board, v.alight
from (values
  -- R1
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 1, true, true),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000002', 2, true, true),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000003', 3, true, true),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000004', 4, true, true),
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000005', 5, true, true),
  -- R2 (reverse of R1)
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000005', 1, true, true),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000004', 2, true, true),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000003', 3, true, true),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', 4, true, true),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 5, true, true),
  -- R3
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000001', 1, true, true),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000006', 2, true, true),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000004', 3, true, true),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000007', 4, true, true),
  -- R4 (loop: Lal Pul appears twice)
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000005', 1, true, true),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000003', 2, true, true),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000008', 3, true, true),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000009', 4, true, true),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000003', 5, true, true),
  -- R5 (Noor Market: board only; Overpass: drop-off only)
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000004', 1, true,  false),
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000010', 2, false, true),
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000008', 3, true,  true),
  -- R6 (draft)
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000004', 1, true, true),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000007', 2, true, true)
) as v (route_id, stop_id, seq, board, alight)
-- skip rows that already exist (makes the seed safe to run twice)
where not exists (
  select 1 from public.route_stops rs
  where rs.route_id = v.route_id::uuid and rs.stop_sequence = v.seq
);

insert into public.route_fares (route_id, from_stop_id, to_stop_id, amount_pkr, is_verified, verified_at, source_notes) values
  ('00000000-0000-4000-b000-000000000001', null, null, 50, true, '2026-10-01', 'Fictional.'),
  -- R2: no fare on purpose
  ('00000000-0000-4000-b000-000000000003', null, null, 60, false, null, 'Fictional unverified fare: must stay hidden from the public.'),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000009', 40, true, '2026-09-15', 'Fictional segment fare.'),
  ('00000000-0000-4000-b000-000000000005', null, null, 30, true, '2026-10-10', 'Fictional.')
on conflict do nothing;

commit;
