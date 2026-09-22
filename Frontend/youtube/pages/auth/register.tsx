// ============================================================
// ClipMide — Register Page
// pages/auth/register.tsx
//
// The login and register UI now live together on /auth/login.
// This page redirects to /auth/login?mode=register so the
// unified split-card page opens with the register panel active.
// All query params (url, q, from) are forwarded.
// ============================================================

import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = new URLSearchParams()
  params.set('mode', 'register')

  for (const [key, value] of Object.entries(context.query)) {
    if (value !== undefined && key !== 'mode') {
      params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
  }

  return {
    redirect: {
      destination: `/auth/login?${params.toString()}`,
      permanent: false,
    },
  }
}

export default function RegisterRedirect() {
  return null
}
