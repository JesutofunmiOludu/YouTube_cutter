import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { from } = context.query
  const destination = from
    ? `/auth/login?from=${encodeURIComponent(String(from))}`
    : '/auth/login'

  return {
    redirect: {
      destination,
      permanent: true,
    },
  }
}

export default function LegacyLoginRedirect() {
  return null
}
