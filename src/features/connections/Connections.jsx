import { useCallback, useEffect, useState } from 'react'
import {
  Users,
  UserCheck,
  UserPlus,
  Check,
  X,
  RefreshCw,
  GraduationCap,
} from 'lucide-react'
import { useApp } from '../../store/AppContext'

const API_BASE = 'http://127.0.0.1:8000'

function StudentCard({ student, actions }) {
  const name = student?.name || 'CampusX student'

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <article className="rounded-2xl border border-campus-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-campus-yellow text-lg font-extrabold text-campus-black">
          {initials || '?'}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words font-bold text-campus-black">
            {name}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-campus-muted">
            <GraduationCap size={15} />
            {[
              student?.course,
              student?.year ? `Year ${student.year}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Course not added'}
          </p>

          {student?.college && (
            <p className="mt-1 break-words text-sm text-campus-muted">
              {student.college}
            </p>
          )}

          {student?.bio && (
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-5 text-campus-muted">
              {student.bio}
            </p>
          )}

          {student?.status && (
            <span className="mt-2 inline-block rounded-full bg-campus-gray px-2.5 py-1 text-xs font-semibold text-campus-black">
              {student.status}
            </span>
          )}
        </div>
      </div>

      {actions && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </article>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-campus-border px-5 py-10 text-center">
      <Users size={30} className="mx-auto text-campus-muted" />

      <h3 className="mt-3 font-bold text-campus-black">
        {title}
      </h3>

      <p className="mt-1 text-sm text-campus-muted">
        {description}
      </p>
    </div>
  )
}

export default function Connections() {
  const { state, toast } = useApp()

  const [activeTab, setActiveTab] = useState('received')
  const [incoming, setIncoming] = useState([])
  const [sent, setSent] = useState([])
  const [accepted, setAccepted] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const request = useCallback(
    async (path, options = {}) => {
      if (!state.token) {
        throw new Error('Please log in to view your connections.')
      }

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${state.token}`,
          ...(options.body
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...options.headers,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(', ')
          : data.detail

        throw new Error(
          detail || `Request failed (HTTP ${response.status}).`
        )
      }

      return data
    },
    [state.token]
  )

  const loadConnections = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        incomingData,
        sentData,
        acceptedData,
        studentsData,
      ] = await Promise.all([
        request('/connections/requests'),
        request('/connections/sent'),
        request('/connections/accepted'),
        request('/students'),
      ])

      setIncoming(
        Array.isArray(incomingData) ? incomingData : []
      )

      setSent(
        Array.isArray(sentData) ? sentData : []
      )

      setAccepted(
        Array.isArray(acceptedData) ? acceptedData : []
      )

      setStudents(
        Array.isArray(studentsData) ? studentsData : []
      )
    } catch (err) {
      setError(err.message || 'Could not load connections.')
    } finally {
      setLoading(false)
    }
  }, [request])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  async function handleAction(requestId, action) {
    setBusyId(requestId)
    setError('')

    try {
      await request(`/connections/${requestId}/${action}`, {
        method: 'POST',
      })

      toast(
        action === 'accept'
          ? 'Connection request accepted.'
          : 'Connection request declined.'
      )

      await loadConnections()
    } catch (err) {
      setError(
        err.message || 'The action could not be completed.'
      )
    } finally {
      setBusyId(null)
    }
  }

  const studentsById = Object.fromEntries(
    students.map((student) => [student.id, student])
  )

  const tabs = [
    {
      id: 'received',
      label: 'Received',
      count: incoming.length,
    },
    {
      id: 'sent',
      label: 'Sent',
      count: sent.length,
    },
    {
      id: 'accepted',
      label: 'Connected',
      count: accepted.length,
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
            CampusX community
          </p>

          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-campus-black">
            Connections
          </h2>

          <p className="mt-2 text-sm text-campus-muted">
            Build your campus network, one connection at a time.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConnections}
          disabled={loading}
          aria-label="Refresh connections"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-campus-gray transition hover:bg-campus-border disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={loading ? 'animate-spin' : ''}
          />
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-campus-yellow p-3">
          <UserPlus size={19} />

          <p className="mt-2 text-xl font-extrabold">
            {incoming.length}
          </p>

          <p className="text-xs font-medium">
            Received
          </p>
        </div>

        <div className="rounded-xl bg-campus-lime p-3">
          <Users size={19} />

          <p className="mt-2 text-xl font-extrabold">
            {accepted.length}
          </p>

          <p className="text-xs font-medium">
            Connected
          </p>
        </div>

        <div className="rounded-xl bg-campus-gray p-3">
          <UserCheck size={19} />

          <p className="mt-2 text-xl font-extrabold">
            {sent.filter((item) => item.status === 'pending').length}
          </p>

          <p className="text-xs font-medium">
            Pending sent
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 rounded-xl bg-campus-gray p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-white text-campus-black shadow-sm'
                : 'text-campus-muted hover:text-campus-black'
            }`}
          >
            <span>{tab.label}</span>
            <span className="ml-1.5 text-xs">
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}

          {!state.token && (
            <p className="mt-1">
              Log in through CampusX, then open Connections again.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-campus-gray"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'received' && (
            incoming.length ? (
              incoming.map((item) => (
                <StudentCard
                  key={item.id}
                  student={
                    item.sender || {
                      name: `Student #${item.sender_id}`,
                    }
                  }
                  actions={
                    <>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          handleAction(item.id, 'accept')
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-campus-lime px-3 py-2.5 text-sm font-bold text-campus-black disabled:opacity-50"
                      >
                        <Check size={16} />
                        Accept
                      </button>

                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          handleAction(item.id, 'decline')
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-campus-border px-3 py-2.5 text-sm font-semibold text-campus-black disabled:opacity-50"
                      >
                        <X size={16} />
                        Decline
                      </button>
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No incoming requests"
                description="When another student sends you a request, it will appear here."
              />
            )
          )}

          {activeTab === 'sent' && (
            sent.length ? (
              sent.map((item) => {
                const receiver =
                  studentsById[item.receiver_id] || {
                    name: `Student #${item.receiver_id}`,
                  }

                return (
                  <StudentCard
                    key={item.id}
                    student={{
                      ...receiver,
                      status: item.status
                        ? `Status: ${item.status}`
                        : undefined,
                    }}
                  />
                )
              })
            ) : (
              <EmptyState
                title="No sent requests"
                description="Visit Discover to find students and send connection requests."
              />
            )
          )}

          {activeTab === 'accepted' && (
            accepted.length ? (
              accepted.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                />
              ))
            ) : (
              <EmptyState
                title="No connections yet"
                description="Accept requests or connect with students from Discover to build your network."
              />
            )
          )}
        </div>
      )}
    </div>
  )
}