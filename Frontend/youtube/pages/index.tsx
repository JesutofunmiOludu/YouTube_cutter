import type { ReactElement } from 'react'
import Head from 'next/head'
import { HomeHero }      from '@/components/home/HomeHero'
import { HomeFeatures }  from '@/components/home/HomeFeatures'
import { HomeStats }     from '@/components/home/HomeStats'
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks'
import { HomeCTA }        from '@/components/home/HomeCTA'
import { LandingLayout }  from '@/components/layout/LandingLayout'
import type { NextPageWithLayout } from './_app'

const HomePage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>VidMind AI — Stop watching. Start understanding.</title>
        <meta name="description" content="Paste any YouTube link. AI splits it into chapters, transcribes it, and builds a cited research report." />
      </Head>
      <HomeHero />
      <HomeStats />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomeCTA />
    </>
  )
}

HomePage.getLayout = (page: ReactElement) => (
  <LandingLayout>{page}</LandingLayout>
)

export default HomePage