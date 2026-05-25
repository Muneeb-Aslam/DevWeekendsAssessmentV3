<!-- BEGIN:nextjs-agent-rules -->

# FRONTEND_ENGINEERING_GUIDELINES (NEXT.JS)

## Purpose

Mandatory standards for this frontend codebase.

Primary goal: optimize for Next.js App Router, server rendering, and maintainable TypeScript code.

---

## Stack And Commands (Reference)

- Next.js (App Router)
- React + TypeScript (strict)
- ESLint + Prettier

- **Tailwind CSS v4** — `@tailwindcss/vite` plugin; single `@import "tailwindcss"` in `src/styles/globals.css`.
- **ESLint** — Linting; **Prettier** — Formatting (`eslint-config-prettier` to avoid conflicts).
- **Portals** — Always use portals for modals, popups, dropdowns, selects.

---

## Next.js Architecture Rules (Server First)

- Default every route and component to **Server Component**.
- Add `"use client"` only when strictly required (browser APIs, event handlers, client-only hooks).
- Keep as much code as possible server-side:
  - Data fetching
  - Data transformation
  - Auth/session checks
  - Access control gates
  - SEO metadata generation
- Avoid pushing fetch/business logic into client components.

### Route Structure

- Use App Router conventions under `app/`:
  - `app/<segment>/page.tsx`
  - `app/<segment>/layout.tsx`
  - `app/<segment>/loading.tsx`
  - `app/<segment>/error.tsx`
  - `app/<segment>/not-found.tsx`
- Keep route concerns co-located by segment.
- Use route groups where needed to separate layout concerns.

- TypeScript only.
- `any` is strictly forbidden.
- Use `unknown` when necessary.
- All functions must have explicit return types.
- All props must have explicit types.
- Infer types from schemas where possible.

# Architecture Rules

- Functional components only.
- Hooks only.
- Class components are banned.
- Prefer composition over inheritance.
- Avoid deep nesting (>3 levels).
- No business logic inside UI components.
- Extract complex logic into custom hooks.

---

## Client Component Budget (Strict)

- Client Components are allowed only for:
  - interactive UI controls
  - local UI state
  - browser-only APIs
- Keep Client Components thin:
  - receive prepared data from Server Components
  - avoid direct backend orchestration when possible
- Do not wrap whole pages in `"use client"` unless unavoidable.

---

## TypeScript Rules

- TypeScript only; `any` is forbidden.
- Prefer `unknown` over `any` when needed.
- Public functions/components require explicit types.
- Share domain types centrally and reuse them.
- Infer types from schemas where possible (`z.infer`).

---

## API And Validation Rules

- No API calls inside components.
- Use `/services` or `/api` layer.
- All API responses must be typed.
- Proper error handling required.
- Never trust backend blindly.

---

# Code Structure Rules

## Functions

- Max 35 lines.
- Extract helpers if needed.
- Explicit return types required.

## Components

- Max 200 lines.
- Complex logic extracted to hooks.

## Naming

- No abbreviations.
- No magic numbers.
- No magic strings.
- Descriptive names only.

---

# Performance Standards

- Initial load < 2 seconds on slow 3G.
- Route-level code splitting required.
- Lazy-load heavy components.
- Dynamic imports for large libraries.
- Avoid unnecessary `memo`, `useMemo`, `useCallback`.
- Optimize only when measurable.

---

# Accessibility (Non-Negotiable)

- Semantic HTML required.
- All inputs must have labels.
- Proper ARIA attributes.
- Keyboard navigation required.
- Visible focus states.
- Proper contrast ratios.

---

# Security Rules

- Never expose secrets in client bundles.
- Keep tokens and sensitive logic on server side.
- Sanitize and validate user input.
- Assume frontend input is untrusted.

## Developer Discipline

- No dead/commented code.
- No debug logs in production paths.
- No temporary hacks without a clear TODO and owner.
- Keep changes focused and readable for junior developers.

---

<!-- END:nextjs-agent-rules -->
