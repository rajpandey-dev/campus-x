import { useApp } from './store/AppContext'
import Splash from './features/auth/Splash'
import Onboarding from './features/auth/Onboarding'
import Login from './features/auth/Login'
import AppShell from './components/layout/AppShell'
import Home from './features/home/Home'
import Discover from './features/discover/Discover'
import Chat from './features/chat/Chat'
import Profile from './features/profile/Profile'

const SCREENS = { home: Home, discover: Discover, chat: Chat, me: Profile }

export default function App() {
  const { state } = useApp()
  if (state.stage === 'splash') return <Splash />
  if (state.stage === 'onboarding') return <Onboarding />
  if (state.stage === 'login') return <Login />
  const Screen = SCREENS[state.tab]
  return <AppShell><Screen /></AppShell>
}
