# Standard: React + TypeScript Frontend
# Applies to: all frontend code

## Stack
- React 18 + TypeScript (strict mode)
- Vite as build tool
- TailwindCSS for all styling — no inline styles, no CSS modules
- TanStack Query v5 (React Query) for all server state
- Zustand for client/UI state (auth, sidebar, modals)
- React Router v6 with protected routes
- React Hook Form + Zod for all forms
- dnd-kit for drag-and-drop (pipeline board)
- Recharts for all charts and data viz
- date-fns for all date formatting and manipulation
- axios for HTTP — single configured instance in src/api/client.ts

## Project Structure
```
frontend/src/
├── api/
│   ├── client.ts        # axios instance, interceptors, token refresh
│   ├── deals.ts         # React Query hooks for deals
│   ├── contacts.ts
│   ├── companies.ts
│   ├── activities.ts
│   └── reports.ts
├── components/
│   ├── ui/              # Shared: Button, Input, Modal, Badge, Table, Spinner
│   ├── layout/          # Sidebar, TopBar, PageWrapper
│   ├── pipeline/        # KanbanBoard, StageColumn, DealCard
│   ├── deals/           # DealForm, StageBar, ActivityTimeline
│   ├── contacts/        # ContactForm, ContactCard
│   └── dashboard/       # KPICard, PipelineFunnel, RevenueChart
├── pages/               # One file per route
├── store/               # Zustand stores
├── types/               # TypeScript interfaces (never use 'any')
├── utils/               # Pure utility functions
└── tokens.css           # Design tokens (CSS variables)
```

## Component Rules
- One component per file, named same as file
- All components are functional — no class components
- Props interface defined directly above component, named {ComponentName}Props
- Default export the component, named exports for sub-components
- No logic in JSX — extract to variables or hooks above the return
- Max 150 lines per component — split if larger

## State Management
- Server state (API data): always TanStack Query — never useState for fetched data
- Global client state: Zustand stores
- Local UI state (open/close, hover): useState
- Form state: React Hook Form — never controlled inputs for forms

## API Calls
- All API calls go through hooks in src/api/
- Use useQuery for reads, useMutation for writes
- Always handle loading, error, and empty states in UI
- axios client auto-attaches Bearer token and handles 401 → refresh → retry

## Forms
- All forms use React Hook Form + Zod schema validation
- Zod schema defined in same file as form component
- Show inline field errors below each input
- Disable submit button while mutation is pending
- Show toast on success and error (react-hot-toast)

## Styling
- TailwindCSS only — no hardcoded hex colors anywhere
- All brand colors via CSS custom properties (var(--color-primary))
- Dark sidebar layout: sidebar bg-gray-900, main content bg-gray-50
- Responsive: mobile-first, but desktop is primary target
- Consistent spacing: use Tailwind scale (p-4, gap-3, etc.)

## TypeScript Rules
- strict: true in tsconfig
- Never use 'any' — use 'unknown' and narrow, or define proper types
- All API response types defined in src/types/
- All Zod schemas infer their TypeScript type (z.infer<typeof schema>)

## Error Handling
- Every page wrapped in ErrorBoundary component
- API errors display user-friendly toast messages (never raw error objects)
- 401 → redirect to login
- 403 → show "You don't have permission" message
- 404 → show Not Found component

## Performance
- React.lazy + Suspense for all page-level components
- useMemo/useCallback only when profiling shows it's needed — not by default
- Virtualize lists longer than 50 items (TanStack Virtual)
