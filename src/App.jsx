
import { useApp } from './store/AppContext'

import Splash from './features/auth/Splash'
import Onboarding from './features/auth/Onboarding'
import Login from './features/auth/Login'
import Register from './features/auth/Register'

import AppShell from './components/layout/AppShell'
import Home from './features/home/Home'
import Discover from './features/discover/Discover'
import Chat from './features/chat/Chat'
import Profile from './features/profile/Profile'
import Connections from './features/connections/Connections'

const SCREENS = {
  home: Home,
  discover: Discover,
  connections: Connections,
  chat: Chat,
  me: Profile,
}

export default function App() {
  const { state } = useApp()

  if (state.stage === 'splash') {
    return <Splash />
  }

  if (state.stage === 'onboarding') {
    return <Onboarding />
  }

  if (state.stage === 'login') {
    return <Login />
  }

  if (state.stage === 'register') {
    return <Register />
  }

  const Screen = SCREENS[state.tab] || Home

  return (
    <AppShell>
      <Screen />
    </AppShell>
  )
}