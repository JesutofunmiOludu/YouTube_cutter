import ResearchPage from './[sessionId]/index'
import { AppShell } from '@/components/layout/AppShell'

ResearchPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}

export default ResearchPage
