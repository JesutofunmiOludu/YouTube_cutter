import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(context.query)) {
    if (value !== undefined) {
      params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
  }

  const queryString = params.toString()
  const destination = queryString ? `/auth/register?${queryString}` : '/auth/register'

  return {
    redirect: {
      destination,
      permanent: true,
    },
  }
}

export default function LegacyRegisterRedirect() {
  return null
}
