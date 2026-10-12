
import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Settings,
  MapPin,
  Pencil,
  X,
  Save,
  LogOut,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'

const API_BASE = 'http://127.0.0.1:8000'

export default function Profile() {
  const { state, dispatch } = useApp()
  const u = state.user || {}

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: u.name || '',
    college: u.college || '',
    course: u.course || '',
    year: u.year || '',
    bio: u.bio || '',
  })

  useEffect(() => {
    setForm({
      name: u.name || '',
      college: u.college || '',
      course: u.course || '',
      year: u.year || '',
      bio: u.bio || '',
    })
  }, [u.name, u.college, u.course, u.year, u.bio])

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function cancelEditing() {
    setForm({
      name: u.name || '',
      college: u.college || '',
      course: u.course || '',
      year: u.year || '',
      bio: u.bio || '',
    })

    setEditing(false)
    setError('')
    setMessage('')
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      if (!state.token) {
        throw new Error(
          'Your session has expired. Please log in again.'
        )
      }

      const name = form.name.trim()

      if (!name) {
        throw new Error('Please enter your name.')
      }

      const response = await fetch(`${API_BASE}/students/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name,
          college: form.college.trim() || null,
          course: form.course.trim() || null,
          year: form.year.trim() || null,
          bio: form.bio.trim() || null,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(', ')
          : data.detail

        throw new Error(
          detail || `Could not save profile (HTTP ${response.status}).`
        )
      }

      const updatedUser = {
        ...u,
        ...data,
      }

      dispatch({
        type: 'setUser',
        payload: updatedUser,
      })

      setForm({
        name: updatedUser.name || '',
        college: updatedUser.college || '',
        course: updatedUser.course || '',
        year: updatedUser.year || '',
        bio: updatedUser.bio || '',
      })

      setEditing(false)
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(
        err.message || 'Something went wrong while saving.'
      )
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    const confirmed = window.confirm(
      'Are you sure you want to log out of CampusX?'
    )

    if (!confirmed) return

    // AppContext handles clearing the saved token when state.token becomes null.
    dispatch({ type: 'logout' })
  }

  return (
    <div className="space-y-7">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
            CampusX
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-campus-black">
            My Profile
          </h2>
        </div>

        <button
          type="button"
          aria-label="Settings"
          className="grid h-10 w-10 place-items-center rounded-full bg-campus-gray transition hover:bg-campus-border active:scale-95"
        >
          <Settings size={19} />
        </button>
      </header>

      {message && (
        <p
          role="status"
          className="rounded-xl bg-campus-lime/30 p-3 text-sm font-semibold"
        >
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      <section className="rounded-campus border border-campus-border bg-white p-5 shadow-campus">
        <div className="flex items-start gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-campus-lime text-3xl font-extrabold text-campus-black">
            {(u.name || '?').charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xl font-extrabold text-campus-black">
              {u.name || 'Student'}
              <BadgeCheck
                size={18}
                className="text-campus-black"
                fill="#FFF3A3"
              />
            </p>

            <p className="mt-1 text-sm text-campus-muted">
              {u.course || 'Course not added'}
            </p>

            <p className="text-sm text-campus-muted">
              {[u.college, u.year ? `Year ${u.year}` : null]
                .filter(Boolean)
                .join(' · ') || 'Add your college and year'}
            </p>

            {!state.presenceHidden && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-campus-black">
                <span className="h-2 w-2 rounded-full bg-campus-lime" />
                Active now
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-campus-muted">
          <MapPin size={16} />
          <span>Campus community</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (editing) {
              cancelEditing()
            } else {
              setError('')
              setMessage('')
              setEditing(true)
            }
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-campus-black px-4 py-3 font-semibold text-white transition hover:opacity-90"
        >
          {editing ? <X size={17} /> : <Pencil size={17} />}
          {editing ? 'Cancel editing' : 'Edit profile'}
        </button>
      </section>

      {editing && (
        <form
          onSubmit={saveProfile}
          className="space-y-4 rounded-campus border border-campus-border bg-white p-5 shadow-campus"
        >
          <h3 className="text-lg font-extrabold text-campus-black">
            Edit your details
          </h3>

          <div className="space-y-1">
            <label htmlFor="profile-name" className="text-sm font-semibold">
              Full name
            </label>
            <input
              id="profile-name"
              name="name"
              value={form.name}
              onChange={updateField}
              required
              minLength={1}
              maxLength={100}
              className="w-full rounded-xl border border-campus-border px-3 py-2.5 outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="profile-college" className="text-sm font-semibold">
              College
            </label>
            <input
              id="profile-college"
              name="college"
              value={form.college}
              onChange={updateField}
              maxLength={150}
              className="w-full rounded-xl border border-campus-border px-3 py-2.5 outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="profile-course" className="text-sm font-semibold">
                Course
              </label>
              <input
                id="profile-course"
                name="course"
                value={form.course}
                onChange={updateField}
                maxLength={150}
                placeholder="e.g. BCA"
                className="w-full rounded-xl border border-campus-border px-3 py-2.5 outline-none focus:border-black"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="profile-year" className="text-sm font-semibold">
                Year
              </label>
              <input
                id="profile-year"
                name="year"
                type="number"
                min="1"
                max="10"
                value={form.year}
                onChange={updateField}
                className="w-full rounded-xl border border-campus-border px-3 py-2.5 outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="profile-bio" className="text-sm font-semibold">
              About you
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              value={form.bio}
              onChange={updateField}
              rows={4}
              maxLength={2000}
              placeholder="Tell other students about yourself..."
              className="w-full resize-y rounded-xl border border-campus-border px-3 py-2.5 outline-none focus:border-black"
            />
            <p className="text-right text-xs text-campus-muted">
              {form.bio.length}/2000
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-campus-lime px-4 py-3 font-bold text-campus-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      )}

      <section>
        <p className="mb-2 text-sm font-bold text-campus-black">
          About
        </p>
        <p className="text-sm leading-6 text-campus-muted">
          {u.bio || 'No bio added yet.'}
        </p>
      </section>

      <section>
        <p className="mb-3 text-sm font-bold text-campus-black">
          Interests & skills
        </p>
        <div className="flex flex-wrap gap-2">
          {u.tags?.length ? (
            u.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-campus-border bg-campus-gray px-3 py-1.5 text-sm font-medium text-campus-black"
              >
                {tag}
              </span>
            ))
          ) : (
            <p className="text-sm text-campus-muted">
              Skills and interests have not been added yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-campus bg-campus-yellow p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-campus-black/60">
              CampusX progress
            </p>
            <p className="mt-1 text-2xl font-extrabold text-campus-black">
              {u.xp ?? 0} XP
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg font-extrabold">
            XP
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {u.badges?.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-campus-black"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-campus border border-campus-border bg-white p-4">
        <div className="flex min-h-[44px] items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-campus-black">
              Hide presence
            </p>
            <p className="mt-0.5 text-xs text-campus-muted">
              Hide your active status from other students
            </p>
          </div>

          <input
            type="checkbox"
            checked={Boolean(state.presenceHidden)}
            onChange={() => dispatch({ type: 'togglePresence' })}
            aria-label="Hide presence"
            className="h-5 w-5 accent-black"
          />
        </div>
      </section>

      {/* Log out */}
      <section className="rounded-campus border border-red-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="font-bold text-campus-black">
            Account
          </h3>
          <p className="mt-1 text-sm text-campus-muted">
            Log out of your CampusX account on this device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700 transition hover:bg-red-100 active:scale-[0.99]"
        >
          <LogOut size={18} />
          Log out
        </button>
      </section>
    </div>
  )
}