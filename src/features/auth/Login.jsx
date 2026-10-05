import { useState } from 'react'
import Button from '../../components/ui/Button'
import { useApp } from '../../store/AppContext'
export default function Login() {
  const { dispatch } = useApp()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter your college email, like you@college.edu.')
    if (f.password.length < 6) return setErr('Password needs at least 6 characters.')
    dispatch({ type: 'stage', value: 'app' })
  }
  const field = 'min-h-[44px] w-full rounded-2xl border border-gold/20 bg-maroon/20 px-4 outline-none focus:border-gold'
  return (
    <form onSubmit={submit} className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h2 className="text-3xl font-extrabold text-gold">Welcome back</h2>
      <input aria-label="College email" className={field} placeholder="College email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
      <input aria-label="Password" type="password" className={field} placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
      {err && <p role="alert" className="text-sm text-gold">{err}</p>}
      <Button type="submit">Log in</Button>
      <p className="text-center text-xs text-cream/50">We verify college emails to keep CampusX safe and students-only. Nothing else is collected.</p>
    </form>
  )
}
