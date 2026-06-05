import type { ReactElement } from 'react'
import Head from 'next/head'
import { HomeHero }     from '@/components/home/HomeHero'
import { HomeStats }    from '@/components/home/HomeStats'
import { HomeFeatures } from '@/components/home/HomeFeatures'
import { HomeCTA }      from '@/components/home/HomeCTA'
import { LandingLayout } from '@/components/layout/LandingLayout'
import type { NextPageWithLayout } from './_app'

const HomePage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>VidMind AI — Stop watching. Start understanding.</title>
        <meta
          name="description"
          content="VidMind AI transforms hours of video into structured intelligence. Search through content, extract insights, and master topics in minutes."
        />
      </Head>
      <HomeHero />
      <HomeStats />
      <HomeFeatures />
      <HomeCTA />
    </>
  )
}

HomePage.getLayout = (page: ReactElement) => (
  <LandingLayout>{page}</LandingLayout>
)

export default HomePage