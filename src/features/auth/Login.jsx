
import { useState } from 'react'
import Button from '../../components/ui/Button'
import { useApp } from '../../store/AppContext'

const API_URL = 'http://127.0.0.1:8000'

export default function Login() {
  const { dispatch } = useApp()

  const [f, setF] = useState({
    email: '',
    password: '',
  })

  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')

    const email = f.email.trim().toLowerCase()

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Enter a valid email address.')
      return
    }

    if (!f.password) {
      setErr('Enter your password.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          password: f.password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Incorrect email or password.')
        }

        if (response.status === 422) {
          throw new Error('Please check your email and password.')
        }

        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Login failed. Please try again.'
        )
      }

      if (!data.access_token || !data.user) {
        throw new Error('The server returned an unexpected response.')
      }

      
      const profileResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: 'application/json',
        },
      })

      const fullUser = await profileResponse.json().catch(() => ({}))

      if (!profileResponse.ok) {
        throw new Error(
          typeof fullUser.detail === 'string'
            ? fullUser.detail
            : 'Login succeeded, but your profile could not be loaded. Please try again.'
        )
      }

      dispatch({
        type: 'loginSuccess',
        user: fullUser,
        token: data.access_token,
      })

      dispatch({
        type: 'stage',
        value: 'app',
      })
      
    } catch (error) {
      if (error instanceof TypeError) {
        setErr(
          'Cannot connect to CampusX server. Make sure FastAPI is running.'
        )
      } else {
        setErr(error.message || 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const field =
    'min-h-[44px] w-full rounded-2xl border border-campus-border bg-white px-4 text-campus-black outline-none transition focus:border-campus-black'

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-6"
    >
      <div className="mb-2">
        <p className="mb-2 text-sm font-bold text-campus-muted">
          Welcome to CampusX
        </p>

        <h2 className="text-3xl font-extrabold text-campus-black">
          Welcome back
        </h2>

        <p className="mt-2 text-sm text-campus-muted">
          Log in to connect with your campus community.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Email address
        <input
          className={field}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={f.email}
          onChange={(e) =>
            setF({ ...f, email: e.target.value })
          }
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Password
        <input
          className={field}
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={f.password}
          onChange={(e) =>
            setF({ ...f, password: e.target.value })
          }
          required
        />
      </label>

      {err && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 p-3 text-sm text-red-700"
        >
          {err}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Log in'}
      </Button>

      <p className="text-center text-sm text-campus-muted">
        New to CampusX?{' '}
        <button
          type="button"
          className="font-bold text-campus-black underline"
          onClick={() => dispatch({ type: 'stage', value: 'register' })}
        >
          Create account
        </button>
      </p>

      <p className="text-center text-xs text-campus-muted">
        Your account details are stored by the CampusX backend.
      </p>
    </form>
  )
}