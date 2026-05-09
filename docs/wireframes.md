# Wireframes — LabLock

Low-fidelity wireframes for the six core screens. Built as ASCII so they live in version control. You can redraw these in Figma later (not required for Phase 1).

---

## Screen 1: Login / Signup (`/login`, `/signup`)

```
 ┌────────────────────────────────────────────────────────┐
 │  LabLock                                               │
 │  Lab & Equipment Booking                               │
 │                                                        │
 │        ┌──────────────────────────────────────┐        │
 │        │  Sign in                             │        │
 │        │                                      │        │
 │        │  Email   [___________________]       │        │
 │        │  Password[___________________]       │        │
 │        │                                      │        │
 │        │  [  Sign in  ]  [Sign up instead]    │        │
 │        │                                      │        │
 │        │  [Sign up: Name, Email, Password,    │        │
 │        │   Role(student|supervisor)]          │        │
 │        └──────────────────────────────────────┘        │
 │                                                        │
 └────────────────────────────────────────────────────────┘
```

**Components:** `LoginForm`, `SignupForm`. Shared `AuthLayout` wrapping them.
**State:** form state via React Hook Form + Zod. Error toast on 401 / 409.

---

## Screen 2: Equipment List (`/equipment`)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ LabLock  [Equipment] [My Bookings]       Aditi (Student) [Sign out]│
 ├─────────────────────────────────────────────────────────────────┤
 │ Search [__________]  Category [All ▾]  Date [2026-04-25 📅]    │
 │                                                  [Clear filters]│
 ├─────────────────────────────────────────────────────────────────┤
 │ ┌───────────────┬──────────────┬───────┬──────────┬──────────┐  │
 │ │ Name          │ Category     │ Qty   │ Lab      │ Status   │  │
 │ ├───────────────┼──────────────┼───────┼──────────┼──────────┤  │
 │ │ Osciolloscope │ oscilloscope │ 3     │ EEE-1    │ Available│▸│
 │ │ 3D Printer    │ 3d_printer   │ 1     │ Mech-2   │ Booked   │▸│
 │ │ Spectrometer  │ spectrometer │ 2     │ Chem-1   │ Available│▸│
 │ └───────────────┴──────────────┴───────┴──────────┴──────────┘  │
 │                                                                 │
 │                              ‹ 1  2  3 ›                        │
 └─────────────────────────────────────────────────────────────────┘
```

**Components:** `EquipmentTable`, `FilterBar`, `Pagination`.
**State:** URL-synced filters (so refresh keeps them). Loading skeleton rows.

---

## Screen 3: Equipment Detail + Booking Request (`/equipment/:id`)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ ← Back to Equipment                                             │
 │                                                                 │
 │ Oscilloscope #A-12                                              │
 │ Category: oscilloscope   Condition: good   Qty: 3               │
 │ Lab: EEE Lab 1           Supervisor: Prof. Rao                  │
 │                                                                 │
 │ ┌───────── Upcoming bookings ─────────┐  ┌── Request a slot ──┐│
 │ │ Apr 20  10:00–12:00   approved      │  │ Date     [📅]       ││
 │ │ Apr 21  14:00–16:00   in_use        │  │ Start    [HH:MM]    ││
 │ │ Apr 22  09:00–11:00   approved      │  │ End      [HH:MM]    ││
 │ │                                     │  │ Purpose  [_______]  ││
 │ │                                     │  │                     ││
 │ │                                     │  │ [  Request booking ]││
 │ └─────────────────────────────────────┘  └─────────────────────┘│
 │                                                                 │
 │ ⚠ On conflict: a red toast lists the conflicting slot & reason │
 └─────────────────────────────────────────────────────────────────┘
```

**Components:** `EquipmentHeader`, `UpcomingBookings`, `BookingRequestForm`, `ConflictToast`.
**Conflict UX:** when server returns 409, show each conflict type clearly ("This overlaps with an approved booking at …").

---

