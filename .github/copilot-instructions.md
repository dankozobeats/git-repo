# Copilot Instructions - Habit Tracker v2

## 🎯 Project Overview

**BadHabit Tracker** is a Next.js + Supabase habit tracking app with dual habit types:
- **Good Habits**: Goal-based tracking with daily/weekly/monthly objectives (counter or binary)
- **Bad Habits**: Relapse tracking with no goals (unlimited crackup counts)

**Key Architecture**: Server-rendered pages fetch data, client components handle state and UI interactions, API routes handle mutations.

---

## 🏗️ Architecture & Component Patterns

### Data Flow: Server → Client → API → Supabase

1. **Server Component** (`app/habits/[id]/page.tsx`): Authenticates user, fetches habit + 90-day calendar data from Supabase
2. **Client Component** (`HabitDetailClient.tsx`): Manages UI state (goal modal, day selection, count updates)
3. **Child Components** (HabitCounter, HabitCalendar, etc.): Focused responsibilities, minimal state
4. **API Routes** (`/api/habits/[id]/*`): Handle POST/DELETE for check-ins, goal updates, deletions

### Key Structural Decisions & Why

- **Server/Client Split**: Server fetches auth-protected data; client handles UX interactions. See `page.tsx` vs `HabitDetailClient.tsx`.
- **Habit Type Branching**: Code splits early (`isBadHabit` flag) because UI/logic differ significantly—counter vs goal modals, message tone, calendar colors.
- **Router.refresh()**: After mutations, page revalidates to sync server cache. See `HabitCounter.tsx` line ~90.
- **Optimistic Updates**: UI updates immediately; reverted if API fails. Improves perceived latency—see `handleAddRepetition()`.

### File Organization
```
app/
  habits/[id]/
    page.tsx              ← Server: fetch data, compute stats
    HabitDetailClient.tsx ← Client: orchestrates UI sections
    HabitCounter.tsx      ← Client: +1/-1 buttons, toast feedback
    HabitCalendar.tsx     ← Client: accordion months, 7-day grid
    GoalSettingsModal.tsx ← Client: good habit goal config
    GamificationPanel.tsx ← Stats display (4-card grid)
    HabitCoach.tsx        ← AI coach messages (contextual)
  api/habits/[id]/
    check-in/route.ts     ← POST: log entry, DELETE: remove latest
    goal/route.ts         ← POST/DELETE: goal updates
```

---

## 📊 Data Model & Habit Tracking Modes

### Database Schema (types/database.ts)
```typescript
habits: {
  id, user_id, name, type ('good'|'bad'), tracking_mode ('binary'|'counter'),
  goal_value, goal_type ('daily'|'weekly'|'monthly'), goal_description,
  color, icon, description, created_at, updated_at
}

logs: {
  id, habit_id, user_id, completed_date, created_at
  // Simple binary logging (one entry = one completion)
}

habit_events: {
  id, habit_id, event_date, occurred_at
  // Used for counter mode: multiple events per day
}
```

### Important Habit Type Rules
- **Good habits**: Can have goals; goal_value/goal_type define daily/weekly/monthly targets
- **Bad habits**: No goals; tracks relapses only (count unlimited per day)
- **Tracking modes**: 
  - `'binary'` = one log per day max (traditional checkbox)
  - `'counter'` = multiple `habit_events` per day (used for repetition counts)

---

## 🎨 Key Conventions & Patterns

### Component Props Flow Pattern
Components use explicit, single-responsibility props. **See examples**:
- `HabitCounter` gets: `habitId, habitType, trackingMode, goalValue, todayCount, onCountChange`
- `HabitCalendar` gets: `months[], isBadHabit, goalValue` (minimal, derived data)
- Avoid prop drilling; use React context for UI-wide state (e.g., selectedDate modal)

### Mutation Pattern (API + Optimistic UI)
```typescript
// 1. Optimistic update (instant feedback)
setCount(count + 1)
setIsLoading(true)

// 2. Send to API
const res = await fetch(`/api/habits/${habitId}/check-in`, { method: 'POST' })

// 3. Revalidate on success
if (res.ok) {
  router.refresh()
  showToast('Success message')
} else {
  setCount(count) // rollback if failed
  showToast('Error!')
}
```

### Color Coding (Tailwind)
- **Good Habits**: Green (goal reached) → Yellow (partial) → Gray (empty)
  - `bg-green-600` (≥ goal), `bg-yellow-500` (0 < count < goal), `bg-gray-800/40` (0)
- **Bad Habits**: Red intensity scales with daily count
  - `bg-red-500` (1), `bg-red-600` (2), `bg-red-700` (3+)

### Toast Notifications
Use `useToast()` hook from `@/components/Toast.tsx`. Messages differ by habit type:
- Good: Motivational ("🎯 Objectif atteint! 💪")
- Bad: Sarcastic ("3 craquages! Tu prends goût là? 😅")

