import { createContext, useContext, useReducer, useCallback } from 'react'
import { currentUser } from '../data/mock'

const initial = {
  stage: 'splash',            // splash | onboarding | login | app
  tab: 'home',                // home | discover | chat | me
  user: currentUser,
  presenceHidden: false,
  createOpen: false,
  toasts: [],
  drafts: {},                 // unsent messages / listings keyed by id
}

function reducer(s, a) {
  switch (a.type) {
    case 'stage': return { ...s, stage: a.value }
    case 'tab': return { ...s, tab: a.value }
    case 'togglePresence': return { ...s, presenceHidden: !s.presenceHidden }
    case 'createOpen': return { ...s, createOpen: a.value }
    case 'draft': return { ...s, drafts: { ...s.drafts, [a.key]: a.value } }
    case 'toast': return { ...s, toasts: [...s.toasts, a.toast] }
    case 'untoast': return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) }
    default: return s
  }
}

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const toast = useCallback((message) => {
    const id = Date.now()
    dispatch({ type: 'toast', toast: { id, message } })
    setTimeout(() => dispatch({ type: 'untoast', id }), 2500)
  }, [])
  return <Ctx.Provider value={{ state, dispatch, toast }}>{children}</Ctx.Provider>
}
