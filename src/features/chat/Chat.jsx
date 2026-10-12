
import {
  Search,
  Send,
  ArrowLeft,
  MessageCircle,
  RefreshCw,
  Check,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useApp } from '../../store/AppContext'

const API_BASE = 'http://127.0.0.1:8000'
const POLL_INTERVAL = 4000

function toId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function errorText(data, fallback) {
  return typeof data?.detail === 'string' ? data.detail : fallback
}

function belongsToPair(item, userId, otherId) {
  const sender = toId(item?.sender_id)
  const receiver = toId(item?.receiver_id)

  return (
    (sender === userId && receiver === otherId) ||
    (sender === otherId && receiver === userId)
  )
}

function validateMessages(data, userId, otherId) {
  if (!Array.isArray(data)) {
    throw new Error('The server returned an invalid message history.')
  }

  if (data.some((item) => !belongsToPair(item, userId, otherId))) {
    throw new Error(
      'Message history did not match this conversation. Please refresh.'
    )
  }

  return data
}

function formatTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateLabel(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== today.getFullYear()
      ? 'numeric'
      : undefined,
  })
}

function formatConversationTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  if (date.toDateString() === new Date().toDateString()) {
    return formatTime(value)
  }

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
}

function sameDay(a, b) {
  if (!a || !b) return false

  const first = new Date(a)
  const second = new Date(b)

  return (
    !Number.isNaN(first.getTime()) &&
    !Number.isNaN(second.getTime()) &&
    first.toDateString() === second.toDateString()
  )
}

function mergeMessages(oldMessages, newMessages) {
  // The database ID is the stable identity of a message.
  // Merge rather than blindly appending polled history.
  const byId = new Map()

  for (const item of oldMessages) {
    if (item?.id != null) byId.set(item.id, item)
  }

  for (const item of newMessages) {
    if (item?.id != null) byId.set(item.id, item)
  }

  return [...byId.values()].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime() || 0
    const timeB = new Date(b.created_at || 0).getTime() || 0

    return timeA - timeB || Number(a.id) - Number(b.id)
  })
}