## Screen 4: My Bookings (`/my-bookings`)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ My Bookings                                                     │
 │ Filter: [All ▾]  [Requested] [Approved] [In use] [Returned]     │
 ├─────────────────────────────────────────────────────────────────┤
 │ ┌─────────┬──────────────┬─────────────────┬─────────┬────────┐ │
 │ │ Date    │ Equipment    │ Time            │ Status  │ Action │ │
 │ ├─────────┼──────────────┼─────────────────┼─────────┼────────┤ │
 │ │ Apr 22  │ Oscilloscope │ 09:00–11:00     │ requested│[Cancel]│ │
 │ │ Apr 25  │ 3D Printer   │ 14:00–15:00     │ approved │        │ │
 │ │ Apr 18  │ Spectrometer │ 10:00–11:00     │ returned │        │ │
 │ └─────────┴──────────────┴─────────────────┴─────────┴────────┘ │
 └─────────────────────────────────────────────────────────────────┘
```

**Components:** `BookingList`, `StatusBadge`, `CancelButton`.
**Rule:** cancel only allowed when status is `requested` and owner is current user.

---

## Screen 5: Admin — Approvals Queue (`/admin/bookings`)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ Pending Approvals (5)                                           │
 ├─────────────────────────────────────────────────────────────────┤
 │ ┌──────────┬─────────────────┬──────────────┬─────────────────┐ │
 │ │ Student  │ Equipment       │ When         │                 │ │
 │ ├──────────┼─────────────────┼──────────────┼─────────────────┤ │
 │ │ Aditi S. │ Oscilloscope    │ Apr 22 09–11 │[Approve][Reject]│ │
 │ │ Karan P. │ 3D Printer      │ Apr 23 14–16 │[Approve][Reject]│ │
 │ └──────────┴─────────────────┴──────────────┴─────────────────┘ │
 │                                                                 │
 │  (clicking Reject opens a modal with required reason field)     │
 └─────────────────────────────────────────────────────────────────┘
```

**Components:** `ApprovalQueue`, `ApproveButton`, `RejectModal`.

---

## Screen 6: Admin Dashboard (`/admin/dashboard`)

```
 ┌─────────────────────────────────────────────────────────────────┐
 │ Dashboard                                                       │
 │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
 │ │ Equipment    │ │ Active today │ │ Pending      │ │ This week││
 │ │     15       │ │      7       │ │     5        │ │    34    ││
 │ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
 │                                                                 │
 │ Utilization (last 30 days)                                      │
 │ ┌─────────────────────────────────────────────────────────────┐ │
 │ │ Oscilloscope ████████████ 46h                               │ │
 │ │ 3D Printer   ██████       22h                               │ │
 │ │ Spectrometer ███          11h                               │ │
 │ └─────────────────────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────────────┘
```

**Components:** `SummaryCards`, `UtilizationChart` (Recharts bar chart).

---

## Shared Layout

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  Topbar:  LabLock logo |  nav links   |   user menu             │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                 │
 │  <route content>                                                │
 │                                                                 │
 ├─────────────────────────────────────────────────────────────────┤
 │  Footer:  © 2026 LabLock · Built for SE ZG503 · GitHub link     │
 └─────────────────────────────────────────────────────────────────┘
```

**Responsive breakpoints:**

- Mobile (`< 640px`): topbar collapses to hamburger; tables switch to stacked card layout
- Tablet (`640–1024px`): 2-column forms, single-column dashboard cards
- Desktop (`> 1024px`): layouts as drawn above

---

## Component Tree (to be built in Phase 3)

```
App
├── AuthLayout (public)
│   ├── LoginPage
│   └── SignupPage
└── AppLayout (protected)
    ├── Topbar
    ├── EquipmentListPage
    │   ├── FilterBar
    │   ├── EquipmentTable
    │   └── Pagination
    ├── EquipmentDetailPage
    │   ├── EquipmentHeader
    │   ├── UpcomingBookings
    │   └── BookingRequestForm
    ├── MyBookingsPage
    │   └── BookingList
    ├── AdminBookingsPage (admin-only route)
    │   ├── ApprovalQueue
    │   └── RejectModal
    └── AdminDashboardPage (admin-only route)
        ├── SummaryCards
        └── UtilizationChart
```

Commit this doc as-is. Redraw in Figma only if you want prettier assets for the demo video — pen-and-paper scans are also acceptable per the brief.
