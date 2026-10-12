import { useMemo, useState } from 'react'
import {
  Bell,
  Search,
  ArrowUpRight,
  X,
} from 'lucide-react'

import { useApp } from '../../store/AppContext'
import { events, matches } from '../../data/mock'
import Button from '../../components/ui/Button'
import StudentProfile from '../profile/StudentProfile'

export default function Home() {
  const { state, toast } = useApp()

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)

  // Student currently being viewed
  const [selectedStudent, setSelectedStudent] = useState(null)

  /*
   * Search students and events
   */
  const searchResults = useMemo(() => {
    const text = query.trim().toLowerCase()

    if (!text) {
      return {
        matches,
        events,
      }
    }

    return {
      matches: matches.filter((person) =>
        `${person.name} ${person.common}`
          .toLowerCase()
          .includes(text)
      ),

      events: events.filter((event) =>
        `${event.title} ${event.when} ${event.venue}`
          .toLowerCase()
          .includes(text)
      ),
    }
  }, [query])

  const visibleMatches = showAllMatches
    ? searchResults.matches
    : searchResults.matches.slice(0, 2)

  const visibleEvents = showAllEvents
    ? searchResults.events
    : searchResults.events.slice(0, 2)

  const hasSearch = query.trim().length > 0

  /*
   * Open selected student's profile
   */
  const openStudentProfile = (student) => {
    setSelectedStudent(student)
  }

  /*
   * Close student profile
   */
  const closeStudentProfile = () => {
    setSelectedStudent(null)
  }

  /*
   * If a student is selected,
   * show StudentProfile instead of Home.
   */
  if (selectedStudent) {
    return (
      <StudentProfile
        student={selectedStudent}
        onBack={closeStudentProfile}
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* Header */}
      <header className="flex items-center justify-between gap-4">

        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">
            Welcome back
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-campus-black">
            What's good, {state.user.name}?
          </h2>
        </div>

        <button
          aria-label="Notifications"
          onClick={() => toast('No new notifications')}
          className="
            grid h-11 w-11 shrink-0 place-items-center
            rounded-full border border-campus-border bg-white
            transition hover:bg-campus-gray
            active:scale-95
          "
        >
          <Bell size={20} />
        </button>

      </header>

      {/* Search */}
      {searchOpen ? (
        <div
          className="
            flex min-h-[52px] w-full items-center gap-3
            rounded-full border border-campus-black
            bg-campus-gray px-5
          "
        >

          <Search
            size={19}
            className="shrink-0 text-campus-muted"
          />

          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowAllMatches(true)
              setShowAllEvents(true)
            }}
            placeholder="Search students, events, items"
            className="
              min-w-0 flex-1
              bg-transparent
              text-sm text-campus-black
              outline-none
              placeholder:text-campus-muted
            "
          />

          <button
            aria-label="Close search"
            onClick={() => {
              setQuery('')
              setSearchOpen(false)
              setShowAllMatches(false)
              setShowAllEvents(false)
            }}
            className="
              grid h-8 w-8 shrink-0 place-items-center
              rounded-full bg-white
              transition hover:bg-campus-border
              active:scale-95
            "
          >
            <X size={16} />
          </button>

        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="
            flex min-h-[52px] w-full items-center gap-3
            rounded-full border border-campus-border
            bg-campus-gray px-5
            text-left text-sm text-campus-muted
            transition hover:border-campus-black
            active:scale-[0.99]
          "
        >
          <Search size={19} />

          <span>
            Search students, events, items
          </span>
        </button>
      )}

      {/* Search Results */}
      {hasSearch && (
        <section className="space-y-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
              Search
            </p>

            <h3 className="mt-1 text-xl font-bold text-campus-black">
              Results for "{query}"
            </h3>
          </div>

          {/* Nothing found */}
          {searchResults.matches.length === 0 &&
          searchResults.events.length === 0 ? (
            <div
              className="
                rounded-campus
                border border-campus-border
                bg-campus-gray
                p-6
                text-center
              "
            >
              <Search
                size={28}
                className="mx-auto text-campus-muted"
              />

              <p className="mt-3 font-bold text-campus-black">
                Nothing found
              </p>

              <p className="mt-1 text-sm text-campus-muted">
                Try searching for another student or event.
              </p>
            </div>
          ) : (
            <>

              {/* Search Students */}
              {searchResults.matches.length > 0 && (
                <div className="space-y-3">

                  <p className="text-sm font-bold text-campus-black">
                    Students
                  </p>

                  {searchResults.matches.map((m) => (
                    <div
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openStudentProfile(m)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          openStudentProfile(m)
                        }
                      }}
                      className="
                        flex cursor-pointer items-center gap-4
                        rounded-campus
                        border border-campus-border
                        bg-white
                        p-4
                        shadow-campus
                        transition
                        hover:-translate-y-0.5
                        hover:shadow-campus-hover
                        active:scale-[0.99]
                      "
                    >

                      {/* Avatar */}
                      <div
                        className="
                          grid h-12 w-12 shrink-0
                          place-items-center
                          rounded-full
                          bg-campus-lime
                          font-bold
                          text-campus-black
                        "
                      >
                        {m.name.charAt(0)}
                      </div>

                      {/* Information */}
                      <div className="min-w-0 flex-1">

                        <p className="font-bold text-campus-black">
                          {m.name}
                        </p>

                        <p className="mt-1 text-sm text-campus-muted">
                          {m.common}
                        </p>

                      </div>

                      {/* Open profile */}
                      <button
                        aria-label={`View ${m.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          openStudentProfile(m)
                        }}
                        className="
                          grid h-10 w-10 shrink-0
                          place-items-center
                          rounded-full
                          bg-campus-gray
                          transition
                          hover:bg-campus-yellow
                          active:scale-95
                        "
                      >
                        <ArrowUpRight size={18} />
                      </button>

                    </div>
                  ))}

                </div>
              )}

              {/* Search Events */}
              {searchResults.events.length > 0 && (
                <div className="space-y-3">

                  <p className="text-sm font-bold text-campus-black">
                    Events
                  </p>

                  {searchResults.events.map((e) => (
                    <div
                      key={e.id}
                      className="
                        rounded-campus
                        border border-campus-border
                        bg-campus-yellow
                        p-4
                      "
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="font-bold text-campus-black">
                            {e.title}
                          </p>

                          <p className="mt-1 text-sm text-campus-black/70">
                            {e.when}
                          </p>

                          <p className="text-sm text-campus-black/70">
                            {e.venue}
                          </p>

                        </div>

                        <button
                          aria-label={`Open ${e.title}`}
                          onClick={() =>
                            toast(`Opening ${e.title}`)
                          }
                          className="
                            grid h-10 w-10 shrink-0
                            place-items-center
                            rounded-full
                            bg-campus-black
                            text-white
                            transition
                            active:scale-95
                          "
                        >
                          <ArrowUpRight size={18} />
                        </button>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </>
          )}

        </section>
      )}

      {/* Matches */}
      {!hasSearch && (
        <section className="space-y-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
                Connect
              </p>

              <h3 className="text-xl font-bold text-campus-black">
                Matches for CS101
              </h3>
            </div>

            <button
              onClick={() =>
                setShowAllMatches(!showAllMatches)
              }
              className="
                text-sm
                font-semibold
                text-campus-black
                hover:underline
              "
            >
              {showAllMatches ? 'Show less' : 'See all'}
            </button>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {visibleMatches.map((m) => (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => openStudentProfile(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    openStudentProfile(m)
                  }
                }}
                className="
                  group
                  cursor-pointer
                  rounded-campus
                  border border-campus-border
                  bg-white
                  p-5
                  shadow-campus
                  transition
                  hover:-translate-y-1
                  hover:shadow-campus-hover
                  active:scale-[0.99]
                "
              >

                <div className="flex items-start justify-between gap-3">

                  {/* Avatar */}
                  <div
                    className="
                      grid h-12 w-12 shrink-0
                      place-items-center
                      rounded-full
                      bg-campus-lime
                      font-bold
                      text-campus-black
                    "
                  >
                    {m.name.charAt(0)}
                  </div>

                  {/* Profile button */}
                  <button
                    aria-label={`View ${m.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openStudentProfile(m)
                    }}
                    className="
                      grid h-9 w-9
                      place-items-center
                      rounded-full
                      bg-campus-gray
                      transition
                      group-hover:bg-campus-yellow
                      active:scale-95
                    "
                  >
                    <ArrowUpRight size={17} />
                  </button>

                </div>

                {/* Student information */}
                <div className="mt-4 text-left">

                  <p className="font-bold text-campus-black">
                    {m.name}
                  </p>

                  <p className="mt-1 text-sm text-campus-muted">
                    {m.common}
                  </p>

                </div>

                {/* Bottom actions */}
                <div className="mt-5 flex items-center justify-between gap-3">

                  <span
                    className="
                      rounded-full
                      bg-campus-yellow
                      px-3 py-1
                      text-xs
                      font-bold
                      text-campus-black
                    "
                  >
                    {m.score}% match
                  </span>

                  <Button
                    variant="gold"
                    onClick={(e) => {
                      e.stopPropagation()
                      toast('Connection request sent')
                    }}
                  >
                    Connect
                  </Button>

                </div>

              </div>
            ))}

          </div>

        </section>
      )}

      {/* Events */}
      {!hasSearch && (
        <section className="space-y-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
                Campus
              </p>

              <h3 className="text-xl font-bold text-campus-black">
                Upcoming events
              </h3>
            </div>

            <button
              onClick={() =>
                setShowAllEvents(!showAllEvents)
              }
              className="
                text-sm
                font-semibold
                text-campus-black
                hover:underline
              "
            >
              {showAllEvents ? 'Show less' : 'See all'}
            </button>

          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {visibleEvents.map((e) => (
              <div
                key={e.id}
                className="
                  rounded-campus
                  border border-campus-border
                  bg-campus-yellow
                  p-5
                  transition
                  hover:-translate-y-1
                "
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="font-bold text-campus-black">
                      {e.title}
                    </p>

                    <p className="mt-2 text-sm text-campus-black/70">
                      {e.when}
                    </p>

                    <p className="text-sm text-campus-black/70">
                      {e.venue}
                    </p>

                  </div>

                  <button
                    aria-label={`Open ${e.title}`}
                    onClick={() =>
                      toast(`Opening ${e.title}`)
                    }
                    className="
                      grid h-10 w-10 shrink-0
                      place-items-center
                      rounded-full
                      bg-campus-black
                      text-white
                      transition
                      active:scale-95
                    "
                  >
                    <ArrowUpRight size={18} />
                  </button>

                </div>

                <div className="mt-5">

                  <span
                    className="
                      rounded-full
                      bg-white
                      px-3 py-1
                      text-xs
                      font-bold
                    "
                  >
                    {e.going} going
                  </span>

                </div>

              </div>
            ))}

          </div>

        </section>
      )}

    </div>
  )
}