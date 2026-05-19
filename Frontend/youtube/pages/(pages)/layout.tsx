// ============================================================
// VidMind AI — Authenticated App Layout
// src/app/(app)/layout.tsx
//
// Route group layout for all authenticated pages.
// The (app) folder name is a Next.js "route group" —
// it groups routes without affecting the URL path.
//
// All routes inside (app)/ are protected. The middleware.ts
// handles the redirect to /login for unauthenticated users.
//
// This layout renders: Sidebar + Topbar + main content.
// It is a Client Component because it uses Zustand.
// ============================================================

import { AppShell } from '@/components/layout/AppShell'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}