---

## 🔌 External Dependencies & Integration Points

### Supabase (Auth + Database)
- **Server Client**: `lib/supabase/server.ts` (handles cookies, for authenticated routes)
- **Browser Client**: `lib/supabase/client.ts` (for client-side queries)
- **Pattern**: Always check `user` via `supabase.auth.getUser()` before DB queries
- **Auth Guard**: Server components redirect to `/login` if unauthenticated (see `page.tsx`)

### OpenAI Integration
- `HabitCoach.tsx` calls OpenAI API to generate contextual motivational messages
- Input: habit type, stats (streak, total count), user performance
- Output: Sarcastic (bad) or motivational (good) message

### Next.js 16 Features Used
- **App Router**: File-based routing (`[id]` dynamic segments)
- **Server Components**: Default in `app/`; add `'use client'` to interactive components
- **Dynamic Params**: `params: Promise<{ id: string }>` (React 19 async syntax)
- **Router.refresh()**: Revalidate server cache after mutations

---

## 🧪 Development Workflows

### Running Locally
```bash
npm run dev      # Start Next.js dev server (localhost:3000)
npm run build    # Type-check + compile
npm run lint     # ESLint (Next.js config + TypeScript)
```

### Testing Habit Interactions
1. Create a habit via `/habits/new` form
2. Navigate to `/habits/[id]` detail page
3. Click "+1 Fait" / "J'ai craqué" to log entries
4. Watch Supabase `logs` / `habit_events` tables populate
5. Check calendar rendering updates immediately (client state)
6. Verify `router.refresh()` syncs new counts

### Debugging Data Fetching
- Open browser DevTools → Network tab
- Page.tsx data fetch appears in server logs (terminal)
- Check Supabase Dashboard → SQL Editor for query results
- Toast errors appear bottom-right (check `Toast.tsx` for styling)

---

## ⚠️ Common Pitfalls & Gotchas

1. **Mixing tracking_mode**: Code assumes either `'binary'` or `'counter'` consistently. Changing mid-habit breaks stats—see `page.tsx` line ~50 for dual-path logic.

2. **Goal-only for Good Habits**: Don't expose goal UI for bad habits. `GoalSettingsModal` is conditionally rendered—remove it and confirm tests pass.

3. **Calendar Data Structure**: Months are pre-computed server-side; client just renders. To add filtering (e.g., "last 30 days"), modify `page.tsx` stat calc, not `HabitCalendar.tsx`.

4. **Router.refresh() Timing**: Causes page re-render after mutation. Ensure optimistic UI state matches server data; otherwise flicker occurs.

5. **Stripe/Gamification**: `GamificationPanel.tsx` references achievements system (not fully implemented). Avoid adding logic here unless backlog item exists.

6. **Toast Persistence**: Toasts auto-dismiss after 3s (see `Toast.tsx`). For long messages, increase timeout.

---

## 📁 Key Files by Responsibility

| File | Purpose | Key Details |
|------|---------|-------------|
| `page.tsx` | Server data fetch, auth check | 90-day calendar, streak calc |
| `HabitDetailClient.tsx` | UI orchestration | Manages modal/date state |
| `HabitCounter.tsx` | Log entries (+1/-1) | Optimistic updates, toasts |
| `HabitCalendar.tsx` | Calendar grid display | Month accordion, color logic |
| `GoalSettingsModal.tsx` | Goal config (good habits only) | Validation, Supabase upsert |
| `api/habits/[id]/check-in/route.ts` | POST/DELETE logging | Counts, goal validation |
| `api/habits/[id]/goal/route.ts` | Goal CRUD | Upsert/delete goal_* fields |
| `types/database.ts` | TypeScript types | Schema definitions |
| `lib/supabase/server.ts` | Auth-protected DB client | Cookie-based auth flow |

---

## 🚀 Before Shipping Changes

1. **Type Safety**: Run `npx tsc --noEmit` before commits
2. **Build**: Ensure `npm run build` succeeds (not just `npm run dev`)
3. **Cross-Browser**: Test in Chrome + Safari (color gradients, responsive)
4. **Real Data**: Verify with actual Supabase habits (not mocks)
5. **Auth**: Confirm logged-out users redirect to `/login`
6. **Habit Types**: Test both good (with goal) and bad (no goal) habit flows

---

## 💬 Asking AI for Help

**Effective queries**:
- "How does the modal state flow from HabitDetailClient to GoalSettingsModal?"
- "Why does page.tsx compute streak differently for binary vs counter habits?"
- "How do I add a new stat card to GamificationPanel?"

**Context to include**:
- Habit type (good/bad) and tracking mode (binary/counter) being modified
- Error message or unexpected behavior
- File path + line number if referencing specific code

---

*Last Updated: Nov 16, 2025*
