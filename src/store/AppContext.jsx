import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  currentUser,
  resaleItems as initialResaleItems,
} from '../data/mock'

const API_BASE = 'http://127.0.0.1:8000'
const TOKEN_KEY = 'campusx_token'

function getSavedToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

const initial = {
  stage: 'splash',
  tab: 'home',
  token: null,
  user: currentUser,
  presenceHidden: false,
  createOpen: false,
  toasts: [],
  drafts: {},
  resaleItems: initialResaleItems,
  createdEvents: [],
  studyConnections: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'stage':
      return {
        ...state,
        stage: action.value,
      }

    case 'tab':
      return {
        ...state,
        tab: action.value,
      }

    case 'loginSuccess':
      return {
        ...state,
        user: action.user,
        token: action.token,
        stage: 'app',
      }

    case 'restoreSession':
      return {
        ...state,
        user: action.user,
        token: action.token,
        stage: 'app',
      }

    case 'setUser':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      }

    case 'logout':
      return {
        ...state,
        token: null,
        user: currentUser,
        stage: 'login',
        tab: 'home',
        createOpen: false,
      }

    case 'togglePresence':
      return {
        ...state,
        presenceHidden: !state.presenceHidden,
      }

    case 'createOpen':
      return {
        ...state,
        createOpen: action.value,
      }

    case 'draft':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.key]: action.value,
        },
      }

    case 'toast':
      return {
        ...state,
        toasts: [
          ...state.toasts,
          action.toast,
        ],
      }

    case 'untoast':
      return {
        ...state,
        toasts: state.toasts.filter(
          (toast) => toast.id !== action.id
        ),
      }

    case 'addResaleItem':
      return {
        ...state,
        resaleItems: [
          action.item,
          ...state.resaleItems,
        ],
      }

    case 'removeResaleItem':
      return {
        ...state,
        resaleItems: state.resaleItems.filter(
          (item) => item.id !== action.id
        ),
      }

    case 'addEvent':
      return {
        ...state,
        createdEvents: [
          action.event,
          ...state.createdEvents,
        ],
      }

    case 'connectStudyBuddy':
      return {
        ...state,
        studyConnections: [
          ...state.studyConnections,
          action.studentId,
        ],
      }

    case 'disconnectStudyBuddy':
      return {
        ...state,
        studyConnections: state.studyConnections.filter(
          (id) => id !== action.studentId
        ),
      }

    default:
      return state
  }
}

const Ctx = createContext(null)

export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    initial
  )

  const [sessionChecked, setSessionChecked] = useState(false)

  // Restore and verify an existing session when the app opens.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = getSavedToken()

      if (!token) {
        setSessionChecked(true)
        return
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem(TOKEN_KEY)

          if (!cancelled) {
            dispatch({ type: 'logout' })
          }

          return
        }

        if (!response.ok) {
          throw new Error('Could not verify the saved session.')
        }

        const user = await response.json()

        if (!cancelled) {
          dispatch({
            type: 'restoreSession',
            user,
            token,
          })
        }
      } catch (error) {
        // Keep the saved token if the server is temporarily unavailable.
        console.error('Session restoration failed:', error)
      } finally {
        if (!cancelled) {
          setSessionChecked(true)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  // Save newly issued tokens and remove tokens on logout.
  useEffect(() => {
    try {
      if (state.token) {
        sessionStorage.setItem(TOKEN_KEY, state.token)
      } else {
        sessionStorage.removeItem(TOKEN_KEY)
      }
    } catch (error) {
      console.error('Could not save the login session:', error)
    }
  }, [state.token])

  const toast = useCallback((message) => {
    const id = Date.now()

    dispatch({
      type: 'toast',
      toast: {
        id,
        message,
      },
    })

    setTimeout(() => {
      dispatch({
        type: 'untoast',
        id,
      })
    }, 2500)
  }, [])

  // Avoid showing the login screen while a saved session is being checked.
  if (!sessionChecked) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <p className="text-sm font-medium text-gray-500">
          Restoring your CampusX session...
        </p>
      </div>
    )
  }

  return (
    <Ctx.Provider
      value={{
        state,
        dispatch,
        toast,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

