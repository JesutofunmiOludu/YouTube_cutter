/**
 * useClientPathname
 *
 * A safe replacement for `useRouter().pathname` in Pages Router layout
 * components that render during SSR.
 *
 * WHY: On Windows, a casing mismatch between the shell's CWD
 * (e.g. `frontend\youtube`) and the actual folder name on disk
 * (`Frontend\youtube`) causes Webpack to load two separate copies of
 * `next/dist/shared/lib/router/router.js`.  _app.tsx mounts the
 * RouterContext.Provider from copy A, but components compiled from the
 * CWD context read from copy B — which is empty — so `useRouter()`
 * throws "NextRouter was not mounted".
 *
 * `useClientPathname` reads `window.location.pathname` after the
 * component mounts (client-side only), completely bypassing the
 * RouterContext dependency.  It also subscribes to Next.js route
 * events so the active-nav highlight updates on SPA navigation.
 */

import { useState, useEffect } from 'react'

export function useClientPathname(): string {
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    // Set the initial pathname.
    setPathname(window.location.pathname)

    // Keep it in sync with Next.js SPA route transitions.
    // next/router is dynamically imported so this module itself has
    // no top-level dependency on RouterContext.
    let cleanup: (() => void) | undefined

    import('next/router').then(({ default: Router }) => {
      const handler = (url: string) => {
        // url may include query-string; strip it
        setPathname(url.split('?')[0])
      }
      Router.events.on('routeChangeComplete', handler)
      cleanup = () => Router.events.off('routeChangeComplete', handler)
    })

    return () => { cleanup?.() }
  }, [])

  return pathname
}

/**
 * clientNavigate
 *
 * Programmatic SPA navigation without calling useRouter() at render time.
 * Use this inside event handlers (onClick, onSubmit, etc.).
 */
export function clientNavigate(href: string): void {
  import('next/router').then(({ default: Router }) => Router.push(href))
}
