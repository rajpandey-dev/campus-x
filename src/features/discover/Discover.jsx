
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  MessageCircle,
  Search,
  X,
} from 'lucide-react'

import Chip from '../../components/ui/Chip'
import Skeleton from '../../components/ui/Skeleton'
import StudentProfile from '../profile/StudentProfile'

import {
  events,
  skillSwaps,
  resaleItems as initialResaleItems,
} from '../../data/mock'

import { useApp } from '../../store/AppContext'

const API_URL = 'http://127.0.0.1:8000'

const CATS = ['Study Buddy', 'Skill Swap', 'Events', 'Resale', 'Find Items']
const TOPICS = ['All', 'Programming', 'Math', 'Design', 'Music', 'Business']

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session expired. Please log in again.')
    }

    throw new Error(
      data?.detail || `Request failed (HTTP ${response.status}).`
    )
  }

  return data
}

export default function Discover() {
  const { state, toast } = useApp()

  const [cat, setCat] = useState('Study Buddy')
  const [topic, setTopic] = useState('All')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const [registeredEvents, setRegisteredEvents] = useState([])
  const [persistentEvents, setPersistentEvents] = useState([])
  const [eventLoading, setEventLoading] = useState(false)
  const [eventActionLoading, setEventActionLoading] = useState({})
  const [applicantPanels, setApplicantPanels] = useState({})
  const [eventApplicants, setEventApplicants] = useState({})
  const [connectedSkills, setConnectedSkills] = useState([])
  const [contactedItems, setContactedItems] = useState([])

  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState('')

  // Real connection data from the backend.
  const [sentRequests, setSentRequests] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [acceptedConnections, setAcceptedConnections] = useState([])
  const [connectionLoading, setConnectionLoading] = useState({})

  const allResaleItems = state.resaleItems || initialResaleItems
  const allEvents = [
    ...persistentEvents,
    ...(state.createdEvents || []),
    ...events,
  ]

  /*
   * Load students, sent requests, incoming requests,
   * and accepted connections from the backend.
   */
  useEffect(() => {
    const token = state.token

    if (!token) {
      setStudents([])
      setSentRequests([])
      setIncomingRequests([])
      setAcceptedConnections([])
      setStudentsLoading(false)
      setStudentsError('Please log in to discover other students.')
      return
    }

    const controller = new AbortController()

    async function loadData() {
      setStudentsLoading(true)
      setStudentsError('')

      try {
        const params = new URLSearchParams()
        const searchText = query.trim().slice(0, 100)

        if (searchText) {
          params.set('q', searchText)
        }

        const studentPath = params.size
          ? `/students?${params.toString()}`
          : '/students'

        const [
          studentData,
          sentData,
          incomingData,
          acceptedData,
        ] = await Promise.all([
          apiRequest(studentPath, token, {
            signal: controller.signal,
          }),
          apiRequest('/connections/sent', token, {
            signal: controller.signal,
          }),
          apiRequest('/connections/requests', token, {
            signal: controller.signal,
          }),
          apiRequest('/connections/accepted', token, {
            signal: controller.signal,
          }),
        ])

        if (
          !Array.isArray(studentData) ||
          !Array.isArray(sentData) ||
          !Array.isArray(incomingData) ||
          !Array.isArray(acceptedData)
        ) {
          throw new Error('The server returned an unexpected response.')
        }

        if (controller.signal.aborted) return

        setStudents(studentData)
        setSentRequests(sentData)
        setIncomingRequests(incomingData)
        setAcceptedConnections(acceptedData)
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('Failed to load Discover data:', error)

        if (!controller.signal.aborted) {
          setStudentsError(
            error.message || 'Could not connect to the CampusX server.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setStudentsLoading(false)
        }
      }
    }

    loadData()

    return () => controller.abort()
  }, [state.token, query])

  const search = query.trim().toLowerCase()

  const filteredMatches = students

  const filteredSkills = useMemo(() => {
    let result = skillSwaps

    if (topic !== 'All') {
      result = result.filter((item) =>
        [item.skill, item.teaches, item.wants]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(topic.toLowerCase())
      )
    }

    if (search) {
      result = result.filter((item) =>
        [item.name, item.skill, item.teaches, item.wants, item.level]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search)
      )
    }

    return result
  }, [topic, search])

  const filteredResaleItems = useMemo(() => {
    if (!search) return allResaleItems

    return allResaleItems.filter((item) =>
      [
        item.title,
        item.seller,
        item.category,
        item.condition,
        item.location,
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [allResaleItems, search])

  const filteredEvents = useMemo(() => {
    if (!search) return allEvents

    return allEvents.filter((event) =>
      [
        event.title,
        event.when,
        event.venue,
        event.description,
        event.createdBy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [allEvents, search])

  const searchPlaceholder =
    cat === 'Resale'
      ? 'Search marketplace...'
      : cat === 'Events'
        ? 'Search events...'
        : cat === 'Skill Swap'
          ? 'Search skills...'
          : 'Search students...'

  /*
   * Refresh all connection data after sending,
   * accepting, or declining a request.
   */
  async function refreshConnections() {
    if (!state.token) return

    const [sentData, incomingData, acceptedData] = await Promise.all([
      apiRequest('/connections/sent', state.token),
      apiRequest('/connections/requests', state.token),
      apiRequest('/connections/accepted', state.token),
    ])

    if (
      !Array.isArray(sentData) ||
      !Array.isArray(incomingData) ||
      !Array.isArray(acceptedData)
    ) {
      throw new Error('The server returned unexpected connection data.')
    }

    setSentRequests(sentData)
    setIncomingRequests(incomingData)
    setAcceptedConnections(acceptedData)
  }

  /*
   * Support either a sender_id field or a nested sender object.
   */
  function getRequestSenderId(request) {
    return request.sender_id ?? request.sender?.id
  }

  /*
   * Determine the current connection status using backend data.
   */
  function getConnectionStatus(student) {
    const studentId = Number(student.id)

    const outgoing = sentRequests.find(
      (request) => Number(request.receiver_id) === studentId
    )

    if (outgoing?.status === 'accepted') return 'connected'
    if (outgoing?.status === 'pending') return 'sent'

    const incoming = incomingRequests.find(
      (request) =>
        Number(getRequestSenderId(request)) === studentId &&
        request.status === 'pending'
    )

    if (incoming) return 'received'

    const isAccepted = acceptedConnections.some(
      (connection) => Number(connection.id) === studentId
    )

    if (isAccepted) return 'connected'

    return 'none'
  }

  function getIncomingRequest(studentId) {
    return incomingRequests.find(
      (request) =>
        Number(getRequestSenderId(request)) === Number(studentId) &&
        request.status === 'pending'
    )
  }

  /*
   * Send a real connection request to FastAPI.
   */
  async function sendConnectionRequest(student) {
    if (!state.token) {
      toast('Please log in to connect with students.')
      return
    }

    const status = getConnectionStatus(student)

    if (status !== 'none') return

    setConnectionLoading((previous) => ({
      ...previous,
      [student.id]: true,
    }))

    try {
      await apiRequest('/connections/request', state.token, {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: student.id,
        }),
      })

      await refreshConnections()
      toast(`Connection request sent to ${student.name}.`)
    } catch (error) {
      console.error('Sending connection request failed:', error)

      // Refresh after an error in case a request already exists.
      try {
        await refreshConnections()
      } catch (refreshError) {
        console.error('Could not refresh connection data:', refreshError)
      }

      toast(error.message || 'Could not send the connection request.')
    } finally {
      setConnectionLoading((previous) => ({
        ...previous,
        [student.id]: false,
      }))
    }
  }

  /*
   * Accept or decline an incoming connection request.
   */
  async function respondToRequest(student, action) {
    if (!state.token) {
      toast('Please log in again.')
      return
    }

    const request = getIncomingRequest(student.id)

    if (!request) {
      toast('This request is no longer pending. Refresh and try again.')
      return
    }

    setConnectionLoading((previous) => ({
      ...previous,
      [student.id]: true,
    }))

    try {
      await apiRequest(
        `/connections/${request.id}/${action}`,
        state.token,
        { method: 'POST' }
      )

      if (action === 'accept') {
        toast(`You are now connected with ${student.name}.`)
      } else {
        toast(`Request from ${student.name} declined.`)
      }

      // Reload connection status from the backend.
      await refreshConnections()
    } catch (error) {
      console.error(`Connection ${action} failed:`, error)
      toast(error.message || 'Could not update the connection request.')
    } finally {
      setConnectionLoading((previous) => ({
        ...previous,
        [student.id]: false,
      }))
    }
  }

  /*
   * Load persistent events and registration status from the API.
   */
  const refreshEvents = async () => {
    if (!state.token) {
      setPersistentEvents([])
      return
    }

    setEventLoading(true)
    try {
      const data = await apiRequest('/events/', state.token)
      if (!Array.isArray(data)) {
        throw new Error('Unexpected events response from server.')
      }

      setPersistentEvents(data.map((event) => ({
        ...event,
        isPersistent: true,
        when: event.when || `${event.event_date} · ${event.event_time}`,
        going: 0,
        createdBy:
          Number(event.creator_id) === Number(state.user?.id)
            ? (state.user?.name || 'You')
            : 'Campus student',
      })))
    } catch (error) {
      console.error('Loading events failed:', error)
      toast(error.message || 'Could not load campus events.')
    } finally {
      setEventLoading(false)
    }
  }

  useEffect(() => {
    refreshEvents()
  }, [state.token, state.user?.id])

  /*
   * Persistent events use the API. Mock events retain demo behavior.
   */
  const toggleEventRegistration = async (event) => {
    if (!event.isPersistent) {
      setRegisteredEvents((previous) => {
        if (previous.includes(event.id)) {
          toast('Demo registration removed')
          return previous.filter((id) => id !== event.id)
        }

        toast('Demo registration saved locally')
        return [...previous, event.id]
      })
      return
    }

    if (!state.token) {
      toast('Please log in to request to join.')
      return
    }

    if (event.registration_status) {
      toast(`Your request is already ${event.registration_status}.`)
      return
    }

    setEventActionLoading((previous) => ({
      ...previous,
      [`join-${event.id}`]: true,
    }))

    try {
      await apiRequest(`/events/${event.id}/register`, state.token, {
        method: 'POST',
      })
      toast('Join request sent. Status: pending.')
      await refreshEvents()
    } catch (error) {
      toast(error.message || 'Could not send join request.')
      await refreshEvents()
    } finally {
      setEventActionLoading((previous) => ({
        ...previous,
        [`join-${event.id}`]: false,
      }))
    }
  }

  const toggleApplicants = async (event) => {
    const isOpen = Boolean(applicantPanels[event.id])
    setApplicantPanels((previous) => ({
      ...previous,
      [event.id]: !isOpen,
    }))

    if (isOpen || !state.token) return

    setEventActionLoading((previous) => ({
      ...previous,
      [`applicants-${event.id}`]: true,
    }))

    try {
      const data = await apiRequest(
        `/events/${event.id}/applicants`,
        state.token
      )
      setEventApplicants((previous) => ({
        ...previous,
        [event.id]: data,
      }))
    } catch (error) {
      toast(error.message || 'Could not load applicants.')
      setApplicantPanels((previous) => ({
        ...previous,
        [event.id]: false,
      }))
    } finally {
      setEventActionLoading((previous) => ({
        ...previous,
        [`applicants-${event.id}`]: false,
      }))
    }
  }

  const reviewApplicant = async (event, registration, action) => {
    const key = `review-${registration.id}`
    setEventActionLoading((previous) => ({ ...previous, [key]: true }))

    try {
      await apiRequest(
        `/events/${event.id}/applicants/${registration.id}/${action}`,
        state.token,
        { method: 'POST' }
      )

      setEventApplicants((previous) => ({
        ...previous,
        [event.id]: (previous[event.id] || []).map((item) =>
          item.id === registration.id
            ? { ...item, status: action === 'accept' ? 'accepted' : 'denied' }
            : item
        ),
      }))

      toast(action === 'accept' ? 'Applicant accepted.' : 'Applicant denied.')
      await refreshEvents()
    } catch (error) {
      toast(error.message || 'Could not review applicant.')
    } finally {
      setEventActionLoading((previous) => ({ ...previous, [key]: false }))
    }
  }

  /*
   * Skill Swap connections: local demo behavior for now.
   */
  const toggleSkillConnection = (skillId) => {
    setConnectedSkills((previous) => {
      if (previous.includes(skillId)) {
        toast('Connection removed')
        return previous.filter((id) => id !== skillId)
      }

      toast('Connection request sent')
      return [...previous, skillId]
    })
  }

  const contactSeller = (item) => {
    setContactedItems((previous) =>
      previous.includes(item.id) ? previous : [...previous, item.id]
    )

    toast(`Message sent to ${item.seller}`)
  }

  /*
   * ITEM DETAIL
   */
  if (selectedItem) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-2 text-sm font-semibold text-campus-muted hover:text-campus-black"
        >
          <ArrowLeft size={18} />
          Back to Resale
        </button>

        <div className="overflow-hidden rounded-campus-lg border border-campus-border bg-white shadow-campus">
          <div className="aspect-[4/3] w-full bg-campus-gray">
            {selectedItem.image ? (
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-7xl">
                {selectedItem.emoji || '📦'}
              </div>
            )}
          </div>

          <div className="space-y-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold">
                  {selectedItem.title}
                </h1>
                <p className="mt-1 text-sm text-campus-muted">
                  {selectedItem.category || 'Marketplace'}
                </p>
              </div>
              <p className="shrink-0 text-xl font-extrabold">
                ₹{selectedItem.price}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-campus-lime px-3 py-1 text-xs font-semibold">
                {selectedItem.condition}
              </span>

              {selectedItem.category && (
                <span className="rounded-full bg-campus-yellow px-3 py-1 text-xs font-semibold">
                  {selectedItem.category}
                </span>
              )}
            </div>

            {selectedItem.description && (
              <div>
                <h2 className="font-bold">Description</h2>
                <p className="mt-2 text-sm leading-6 text-campus-muted">
                  {selectedItem.description}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={17} />
                <span>{selectedItem.location}</span>
              </div>

              <div className="text-sm text-campus-muted">
                Seller: {selectedItem.seller}
              </div>
            </div>

            <button
              type="button"
              onClick={() => contactSeller(selectedItem)}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-campus-black px-5 font-semibold text-white transition hover:bg-campus-dark active:scale-95"
            >
              <MessageCircle size={18} />
              {contactedItems.includes(selectedItem.id)
                ? 'Message Sent'
                : 'Message Seller'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /*
   * STUDENT PROFILE
   */
  if (selectedStudent) {
    return (
      <StudentProfile
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-campus-muted">Explore</p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Discover
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchOpen((previous) => !previous)
            if (searchOpen) setQuery('')
          }}
          className="grid h-11 w-11 place-items-center rounded-full border border-campus-border bg-white transition hover:bg-campus-gray"
          aria-label="Search"
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>

      {/* SEARCH */}
      {searchOpen && (
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-campus-muted"
          />

          <input
            autoFocus
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-12 w-full rounded-full border border-campus-border bg-white pl-11 pr-11 text-sm outline-none focus:border-campus-black"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full hover:bg-campus-gray"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* CATEGORIES */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {CATS.map((item) => (
          <Chip
            key={item}
            active={cat === item}
            onClick={() => {
              setCat(item)
              setQuery('')
            }}
          >
            {item}
          </Chip>
        ))}
      </div>

      {/* TOPICS */}
      {cat === 'Skill Swap' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TOPICS.map((item) => (
            <Chip
              key={item}
              active={topic === item}
              onClick={() => setTopic(item)}
            >
              {item}
            </Chip>
          ))}
        </div>
      )}

      {/* STUDY BUDDY */}
      {cat === 'Study Buddy' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Study Buddies</h2>
            <span className="text-xs text-campus-muted">
              {studentsLoading
                ? 'Loading...'
                : `${filteredMatches.length} matches`}
            </span>
          </div>

          {studentsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : studentsError ? (
            <EmptyState
              title="Couldn't load students"
              text={studentsError}
            />
          ) : filteredMatches.length === 0 ? (
            <EmptyState
              title="No students found"
              text={
                search
                  ? 'Try another name, college or course.'
                  : 'Other registered students will appear here when they join CampusX.'
              }
            />
          ) : (
            filteredMatches.map((student) => {
              const status = getConnectionStatus(student)
              const busy = Boolean(connectionLoading[student.id])

              const studentDetails = [
                student.college,
                student.course,
                student.year ? `Year ${student.year}` : null,
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <div
                  key={student.id}
                  className="rounded-campus border border-campus-border bg-white p-4 shadow-sm transition hover:shadow-campus"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-campus-yellow text-lg font-bold">
                        {student.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {student.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-campus-muted">
                          {studentDetails ||
                            student.common ||
                            'CampusX student'}
                        </p>

                        {student.bio && (
                          <p className="mt-1 line-clamp-2 text-xs text-campus-muted">
                            {student.bio}
                          </p>
                        )}
                      </div>
                    </button>

                    <ArrowUpRight
                      size={19}
                      className="shrink-0 text-campus-muted"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {status === 'none' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendConnectionRequest(student)}
                        className="min-h-[42px] w-full rounded-full bg-campus-black px-4 text-sm font-semibold text-white transition hover:bg-campus-dark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? 'Sending...' : 'Connect'}
                      </button>
                    )}

                    {status === 'sent' && (
                      <button
                        type="button"
                        disabled
                        className="min-h-[42px] w-full rounded-full bg-campus-lime px-4 text-sm font-semibold text-campus-black disabled:opacity-80"
                      >
                        Request Sent
                      </button>
                    )}

                    {status === 'connected' && (
                      <button
                        type="button"
                        disabled
                        className="min-h-[42px] w-full rounded-full border border-campus-border bg-campus-gray px-4 text-sm font-semibold text-campus-black"
                      >
                        Connected
                      </button>
                    )}

                    {status === 'received' && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => respondToRequest(student, 'accept')}
                          className="min-h-[42px] w-full rounded-full bg-campus-lime px-4 text-sm font-semibold text-campus-black disabled:opacity-60"
                        >
                          {busy ? 'Please wait...' : 'Accept Request'}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => respondToRequest(student, 'decline')}
                          className="min-h-[42px] w-full rounded-full border border-campus-border px-4 text-sm font-semibold text-campus-black transition hover:bg-campus-gray disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {/* SKILL SWAP */}
      {cat === 'Skill Swap' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Skill Exchange</h2>
            <span className="text-xs text-campus-muted">
              {filteredSkills.length} available
            </span>
          </div>

          {filteredSkills.length === 0 ? (
            <EmptyState
              title="No skills found"
              text="Try another skill or topic."
            />
          ) : (
            filteredSkills.map((item) => (
              <div
                key={item.id}
                className="rounded-campus border border-campus-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-campus-lime font-bold">
                      {item.name.charAt(0)}
                    </div>

                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-campus-muted">
                        {item.level}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-campus-yellow px-3 py-1 text-xs font-bold">
                    {item.skill}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Teaches:</span>{' '}
                    {item.teaches}
                  </p>

                  <p className="text-campus-muted">
                    <span className="font-semibold text-campus-black">
                      Wants:
                    </span>{' '}
                    {item.wants}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSkillConnection(item.id)}
                  className="mt-4 min-h-[42px] w-full rounded-full border border-campus-border px-4 text-sm font-semibold transition hover:bg-campus-gray"
                >
                  {connectedSkills.includes(item.id)
                    ? 'Request Sent'
                    : 'Connect'}
                </button>
              </div>
            ))
          )}
        </section>
      )}

      {/* EVENTS */}
      {cat === 'Events' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Campus Events</h2>
            <span className="text-xs text-campus-muted">
              {filteredEvents.length} events
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <EmptyState
              title="No events found"
              text="Try a different search."
            />
          ) : (
            filteredEvents.map((event) => {
              const isCreator =
                event.isPersistent &&
                Number(event.creator_id) === Number(state.user?.id)
              const registrationStatus = event.isPersistent
                ? event.registration_status
                : registeredEvents.includes(event.id)
                  ? 'registered'
                  : null

              return (
              <div
                key={`${event.isPersistent ? 'db' : 'demo'}-${event.id}`}
                className="rounded-campus border border-campus-border bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-campus-yellow">
                    <CalendarDays size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{event.title}</h3>

                    <p className="mt-1 text-sm text-campus-muted">
                      {event.when}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-sm text-campus-muted">
                      <MapPin size={14} />
                      {event.venue}
                    </p>

                    {event.description && (
                      <p className="mt-3 text-sm leading-5 text-campus-muted">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-campus-muted">
                    {event.going} going
                  </span>

                  {isCreator ? (
                    <button
                      type="button"
                      onClick={() => toggleApplicants(event)}
                      className="min-h-[40px] rounded-full bg-campus-black px-4 text-sm font-semibold text-white"
                    >
                      {applicantPanels[event.id] ? 'Hide Applicants' : 'View Applicants'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        Boolean(eventActionLoading[`join-${event.id}`]) ||
                        Boolean(registrationStatus)
                      }
                      onClick={() => toggleEventRegistration(event)}
                      className={`min-h-[40px] rounded-full px-4 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
                        registrationStatus
                          ? 'bg-campus-lime text-campus-black'
                          : 'bg-campus-black text-white'
                      }`}
                    >
                      {eventActionLoading[`join-${event.id}`]
                        ? 'Sending...'
                        : registrationStatus === 'pending'
                          ? 'Pending'
                          : registrationStatus === 'accepted'
                            ? 'Accepted'
                            : registrationStatus === 'denied'
                              ? 'Denied'
                              : registrationStatus === 'registered'
                                ? 'Registered (Demo)'
                                : 'Request to Join'}
                    </button>
                  )}
                </div>
                {isCreator && applicantPanels[event.id] && (
                  <div className="mt-4 border-t border-campus-border pt-4">
                    <h4 className="mb-3 font-bold">Join Requests</h4>
                    {eventActionLoading[`applicants-${event.id}`] ? (
                      <p className="text-sm text-campus-muted">Loading applicants...</p>
                    ) : (eventApplicants[event.id] || []).length === 0 ? (
                      <p className="text-sm text-campus-muted">No applicants yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {(eventApplicants[event.id] || []).map((registration) => (
                          <div
                            key={registration.id}
                            className="rounded-2xl border border-campus-border p-3"
                          >
                            <p className="font-semibold">
                              {registration.student?.name || 'Student'}
                            </p>
                            <p className="mt-1 text-xs text-campus-muted">
                              {[registration.student?.college,
                                registration.student?.course,
                                registration.student?.year]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            {registration.student?.bio && (
                              <p className="mt-2 text-sm">
                                {registration.student.bio}
                              </p>
                            )}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold capitalize">
                                {registration.status}
                              </span>
                              {registration.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={Boolean(eventActionLoading[`review-${registration.id}`])}
                                    onClick={() => reviewApplicant(event, registration, 'accept')}
                                    className="rounded-full bg-campus-lime px-3 py-2 text-xs font-bold disabled:opacity-60"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    disabled={Boolean(eventActionLoading[`review-${registration.id}`])}
                                    onClick={() => reviewApplicant(event, registration, 'deny')}
                                    className="rounded-full border border-campus-border px-3 py-2 text-xs font-bold disabled:opacity-60"
                                  >
                                    Deny
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )
            })
          )}
        </section>
      )}

      {/* RESALE */}
      {cat === 'Resale' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Marketplace</h2>
            <span className="text-xs text-campus-muted">
              {filteredResaleItems.length} items
            </span>
          </div>

          {filteredResaleItems.length === 0 ? (
            <EmptyState
              title="No items found"
              text="Try searching for another item, seller or location."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredResaleItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-campus border border-campus-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-campus"
                >
                  <div className="relative aspect-[4/3] bg-campus-gray">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-6xl">
                        {item.emoji || '📦'}
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold">
                      {item.condition}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold">{item.title}</h3>
                        <p className="mt-1 text-xs text-campus-muted">
                          {item.seller}
                        </p>
                      </div>

                      <p className="shrink-0 font-extrabold">
                        ₹{item.price}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-campus-muted">
                      <MapPin size={13} />
                      {item.location}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="min-h-[40px] flex-1 rounded-full bg-campus-black px-3 text-sm font-semibold text-white transition hover:bg-campus-dark active:scale-95"
                      >
                        View Item
                      </button>

                      <button
                        type="button"
                        onClick={() => contactSeller(item)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-campus-border transition hover:bg-campus-gray active:scale-95"
                        aria-label={`Message ${item.seller}`}
                      >
                        <MessageCircle size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FIND ITEMS */}
      {cat === 'Find Items' && (
        <section className="space-y-4">
          <div className="rounded-campus border border-campus-border bg-campus-gray p-5">
            <h2 className="text-lg font-bold">Find Items</h2>

            <p className="mt-2 text-sm leading-6 text-campus-muted">
              Looking for something you lost on campus? Search the marketplace
              or post a request.
            </p>

            <button
              type="button"
              onClick={() => setCat('Resale')}
              className="mt-4 min-h-[42px] rounded-full bg-campus-black px-5 text-sm font-semibold text-white"
            >
              Browse Marketplace
            </button>
          </div>
        </section>
      )}

      {!cat && <Skeleton className="h-32 w-full" />}
    </div>
  )
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-campus border border-campus-border bg-campus-gray p-8 text-center">
      <p className="font-bold">{title}</p>
      <p className="mt-2 text-sm text-campus-muted">{text}</p>
    </div>
  )
}