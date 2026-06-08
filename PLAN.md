# PLAN.md — Build Plan

Read `CLAUDE.md` first; it holds the standing rules, stack, structure, and gotchas. This file is the ordered work plan. Do the phases in order. Each phase lists tasks and the acceptance criteria that define "done." Verify a phase (typecheck, lint, manual check on Android) before moving to the next.

## How to use this with Claude Code

1. Put `CLAUDE.md` and `PLAN.md` at the repo root.
2. Start Claude Code in the repo. It auto-loads `CLAUDE.md`.
3. Drive it one phase at a time, e.g. *"Do Phase 0"*, review, then *"Do Phase 1"*. Working phase-by-phase keeps the context focused and the diffs reviewable.
4. After each phase, confirm the acceptance criteria before continuing.

---

## Phase 0 — Scaffolding & tooling

**Goal:** an empty but runnable Expo + TypeScript app with quality gates and an APK build profile.

- [ ] Scaffold with the latest Expo SDK: `npx create-expo-app@latest todo-app --template` (TypeScript, expo-router).
- [ ] Convert config to `app.config.ts`. Set app name, slug, Android package id, icon/splash placeholders.
- [ ] Add ESLint + Prettier; configure `tsconfig.json` with `"strict": true`.
- [ ] Add scripts: `start`, `android`, `typecheck`, `lint`, `test`.
- [ ] Add Jest + React Native Testing Library; one trivial passing test.
- [ ] `eas init`; add `eas.json` with a `preview` profile that sets `android.buildType = "apk"`.
- [ ] Create the `src/` directory structure from CLAUDE.md (empty placeholder files are fine).

**Acceptance:** app launches on an Android device/emulator showing a placeholder screen; `npm run typecheck`, `npm run lint`, and `npm run test` all pass.

---

## Phase 1 — Data layer

**Goal:** typed local database with migrations and a repository API. No UI yet.

- [ ] Install `expo-sqlite` and `drizzle-orm`; add `drizzle-kit` (dev) and `drizzle.config.ts`.
- [ ] Define `src/db/schema.ts`:
  - `groups`: `id` (pk), `name`, `color`, `sortOrder`, `createdAt`.
  - `todos`: `id` (pk), `groupId` (nullable FK → groups), `title`, `notes` (nullable), `dueAt` (nullable, epoch ms), `notificationLeadMinutes` (nullable int), `notificationId` (nullable text), `isDone` (bool), `completedAt` (nullable), `sortOrder`, `createdAt`, `updatedAt`.
  - `settings`: single-row table with `defaultLeadMinutes` (default e.g. 30) and any future prefs.
- [ ] Generate the initial migration (`npx drizzle-kit generate`) and wire `src/db/client.ts` to run migrations on startup.
- [ ] Implement `src/db/repositories/`: `groups.ts`, `todos.ts`, `settings.ts` with CRUD + queries (todos by group, upcoming todos sorted by `dueAt`, toggle done).
- [ ] Unit-test the repository against an in-memory/temp DB.

**Acceptance:** migrations run on a fresh install; repository CRUD works in tests; no raw SQL outside `repositories/`.

---

## Phase 2 — Core UI

**Goal:** a usable todo app (minus notifications and widget).

- [ ] `app/index.tsx`: list grouped by group, with completed items visually distinct; create/complete/delete; reorder optional.
- [ ] Group management: create/rename/recolor/delete a group (deleting a group sets its todos' `groupId` to null, doesn't delete them).
- [ ] `app/todo/[id].tsx`: create/edit form — title, notes, group picker, due date + time picker, per-todo lead-time override.
- [ ] Use a date+time picker that returns a full timestamp; persist as epoch ms; display in local timezone via `src/lib` helpers.
- [ ] Wire Zustand only for ephemeral UI state (filters, selection); data stays in the DB via repositories.
- [ ] Empty states and basic styling.

**Acceptance:** can create groups and todos with due date/time, edit and complete them, and data survives an app restart.

---

## Phase 3 — Notifications

**Goal:** a local notification fires `leadMinutes` before each todo's due time.

- [ ] Install/configure `expo-notifications` (plugin in `app.config.ts`).
- [ ] `src/notifications/channel.ts`: create the Android channel at startup; request `POST_NOTIFICATIONS` on Android 13+ before scheduling.
- [ ] `src/notifications/scheduler.ts`: `schedule(todo)`, `reschedule(todo)`, `cancel(todo)`. Fire time = `dueAt - (leadMinutes ?? settings.defaultLeadMinutes)`. Skip if in the past. Save the returned OS identifier to `todos.notificationId`.
- [ ] Hook scheduling into create/edit/complete/delete in the repositories or a thin service layer.
- [ ] `src/notifications/reconcile.ts`: on app launch, diff DB todos vs scheduled notifications and re-arm/cancel to match.
- [ ] Settings screen: edit the global default lead time.
- [ ] Tests for the fire-time calculation, including past-due and null-lead fallback cases.

**Acceptance:** on a real device, a todo due soon produces a notification at the expected lead time; completing/deleting cancels it; editing the time reschedules it; reconcile re-arms after a reboot. (See CLAUDE.md gotchas re: Doze and exact timing.)

---

## Phase 4 — Android widget

**Goal:** a home-screen widget showing upcoming todos, kept in sync with the app.

- [ ] Install and configure `react-native-android-widget` (plugin in `app.config.ts`, prebuild).
- [ ] `src/widget/snapshot.ts`: write a compact JSON snapshot (e.g. next N upcoming todos, with title/dueAt/group) on every todo/group change.
- [ ] `src/widget/TodoWidget.tsx`: the JSX widget UI rendering from the snapshot.
- [ ] `src/widget/handler.ts`: widget task handler that loads the snapshot and renders; refresh the widget whenever the snapshot updates.
- [ ] Tapping a widget item deep-links via expo-router to that todo (or the list). Provide an "add" affordance that opens the create screen.
- [ ] Verify the widget updates after add/complete/edit without opening the app cold.

**Acceptance:** widget can be added to the home screen, shows correct upcoming todos, updates within a reasonable delay after changes, and taps open the right screen.

---

## Phase 5 — Build, polish, ship the APK

**Goal:** a distributable APK and a presentable app.

- [ ] App icon, adaptive icon, splash screen.
- [ ] Accessibility pass (labels, hit targets, dynamic font sizes); dark mode if cheap.
- [ ] Handle edge cases: very long titles, no due date, past-due display, timezone change.
- [ ] `eas build -p android --profile preview` → confirm the output is an installable APK; install on a clean device and smoke-test all features end to end.
- [ ] Short README: how to dev, test, and build the APK.

**Acceptance:** a freshly installed APK supports the full flow — groups, todos with due date/time, notifications at the configured lead time, and the home-screen widget.

---

## Phase 6 — iOS enablement (future — only when the user asks)

**Goal:** add iOS without disturbing the Android build.

- [ ] Confirm the shared app (UI, DB, notifications) builds and runs on iOS via Expo.
- [ ] iOS notification parity (permissions, scheduling) through `expo-notifications`.
- [ ] iOS home-screen widget: this is the one piece that can't be JS — build it in SwiftUI/WidgetKit, wired in via `expo-apple-targets`. Feed it from the same snapshot/shared data.
- [ ] Add an iOS EAS build profile; test on device.

**Acceptance:** iOS app reaches feature parity except where platform differences are unavoidable; Android remains unaffected.

---

## Out of scope (do not build)

Accounts/login, any backend or cloud sync, push notifications from a server, analytics/telemetry, in-app purchases. Keep it local, single-user, offline.