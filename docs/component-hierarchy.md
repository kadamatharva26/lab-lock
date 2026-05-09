# LabLock — Component Hierarchy

```
<App>
├── <Routes>
│   ├── /login           → <LoginPage>
│   ├── /signup          → <SignupPage>
│   │
│   └── <ProtectedRoute>          ← requires JWT
│        └── <AppLayout>          ← top nav + footer + <Outlet/>
│             ├── /equipment            → <EquipmentListPage>
│             │     ├── filter card (search + category + date)
│             │     ├── equipment <table>
│             │     └── <Pagination>
│             │
│             ├── /equipment/:id        → <EquipmentDetailPage>
│             │     ├── equipment header card
│             │     ├── upcoming bookings <table>
│             │     └── <BookingForm>   (date/start/end/purpose)
│             │           └── conflict <ErrorList> (renders 409 details[])
│             │
│             ├── /my-bookings          → <MyBookingsPage>
│             │     ├── status filter buttons
│             │     └── bookings <table> with self-cancel button
│             │
│             ├── /admin/dashboard      → <ProtectedRoute role="admin">
│             │     └── <AdminDashboardPage>
│             │           ├── 4× <StatCard>
│             │           └── recharts <BarChart> (utilization)
│             │
│             ├── /admin/bookings       → <ProtectedRoute role="admin">
│             │     └── <AdminBookingsPage>
│             │           ├── status tabs
│             │           ├── queue <table> with Approve / Reject / Mark in-use / Mark returned
│             │           └── <RejectModal>
│             │
│             └── /admin/equipment      → <ProtectedRoute role="admin">
│                   └── <AdminEquipmentPage>
│                         ├── equipment <table> with Edit / Retire
│                         └── <EquipmentForm> (inline; create or edit)
```

## Shared / leaf components (`src/components/`)

| Component | Responsibility |
|-----------|----------------|
| `<AppLayout>` | Top nav, role-aware admin links, footer, react-router `<Outlet/>` |
| `<ProtectedRoute>` | Redirects to `/login` if no token; if `role` prop is set, also redirects when role doesn't match |
| `<Spinner>` / `<FullPageLoader>` | Loading affordances |
| `<EmptyState>` | Title + description + optional CTA action |
| `<StatusBadge>` | Maps `BookingStatus` → coloured pill |

## State management

We use **Zustand** with the `persist` middleware so `{ token, user }` survives a page reload. Everything else (table data, form state) is local component state — there's no need for a global store.

Auth store API (`src/store/auth.js`):

```js
useAuth.getState() // { token, user, login(payload), logout(), isAdmin() }
```

Selectors are memoised via `useAuth((s) => s.user)` which keeps re-renders minimal.

## Data flow

```
component  ─►  api/* helper  ─►  axios client (adds Bearer)  ─►  gateway:4000
                                                                     │
                                                                     ▼
                                                            auth-service / core-service
```

The axios client also has a response interceptor: any 401 wipes the auth store and forces a redirect to `/login`. Toast errors come from `apiError(e)` which extracts `error.message` from our standard error envelope.

## Why this shape

- One page = one route = one default-export component, easy for a grader to find.
- All long-lived navigation chrome is in `<AppLayout>` so individual pages stay focused on their content.
- Admin pages are nested inside the same layout (so the same nav is visible) but each one is wrapped in a second `<ProtectedRoute role="admin">` — defense in depth in case someone bookmarks an admin URL.
- Forms use **react-hook-form** for validation so we get touched/error/isSubmitting for free, without writing reducers.
- Charts use **recharts** because the assignment specifically calls out a utilization visualization on the admin dashboard.
