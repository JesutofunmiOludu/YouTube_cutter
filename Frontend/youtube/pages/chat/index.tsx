import ChatPage from './[chatsessionId]/index'
import { AppShell } from '@/components/layout/AppShell'

ChatPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}

export default ChatPage
