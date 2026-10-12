import { Plus } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { NAV } from './NavItems'
import CreateSheet from './CreateSheet'

function NavButton({ item, active, onClick }) {
  const { Icon, label } = item

  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`
        flex
        min-w-[52px]
        flex-1
        flex-col
        items-center
        justify-center
        gap-1
        rounded-2xl
        py-2
        text-[11px]
        font-medium
        transition-all
        duration-200

        ${
          active
            ? 'text-campus-black'
            : 'text-campus-muted hover:text-campus-black'
        }
      `}
    >
      <div
        className={`
          grid
          h-7
          w-10
          place-items-center
          rounded-full
          transition-all

          ${active ? 'bg-campus-yellow' : ''}
        `}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </div>

      <span>{label}</span>
    </button>
  )
}

export default function AppShell({ children }) {
  const { state, dispatch } = useApp()

  const go = (id) => {
    dispatch({
      type: 'tab',
      value: id,
    })
  }

  const openCreate = () => {
    dispatch({
      type: 'createOpen',
      value: true,
    })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Desktop Header */}
      <header
        className="
          sticky
          top-0
          z-30
          hidden
          border-b
          border-campus-border
          bg-white/95
          backdrop-blur
          md:block
        "
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">

          <button
            onClick={() => go('home')}
            className="text-xl font-extrabold tracking-tight"
          >
            Campus<span className="text-campus-lime">X</span>
          </button>

          <div className="flex items-center gap-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition

                  ${
                    state.tab === item.id
                      ? 'bg-campus-yellow text-campus-black'
                      : 'text-campus-muted hover:bg-campus-gray hover:text-campus-black'
                  }
                `}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={openCreate}
              className="
                ml-2
                flex
                items-center
                gap-2
                rounded-full
                bg-campus-black
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-campus-dark
              "
            >
              <Plus size={17} />
              Create
            </button>
          </div>

        </div>
      </header>

      {/* Main App Content */}
      <main
        className="
          mx-auto
          min-h-screen
          w-full
          max-w-2xl
          px-4
          pb-24
          pt-5
          sm:px-6
          md:max-w-3xl
          md:pb-10
          md:pt-8
        "
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="
          fixed
          inset-x-0
          bottom-0
          z-40
          border-t
          border-campus-border
          bg-white/95
          px-2
          pb-[env(safe-area-inset-bottom)]
          pt-2
          backdrop-blur-xl
          md:hidden
        "
      >
        <div className="mx-auto flex max-w-md items-center justify-around">

          {NAV.slice(0, 2).map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={state.tab === item.id}
              onClick={() => go(item.id)}
            />
          ))}

          {/* Create */}
          <button
            aria-label="Create"
            onClick={openCreate}
            className="
              -mt-7
              grid
              h-14
              w-14
              shrink-0
              place-items-center
              rounded-full
              border-4
              border-white
              bg-campus-black
              text-white
              shadow-campus
              transition
              active:scale-95
            "
          >
            <Plus size={25} />
          </button>

          {NAV.slice(2).map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={state.tab === item.id}
              onClick={() => go(item.id)}
            />
          ))}

        </div>
      </nav>

      {/* Create Sheet */}
      <CreateSheet />

      {/* Toasts */}
      <div
        className="
          fixed
          left-1/2
          top-4
          z-[60]
          -translate-x-1/2
          space-y-2
        "
        role="status"
      >
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className="
              rounded-full
              bg-campus-black
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              shadow-campus
            "
          >
            {toast.message}
          </div>
        ))}
      </div>

    </div>
  )
}