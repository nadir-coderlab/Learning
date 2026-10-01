-- Madinah Smart Rehabilitation — proposed PostgreSQL schema for the real platform (draft v0.1)
-- Mirrors the prototype's data model (madinah-smart-rehab/prototype/lib/seed.js + store.js).
-- Design rules:
--   * Pathway-agnostic: ACL is data (pathway, phases, gates, exercises), so TKA / shoulder / low back
--     pathways are new rows, not new code.
--   * Every clinical value carries when, who and source (patient / clinician / camera / phone).
--   * Nothing is ever deleted silently: changes go through audit_log; clinical decisions are rows.
--   * Names follow HL7 FHIR concepts in comments so a future integration (NPHIES, Raqeem) maps cleanly.
--   * Host inside the Kingdom; enable row-level security (RLS) so a patient reads only their rows,
--     a physiotherapist only their caseload, management only aggregates (views at the end).

create extension if not exists pgcrypto;

-- ---------- organisation & people ----------
create table facility (                       -- FHIR Organization / Location
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  created_at timestamptz not null default now()
);

create type app_role as enum ('patient', 'physiotherapist', 'senior_pt', 'surgeon', 'admin', 'management');

create table app_user (                       -- FHIR Practitioner / RelatedPerson / Patient login
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facility(id),
  role app_role not null,
  full_name text not null,
  mobile text unique,                          -- login by mobile + OTP; no national ID stored
  scfhs_license text,                          -- clinicians only
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table patient (                        -- FHIR Patient (minimum necessary data)
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references app_user(id),
  facility_id uuid not null references facility(id),
  mrn text not null,                           -- reference to the official record (Raqeem); text only, no link
  sex text check (sex in ('M', 'F')),
  birth_year int,
  primary_pt_id uuid references app_user(id),
  surgeon_id uuid references app_user(id),
  companion_user_id uuid references app_user(id), -- family "rehab companion", with consent
  consent_at timestamptz,                      -- PDPL: explicit consent for sensitive data + telehealth
  consent_version text,
  created_at timestamptz not null default now(),
  unique (facility_id, mrn)
);

-- ---------- pathway catalogue (CMS) ----------
create table pathway (                        -- FHIR PlanDefinition
  id text primary key,                         -- 'acl', later 'tka', 'shoulder', 'lbp'
  name_ar text not null,
  name_en text not null,
  version int not null default 1,
  approved_by uuid references app_user(id),
  approved_at timestamptz
);

create table phase (
  pathway_id text references pathway(id),
  phase_no int,
  name_ar text not null,
  name_en text not null,
  goal_ar text,
  typical_timing_ar text,
  primary key (pathway_id, phase_no)
);

create table gate_criterion (                 -- entry criteria; key 'rts' for return to sport
  id text primary key,
  pathway_id text not null references pathway(id),
  gate_key text not null,                      -- '2'..'6' or 'rts'
  text_ar text not null,
  metric text not null,                        -- extDeficit, flex, flexPctOther, quadLSI, hopLSI, aclRsi ...
  op text not null check (op in ('<=', '>=', '==')),
  target numeric,
  target_bool boolean,
  source_citation text,                        -- e.g. 'Aspetar 2023'
  is_team_consensus boolean not null default false,
  sort_order int not null default 0
);

create table exercise (                       -- FHIR ActivityDefinition
  id text primary key,
  name_ar text not null,
  name_en text not null,
  category text not null,
  phases int[] not null,
  default_sets int, default_reps int, default_hold_sec int,
  default_frequency_ar text,
  cues_ar text[],
  precautions_ar text,
  video_url text,                              -- in-Kingdom object storage
  progression_id text references exercise(id),
  regression_id text references exercise(id),
  camera_check text,                           -- flex | ext | slr | squat | valgus
  loadable boolean not null default false,
  active boolean not null default true
);

create table education_item (
  id text primary key,
  title_ar text not null,
  category_ar text,
  phases int[] not null,
  minutes int,
  body_ar text[] not null,
  video_url text,
  pinned boolean not null default false
);

create table questionnaire (                  -- FHIR Questionnaire (IKDC, ACL-RSI short Arabic, SANE, TSK-11)
  id text primary key,
  name_ar text not null,
  name_en text not null,
  item_count int,
  score_range text,
  licence_note text,                           -- IKDC: AOSSM licence for health systems
  loinc_code text                              -- KOOS has 72091-2; IKDC none
);

create table alert_rule (
  id text primary key,
  level text not null check (level in ('red', 'yellow')),
  name_ar text not null,
  rationale_ar text,
  params jsonb not null default '{}',          -- thresholds, e.g. {"days": 7, "pct": 50}
  enabled boolean not null default true,
  approved_by uuid references app_user(id),
  approved_at timestamptz
);

-- ---------- episode of care ----------
create table episode (                        -- FHIR EpisodeOfCare
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patient(id),
  pathway_id text not null references pathway(id),
  side text not null check (side in ('R', 'L')),
  injury_date date,
  surgery_date date not null,
  graft text check (graft in ('BPTB', 'HS', 'QT', 'ALLO')),
  meniscus_repair boolean not null default false,
  meniscectomy boolean not null default false,
  additional_procedures text,                  -- LET, MCL, cartilage ...
  surgeon_instructions text,
  weight_bearing text, brace text, rom_restriction text,
  comorbidities text,
  tegner_pre int,
  sport text, sport_level text check (sport_level in ('Recreational', 'Competitive', 'Professional')),
  goal_ar text,
  current_phase int not null default 1,
  plyo_level int not null default 0,
  run_level int not null default 0,
  rts_stage int not null default 0,            -- 1 participation, 2 sport, 3 performance
  contralateral_flex_deg numeric,
  status text not null default 'active' check (status in ('active', 'discharged', 'dropped_out')),
  discharged_at timestamptz
);

create table protocol_modifier (              -- surgeon-specific restrictions (meniscus repair etc.)
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  text_ar text not null,
  until_post_op_day int,
  created_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table phase_transition (               -- the clinician's decision, never automatic
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  from_phase int not null,
  to_phase int not null,                       -- 7..9 can encode RTS continuum stages if preferred
  criteria_snapshot jsonb not null,            -- [{id, state, value_text, source}]
  override_reason text,                        -- required when not all criteria were met
  approved_by uuid not null references app_user(id),
  approved_at timestamptz not null default now()
);

create table care_plan (                      -- FHIR CarePlan: one row per programme version
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  from_post_op_day int not null,
  created_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table care_plan_item (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references care_plan(id),
  exercise_id text not null references exercise(id),
  sets int, reps int, hold_sec int,
  frequency_ar text,
  note_ar text,
  removed_at timestamptz
);

-- ---------- patient-reported & measured data (FHIR Observation) ----------
create table daily_checkin (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  pain smallint check (pain between 0 and 10),
  swelling text check (swelling in ('less', 'same', 'more')),
  giving_way boolean, warmth boolean, calf boolean, breath boolean, fever boolean, wound boolean,
  pain_sites text[],
  confidence smallint check (confidence between 0 and 10),
  note text,
  created_at timestamptz not null default now(),
  unique (episode_id, post_op_day)
);

create table exercise_log (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  exercise_id text not null references exercise(id),
  pain_during smallint,
  difficulty smallint,
  load_kg numeric,
  verified jsonb,                              -- camera verification: {method, count, maxFlex, lag}
  created_at timestamptz not null default now()
);

create type measure_source as enum ('clinic', 'camera', 'photo', 'phone', 'patient');

create table rom_measure (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  flex_deg numeric,
  ext_deficit_deg numeric,
  source measure_source not null,
  measured_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table clinical_assessment (            -- in-person assessment
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  effusion_grade smallint check (effusion_grade between 0 and 4),  -- stroke test: 0, trace, 1+, 2+, 3+
  slr_lag boolean, gait_normal boolean, single_leg_stance_sec int,
  landing_quality_ok boolean, hop_prerequisite_ok boolean,
  notes text,
  assessed_by uuid not null references app_user(id),
  created_at timestamptz not null default now()
);

create table strength_test (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  method text not null,                        -- HHD, isokinetic 60°/s ...
  quad_operated numeric, quad_other numeric,
  ham_operated numeric, ham_other numeric,
  tested_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table hop_test (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  single_lsi numeric, triple_lsi numeric, crossover_lsi numeric, timed_lsi numeric,
  cmj_operated_cm numeric, cmj_other_cm numeric,
  tested_by uuid references app_user(id),
  created_at timestamptz not null default now()
);

create table run_session (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  post_op_day int not null,
  level int not null,
  pain_during smallint, pain_after smallint,
  swelling_later text check (swelling_later in ('none', 'mild', 'increased')),
  completed text check (completed in ('yes', 'partial', 'no'))
);

create table questionnaire_response (         -- FHIR QuestionnaireResponse
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  questionnaire_id text not null references questionnaire(id),
  post_op_day int not null,
  answers jsonb,
  score numeric,
  created_at timestamptz not null default now()
);

create table media_item (                     -- wound photos, skeleton-only clips; files in-Kingdom
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  kind text not null check (kind in ('wound_photo', 'skeleton_clip', 'video')),
  storage_key text not null,
  quality jsonb,                               -- brightness, sharpness, ok
  consent boolean not null,
  reviewed_by uuid references app_user(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- coordination ----------
create table appointment (                    -- FHIR Appointment (official booking stays in the facility system)
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  starts_at timestamptz not null,
  kind text not null check (kind in ('virtual', 'in_person')),
  purpose_ar text,
  status text not null default 'scheduled' check (status in ('scheduled', 'done', 'missed', 'cancelled'))
);

create table alert (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  rule_id text not null references alert_rule(id),
  level text not null check (level in ('red', 'yellow')),
  reason_ar text not null,                     -- the "why" shown to the clinician
  raised_at timestamptz not null default now(),
  acknowledged_by uuid references app_user(id),
  acknowledged_at timestamptz,
  ack_note text
);

create table message (                        -- FHIR Communication; not an emergency channel
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  sender_id uuid not null references app_user(id),
  body text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create table visit_note (                     -- SOAP note prepared for copy into the official record
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episode(id),
  kind text not null check (kind in ('virtual', 'in_person')),
  soap_text text not null,
  ai_assisted boolean not null default false,
  author_id uuid not null references app_user(id),
  copied_to_official_record_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- governance ----------
create table audit_log (                      -- who changed what and when (append-only)
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid references app_user(id),
  action text not null,                        -- 'care_plan_item.update', 'phase.approve', 'rule.toggle' ...
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb
);
revoke update, delete on audit_log from public;

-- ---------- management sees aggregates only ----------
create view mgmt_episode_summary as
select e.pathway_id, p.facility_id, e.current_phase, e.status,
       date_trunc('month', e.surgery_date) as surgery_month,
       count(*) as episodes
from episode e join patient p on p.id = e.patient_id
group by 1, 2, 3, 4, 5;

-- Row-level security sketch (enable per table in production):
-- alter table daily_checkin enable row level security;
-- create policy patient_own on daily_checkin for select using (
--   episode_id in (select e.id from episode e join patient p on p.id = e.patient_id where p.user_id = auth.uid()));
-- create policy pt_caseload on daily_checkin for all using (
--   episode_id in (select e.id from episode e join patient p on p.id = e.patient_id where p.primary_pt_id = auth.uid()));
