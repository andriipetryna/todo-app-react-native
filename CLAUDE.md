# CLAUDE.md — Local TODO App

This file is project memory. Claude Code loads it at the start of every session. Treat it as the project's standing rules; when a prompt conflicts with this file, follow this file unless the user explicitly overrides it in chat.

## What we're building

A personal TODO app. Single user, no accounts, no backend, no cloud. Everything lives on the device. Android is the first and only required target; the codebase must stay structured so an iOS build can be added later without a rewrite.

Core features:
- To-do items with title, optional notes, optional due date **and** time.
- Groups (lists) that todos belong to; a todo has zero or one group.
- A local notification fired a configurable amount of time **before** the due time (per-todo lead time, with a global default).
- An Android home-screen widget showing upcoming/selected todos.

## Hard constraints (do not violate)

- **No authentication.** Never add login, accounts, or user identity.
- **No network / no sync.** Never add a backend, remote API, analytics, or cross-device sync. All data is on-device. The only acceptable outbound network use is package installation at build time.
- **Local storage only**, via SQLite.
- **Android-first.** Implement and verify Android before any iOS-specific work. iOS is a later phase (see PLAN.md, Phase 6).
- **TypeScript, strict mode.** No `any` unless justified with a comment.
- Do not add a dependency without noting why in the PR/commit message. Prefer the libraries listed below.

## Tech stack (chosen — do not swap without asking)

- **Expo** (managed workflow, config plugins + prebuild) — gives easy APK builds now and an iOS path later.
- **expo-router** for navigation (file-based, in `app/`).
- **expo-sqlite** + **Drizzle ORM** for the local database (typed schema, migrations).
- **Zustand** for lightweight UI/app state. Data comes from Drizzle; Zustand holds only ephemeral UI state and cached derived views.
- **expo-notifications** for local scheduled notifications.
- **react-native-android-widget** for the Android widget (lets us write the widget UI in JSX — no Kotlin needed). Requires React Native >= 0.76, which the current Expo SDK satisfies.
- **EAS Build** to produce the APK.
- Tooling: ESLint + Prettier + `tsc --noEmit` typecheck. Jest + React Native Testing Library for unit tests of date and scheduling logic.

> Versions move fast. Scaffold with the latest Expo SDK via `npx create-expo-app`, then check the latest stable of each package before pinning. As of mid-2026 the relevant baselines are React Native 0.85.x, react-native-android-widget 0.20.x, expo-notifications 56.x.

## Project structure

```
app/                      # expo-router routes (screens)
  _layout.tsx
  index.tsx               # main screen: groups + todo list
  todo/[id].tsx           # create / edit a todo
  settings.tsx            # default lead time, etc.
src/
  db/
    schema.ts             # Drizzle tables: groups, todos, settings
    client.ts             # db init + migration runner
    migrations/
    repositories/         # todos.ts, groups.ts, settings.ts (all DB access goes through here)
  notifications/
    scheduler.ts          # schedule / reschedule / cancel for a todo
    reconcile.ts          # on launch, re-sync OS schedule with DB
    channel.ts            # Android channel + permission setup
  widget/
    TodoWidget.tsx        # the JSX widget UI
    snapshot.ts           # writes the widget data snapshot on every data change
    handler.ts            # widget task handler (renders from snapshot)
  store/                  # zustand stores
  lib/                    # date/time helpers, formatting
  components/             # shared UI
assets/
app.config.ts             # Expo config + plugins (notifications, android-widget)
eas.json                  # build profiles (apk preview profile)
drizzle.config.ts
```

All database reads/writes go through `src/db/repositories/*`. UI and notification code must not issue raw SQL.

## Commands

- `npm run start` — Expo dev server
- `npm run android` — run on device/emulator
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run test` — Jest
- `npx drizzle-kit generate` — generate a migration after editing `schema.ts`
- `eas build -p android --profile preview` — build an installable **APK** (the `preview` profile sets `android.buildType = "apk"`)

After any code change, run `npm run typecheck` and `npm run lint` and fix what you broke before moving on.

## Domain rules

- A todo's `dueAt` is a full timestamp (date + time), stored as epoch milliseconds (UTC). Format for display in the device's local timezone.
- `notificationLeadMinutes` is per-todo; when null, fall back to the global default in the `settings` table.
- The notification fires at `dueAt - leadMinutes`. If that moment is already in the past at save time, do not schedule.
- Completing or deleting a todo cancels its scheduled notification. Editing the due time or lead time reschedules it.
- Store the OS notification identifier on the todo row so it can be cancelled/rescheduled precisely.

## Known gotchas (read before implementing the related phase)

- **Android 13+ requires the `POST_NOTIFICATIONS` runtime permission.** Request it before scheduling. Create the notification channel at startup or notifications are dropped silently.
- **Exact timing:** Android may delay notifications under Doze/battery optimization. Use the most exact scheduling `expo-notifications` offers and test on a real device, not just an emulator.
- **Reconcile on launch:** OS-scheduled notifications can be lost on reboot or shifted by timezone changes. On every app start, run `reconcile.ts` to compare the DB against scheduled notifications and re-arm as needed.
- **Widget data flow:** the widget renders in a headless task that does not share the app's live SQLite connection conveniently. Maintain a JSON **snapshot** (`widget/snapshot.ts`) written on every todo/group change; the widget handler renders from the snapshot, never queries the DB directly. Trigger a widget update whenever the snapshot changes.
- **Widget taps** should deep-link into the app via expo-router (e.g. open the relevant todo or group).

## How to work

- Follow `PLAN.md` phase by phase, top to bottom. Finish and verify a phase before starting the next.
- Each phase in PLAN.md has acceptance criteria; treat them as the definition of done.
- Keep commits small and scoped to one task.
- If a decision isn't covered here or in PLAN.md, prefer the simplest local-only solution and leave a `// NOTE:` explaining the choice rather than guessing silently.
- Do not start iOS work (Phase 6) until the user asks.