export default function Chat() {
  const { state, toast } = useApp()

  const currentUserId = toId(state.user?.id)

  const token = state.token
  const [conversations, setConversations] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef(null)
  const messageListRef = useRef(null)
  const shouldScrollRef = useRef(true)

  // Each conversation switch creates a new generation.
  // Responses from previous generations are ignored.
  const generationRef = useRef(0)
  const selectedIdRef = useRef(null)
  const historyRequestRef = useRef(0)
  const tokenRef = useRef(token)
  const sendingRef = useRef(false)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const apiRequest = useCallback(async (path, options = {}) => {
    const activeToken = tokenRef.current

    if (!activeToken) {
      throw new Error('Your session has expired. Please log in again.')
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${activeToken}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(
        errorText(data, `Request failed (${response.status}).`)
      )
    }

    return data
  }, [])

  // Reset chat state whenever the logged-in account changes.
  useEffect(() => {
    generationRef.current += 1
    historyRequestRef.current += 1
    selectedIdRef.current = null

    setSelectedStudentId(null)
    setConversations([])
    setMessages([])
    setMessageText('')
    setError('')
    setLoadingMessages(false)
  }, [token, currentUserId])

  const loadConversations = useCallback(async (quiet = false) => {
    const userId = currentUserId

    if (!tokenRef.current || userId === null) {
      setConversations([])
      setLoadingConversations(false)
      return
    }

    try {
      const data = await apiRequest('/chat/conversations')

      if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid conversation list.')
      }

      if (toId(state.user?.id) !== userId) return

      const valid = data.filter((item) => {
        const studentId = toId(item?.student?.id)
        return studentId !== null && studentId !== userId
      })

      setConversations(valid)
      setError('')
    } catch (err) {
      if (!quiet) {
        setError(err.message || 'Could not load conversations.')
      }
    } finally {
      setLoadingConversations(false)
    }
  }, [apiRequest, currentUserId, state.user?.id])

  useEffect(() => {
    if (!token || currentUserId === null) {
      setConversations([])
      setLoadingConversations(false)
      return
    }

    let active = true
    setLoadingConversations(true)

    const refresh = async () => {
      if (active) await loadConversations(true)
    }

    loadConversations(false)

    const interval = window.setInterval(refresh, POLL_INTERVAL)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [token, currentUserId, loadConversations])

  const selectedConversation = useMemo(
    () => conversations.find(
      (item) => toId(item.student?.id) === selectedStudentId
    ) || null,
    [conversations, selectedStudentId]
  )

  const selectedStudent = selectedConversation?.student || null

  const loadMessages = useCallback(async (
    studentId,
    generation,
    quiet = false
  ) => {
    if (
      !tokenRef.current ||
      currentUserId === null ||
      studentId === null ||
      studentId === currentUserId
    ) {
      return
    }

    const requestNumber = ++historyRequestRef.current

    if (!quiet) setLoadingMessages(true)

    try {
      const data = await apiRequest(`/chat/${studentId}/messages`)

      // Ignore responses if the user changed conversations, logged out,
      // or a newer history request has already started.
      if (
        generationRef.current !== generation ||
        selectedIdRef.current !== studentId ||
        historyRequestRef.current !== requestNumber
      ) {
        return
      }

      const safeMessages = validateMessages(data, currentUserId, studentId)

      shouldScrollRef.current = false
      setMessages((previous) => mergeMessages(previous, safeMessages))
    } catch (err) {
      if (
        generationRef.current === generation &&
        selectedIdRef.current === studentId &&
        historyRequestRef.current === requestNumber &&
        !quiet
      ) {
        setMessages([])
        toast(err.message || 'Could not load messages.')
      }
    } finally {
      if (
        generationRef.current === generation &&
        selectedIdRef.current === studentId &&
        historyRequestRef.current === requestNumber &&
        !quiet
      ) {
        setLoadingMessages(false)
      }
    }
  }, [apiRequest, currentUserId, toast])

  useEffect(() => {
    if (
      !token ||
      currentUserId === null ||
      selectedStudentId === null
    ) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    const studentId = selectedStudentId
    const generation = generationRef.current

    setMessages([])
    setMessageText('')
    setLoadingMessages(true)
    shouldScrollRef.current = true

    loadMessages(studentId, generation)

    const interval = window.setInterval(() => {
      loadMessages(studentId, generation, true)
    }, POLL_INTERVAL)

    return () => {
      window.clearInterval(interval)
    }
  }, [token, currentUserId, selectedStudentId, loadMessages])

  useEffect(() => {
    if (!shouldScrollRef.current) return

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })

    shouldScrollRef.current = false
  }, [messages])

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return conversations

    return conversations.filter(({ student }) =>
      [student?.name, student?.college, student?.course]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [conversations, search])

  const groupedMessages = useMemo(() => {
    return messages.map((item, index) => {
      const previous = messages[index - 1]
      const next = messages[index + 1]

      return {
        ...item,
        isMine: toId(item.sender_id) === currentUserId,
        showDate: !previous || !sameDay(
          previous.created_at,
          item.created_at
        ),
        startsGroup: !previous ||
          toId(previous.sender_id) !== toId(item.sender_id) ||
          !sameDay(previous.created_at, item.created_at),
        endsGroup: !next ||
          toId(next.sender_id) !== toId(item.sender_id) ||
          !sameDay(item.created_at, next.created_at),
      }
    })
  }, [messages, currentUserId])

  const openChat = (conversation) => {
    const studentId = toId(conversation?.student?.id)

    if (
      studentId === null ||
      currentUserId === null ||
      studentId === currentUserId
    ) {
      toast('This conversation is not valid.')
      return
    }

    generationRef.current += 1
    historyRequestRef.current += 1
    selectedIdRef.current = studentId

    setMessages([])
    setMessageText('')
    setLoadingMessages(true)
    setSelectedStudentId(studentId)
    shouldScrollRef.current = true
  }

  const closeChat = () => {
    generationRef.current += 1
    historyRequestRef.current += 1
    selectedIdRef.current = null

    setSelectedStudentId(null)
    setMessages([])
    setMessageText('')
    setLoadingMessages(false)
  }

  const refreshMessages = async () => {
    const studentId = selectedIdRef.current

    if (studentId === null) return

    const generation = generationRef.current
    await loadMessages(studentId, generation)
    await loadConversations(true)
  }

  const sendMessage = async () => {
    const content = messageText.trim()
    const studentId = selectedIdRef.current

    if (!content || studentId === null || sendingRef.current) return

    if (currentUserId === null || studentId === currentUserId) {
      toast('Please select a valid conversation.')
      return
    }

    const generation = generationRef.current
    sendingRef.current = true
    setSending(true)

    try {
      const sent = await apiRequest(`/chat/${studentId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })

      if (!belongsToPair(sent, currentUserId, studentId)) {
        throw new Error('The server returned a message for another conversation.')
      }

      // A successful send can finish after the user has switched chats.
      // Only update the chat that was active when sending began.
      if (
        generationRef.current === generation &&
        selectedIdRef.current === studentId
      ) {
        shouldScrollRef.current = true

        setMessages((previous) => mergeMessages(previous, [sent]))
        setMessageText('')
      }

      await loadConversations(true)
    } catch (err) {
      toast(err.message || 'Message could not be sent.')
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const handleMessageScroll = () => {
    const element = messageListRef.current
    if (!element) return

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight

    shouldScrollRef.current = distanceFromBottom < 120
  }

  if (!token || currentUserId === null) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl bg-campus-gray p-6">
        <h2 className="text-xl font-extrabold">Messages</h2>
        <p className="mt-2 text-sm text-campus-muted">
          Please log in to access your conversations.
        </p>
      </div>
    )
  }

  if (selectedStudentId !== null) {
    const student = selectedStudent

    return (
      <section className="mx-auto flex h-[calc(100dvh-8rem)] min-h-[420px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-campus-border bg-white sm:h-[calc(100dvh-10rem)] sm:min-h-[520px] sm:rounded-3xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-campus-border px-3 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={closeChat}
            aria-label="Back to conversations"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-campus-gray hover:bg-campus-lime"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-campus-lime text-base font-extrabold">
            {student?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold sm:text-base">
              {student?.name || 'Conversation'}
            </p>
            <p className="truncate text-xs text-campus-muted">
              {[student?.course, student?.college].filter(Boolean).join(' · ') ||
                'CampusX connection'}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshMessages}
            aria-label="Refresh messages"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-campus-gray hover:bg-campus-lime"
          >
            <RefreshCw size={17} />
          </button>
        </header>

        <div
          ref={messageListRef}
          onScroll={handleMessageScroll}
          className="flex-1 overflow-y-auto overscroll-contain bg-white px-3 py-4 sm:px-6 sm:py-6"
        >
          {loadingMessages && messages.length === 0 && (
            <p className="py-10 text-center text-sm text-campus-muted">
              Loading messages…
            </p>
          )}

          {!loadingMessages && messages.length === 0 && (
            <div className="flex min-h-full flex-col items-center justify-center py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-campus-gray">
                <MessageCircle size={27} />
              </div>
              <h3 className="mt-4 font-extrabold">Start the conversation</h3>
              <p className="mt-2 max-w-xs text-sm text-campus-muted">
                Say hello to {student?.name || 'your connection'}. Your messages will appear here.
              </p>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-2xl flex-col">
            {groupedMessages.map((item) => (
              <div key={item.id}>
                {item.showDate && (
                  <div className="my-5 flex items-center justify-center gap-3">
                    <span className="h-px flex-1 bg-campus-border" />
                    <span className="rounded-full bg-campus-gray px-3 py-1 text-[11px] font-semibold text-campus-muted">
                      {formatDateLabel(item.created_at)}
                    </span>
                    <span className="h-px flex-1 bg-campus-border" />
                  </div>
                )}

                <div
                  className={`flex ${
                    item.isMine ? 'justify-end' : 'justify-start'
                  } ${item.startsGroup ? 'mt-3' : 'mt-1'}`}
                >
                  <div
                    className={`max-w-[88%] break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
                      item.isMine
                        ? 'rounded-2xl rounded-br-md bg-campus-black text-white'
                        : 'rounded-2xl rounded-bl-md bg-campus-gray text-campus-black'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{item.content}</p>

                    {item.endsGroup && (
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          item.isMine ? 'text-white/60' : 'text-campus-muted'
                        }`}
                      >
                        <span>{formatTime(item.created_at)}</span>
                        {item.isMine && <Check size={12} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
          className="shrink-0 border-t border-campus-border bg-white p-3 sm:px-5 sm:py-4"
        >
          <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Write a message…"
              maxLength={5000}
              rows={1}
              className="max-h-32 min-h-12 min-w-0 flex-1 resize-y rounded-2xl border border-campus-border bg-campus-gray px-4 py-3 text-sm outline-none focus:border-campus-black"
            />

            <button
              type="submit"
              disabled={!messageText.trim() || sending}
              aria-label="Send message"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-campus-black text-white hover:bg-campus-black/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 hidden text-center text-[10px] text-campus-muted sm:block">
            Enter to send · Shift + Enter for a new line
          </p>
        </form>
      </section>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
            CampusX
          </p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight">Messages</h2>
          <p className="mt-1 text-sm text-campus-muted">
            Your conversations with fellow students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadConversations(false)}
          aria-label="Refresh conversations"
          className="grid h-11 w-11 place-items-center rounded-full bg-campus-gray hover:bg-campus-lime"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-campus-gray px-4">
        <Search size={18} className="shrink-0 text-campus-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, course, or college"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-campus-muted"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs font-semibold text-campus-muted"
          >
            Clear
          </button>
        )}
      </label>

      {error && (
        <div className="rounded-2xl bg-campus-gray p-4">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => loadConversations(false)}
            className="mt-2 text-sm font-bold underline"
          >
            Try again
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-campus-border bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-campus-border px-4 py-3 sm:px-5">
          <h3 className="text-sm font-extrabold">Your conversations</h3>
          <span className="text-xs text-campus-muted">
            {filteredConversations.length}
          </span>
        </div>

        {loadingConversations && conversations.length === 0 && !error && (
          <p className="py-12 text-center text-sm text-campus-muted">
            Loading conversations…
          </p>
        )}

        {!loadingConversations && !error && filteredConversations.length === 0 && (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-campus-gray">
              <MessageCircle size={24} />
            </div>
            <h3 className="mt-4 font-extrabold">
              {search ? 'No matching students' : 'No conversations yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-campus-muted">
              {search
                ? 'Try a different name, course, or college.'
                : 'Connect with students through Discover. Your accepted connections will appear here.'}
            </p>
          </div>
        )}

        <div className="divide-y divide-campus-border/70">
          {filteredConversations.map((conversation) => {
            const student = conversation.student
            const lastMessage = conversation.last_message

            if (!student) return null

            const isMine =
              lastMessage &&
              toId(lastMessage.sender_id) === currentUserId

            return (
              <button
                key={student.id}
                type="button"
                onClick={() => openChat(conversation)}
                className="group flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-campus-gray/70 sm:gap-4 sm:px-5"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-campus-lime text-base font-extrabold text-campus-black">
                  {student.name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-extrabold sm:text-base">
                      {student.name}
                    </p>
                    <span className="shrink-0 text-[10px] text-campus-muted sm:text-xs">
                      {formatConversationTime(lastMessage?.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-campus-muted sm:text-sm">
                    {lastMessage
                      ? `${isMine ? 'You: ' : ''}${lastMessage.content}`
                      : [student.course, student.college].filter(Boolean).join(' · ') ||
                        'Start a conversation'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}