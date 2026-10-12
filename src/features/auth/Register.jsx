
import { useState } from 'react'
import Button from '../../components/ui/Button'
import { useApp } from '../../store/AppContext'

const API_URL = 'http://127.0.0.1:8000'

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  college: '',
  course: '',
  year: '',
}

export default function Register() {
  const { dispatch, toast } = useApp()

  const [f, setF] = useState(initialForm)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setF((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')

    const name = f.name.trim()
    const email = f.email.trim().toLowerCase()

    if (!name) {
      setErr('Please enter your name.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Please enter a valid email address.')
      return
    }

    if (f.password.length < 6) {
      setErr('Your password must contain at least 6 characters.')
      return
    }

    if (f.password !== f.confirmPassword) {
      setErr('The passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password: f.password,
          college: f.college.trim() || null,
          course: f.course.trim() || null,
          year: f.year || null,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(
            typeof data.detail === 'string'
              ? data.detail
              : 'This email may already be registered.'
          )
        }

        if (response.status === 422) {
          throw new Error(
            'Some details are invalid. Please check your entries.'
          )
        }

        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Account creation failed. Please try again.'
        )
      }

      toast('Account created! You can now log in.')

      dispatch({
        type: 'stage',
        value: 'login',
      })
    } catch (error) {
      if (error instanceof TypeError) {
        setErr(
          'Cannot connect to CampusX. Make sure the backend is running.'
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
          Join your campus community
        </p>

        <h2 className="text-3xl font-extrabold text-campus-black">
          Create account
        </h2>

        <p className="mt-2 text-sm text-campus-muted">
          Make your CampusX student profile.
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Full name
        <input
          className={field}
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={f.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Email address
        <input
          className={field}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={f.email}
          onChange={(e) => updateField('email', e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Password
        <input
          className={field}
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={f.password}
          onChange={(e) => updateField('password', e.target.value)}
          minLength={6}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Confirm password
        <input
          className={field}
          type="password"
          autoComplete="new-password"
          placeholder="Enter password again"
          value={f.confirmPassword}
          onChange={(e) =>
            updateField('confirmPassword', e.target.value)
          }
          minLength={6}
          required
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        College <span className="font-normal text-campus-muted">(optional)</span>
        <input
          className={field}
          type="text"
          autoComplete="organization"
          placeholder="Your college"
          value={f.college}
          onChange={(e) => updateField('college', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Course <span className="font-normal text-campus-muted">(optional)</span>
        <input
          className={field}
          type="text"
          placeholder="e.g. BCA"
          value={f.course}
          onChange={(e) => updateField('course', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold">
        Study year <span className="font-normal text-campus-muted">(optional)</span>
        <select
          className={field}
          value={f.year}
          onChange={(e) => updateField('year', e.target.value)}
        >
          <option value="">Select your year</option>
          <option value="1">1st year</option>
          <option value="2">2nd year</option>
          <option value="3">3rd year</option>
          <option value="4">4th year</option>
          <option value="5">5th year or above</option>
        </select>
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
        {loading ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-campus-muted">
        Already have an account?{' '}
        <button
          type="button"
          className="font-bold text-campus-black underline"
          onClick={() => dispatch({ type: 'stage', value: 'login' })}
        >
          Log in
        </button>
      </p>
    </form>
  )
}