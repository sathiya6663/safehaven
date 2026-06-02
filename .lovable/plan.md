# SafeHaven Production Upgrade — Phased Plan

Built on your choices: **MSG91** for SMS/WhatsApp, **OpenStreetMap + Leaflet + Overpass** for maps, **skip Friends/Groups/Events**, **phased delivery with review between each phase**.

I'll deliver one phase at a time. After each, you test in the preview and tell me to continue. Each phase ends with verifiable behavior, not "should work".

---

## Phase 1 — Foundation fixes (small, fast)

Quick wins that unblock the rest and have no external dependencies.

- Dynamic greeting (Morning/Afternoon/Evening/Night) from local time on Dashboard.
- Replace all US emergency numbers with India set: Police **100**, Ambulance **108**, Fire **101**, National Emergency **112**. Audit `Emergency.tsx`, `SOS.tsx`, any hardcoded `911`/`988`.
- Emergency Contacts CRUD audit on `useEmergencyContacts` + Profile/Emergency screens: add/edit/delete/update with instant refresh, phone validation (E.164 + Indian formats), proper error toasts.
- Profile real-time editing: name, phone, location, avatar upload to `avatars` bucket; instant Supabase sync.
- Change Password via `supabase.auth.updateUser`.
- Language + Theme settings: persist to `profiles` (new columns `preferred_language`, `theme`) + localStorage; apply immediately via existing i18n/theme context (create if missing — minimal).

**DB:** add `preferred_language`, `theme` to `profiles`. No new tables.

---

## Phase 2 — Maps, live location, nearby services

- Install `leaflet` + `react-leaflet`.
- New `LiveMap` component using OSM tiles.
- Replace static map/list in `Emergency.tsx` and `Tracking.tsx` with live user position via `useGeolocation` (already exists — extend with `watchPosition`).
- Nearby police/hospitals/fire stations via **Overpass API** (no key needed), cached in React Query.
- `location_tracking` rows written on journey start/stop (table exists).
- Show India emergency numbers as quick-dial overlay on the map.

**DB:** none.

---

## Phase 3 — SOS, Evidence Vault, MSG91 integration

- Confirm `evidence-files` bucket policies (already present) and wire **EvidenceVault.tsx** to real upload (photos/videos/docs) with signed-URL retrieval.
- New edge function `sos-trigger`: writes to `sos_logs` + `safety_alerts`, attaches latest location, attaches signed URLs of evidence captured during SOS, looks up `emergency_contacts`, calls MSG91 (SMS + WhatsApp template) for each contact, writes notification result back to the log row.
- Edge function `send-sms` (MSG91 wrapper) — reusable.
- Frontend `SOS.tsx`: countdown, cancel, live location stream, evidence capture via `useSOSCapture`, calls `sos-trigger`.
- Secrets needed: `MSG91_AUTH_KEY`, `MSG91_SENDER_ID`, `MSG91_SMS_TEMPLATE_ID`, `MSG91_WHATSAPP_TEMPLATE_NAME` (I'll request via secrets tool when we reach this phase).

**DB:** add `delivery_log jsonb` to `sos_logs` for per-contact send status.

---

## Phase 4 — AI Safety Monitoring (real) + Community (real, realtime)

**Safety Monitoring**
- Replace `SafetyMonitor.tsx` dummy data with real history from `safety_alerts` and a new `safety_monitor_scans` table.
- New edge function `safety-analyze` calling Lovable AI Gateway (`google/gemini-2.5-flash`) with a structured tool-call schema → severity, categories (harassment/grooming/stalking/distress/panic), recommendations.
- Persists every scan; surfaces recommendations + history in UI.

**Community**
- Audit `community_posts` + `community_messages` (already exist) — remove any mock fallbacks.
- Add `community_post_likes` table + likes RPC (toggle, returns new count).
- `Community.tsx`: create / edit / delete own post, like, comment (using `community_messages`), Supabase Realtime channel for inserts/updates/deletes on posts, messages, likes.

**DB:** `safety_monitor_scans`, `community_post_likes`.

---

## Phase 5 — MFA, polish, audit report

- Enable Supabase MFA (TOTP) flow in Profile/Settings using `supabase.auth.mfa.*`.
- Remove any remaining mock/static data uncovered during phases 1–4 (full repo sweep).
- Realtime subscription audit (publication membership, channel cleanup on unmount).
- Run security scan, fix what's actionable, document the rest.
- Deliver the final report you asked for: audit, missing features, schema changes shipped, SQL migrations list, storage buckets, security improvements, realtime architecture, per-change explanation.

---

## What I am NOT doing (per your answers)

- Not building Friends, Groups, or Events modules.
- Not adding Google Maps (OSM/Leaflet chosen).
- Not adding Twilio/Fast2SMS (MSG91 chosen).
- Not creating new duplicate pages — every change lands in the existing file.

---

## Technical notes

- All AI calls go through edge functions using `LOVABLE_API_KEY` (already provisioned). No client-side LLM calls.
- All new tables get explicit `GRANT` + RLS + policies in the same migration.
- Realtime: enable `REPLICA IDENTITY FULL` and add to `supabase_realtime` publication for community + sos tables.
- MSG91 is called from edge function only; auth key never reaches the client.
- Leaflet CSS imported once in `main.tsx`; map components lazy-loaded to keep initial bundle small.

---

## Ready to start

If you approve, I begin **Phase 1** immediately. After Phase 1 ships I'll wait for your "continue" before starting Phase 2.