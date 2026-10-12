import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  UserPlus,
  MapPin,
} from 'lucide-react'

import { useApp } from '../../store/AppContext'
import Button from '../../components/ui/Button'

export default function StudentProfile({ student, onBack }) {
  const { toast } = useApp()

  return (
    <div className="space-y-7">

      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Go back"
          className="
            grid h-10 w-10 shrink-0 place-items-center
            rounded-full bg-campus-gray
            transition hover:bg-campus-border
            active:scale-95
          "
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
            CampusX
          </p>

          <h2 className="text-xl font-extrabold text-campus-black">
            Student Profile
          </h2>
        </div>
      </header>

      {/* Profile Card */}
      <section
        className="
          rounded-campus
          border border-campus-border
          bg-white
          p-6
          shadow-campus
        "
      >
        <div className="flex flex-col items-center text-center">

          {/* Avatar */}
          <div
            className="
              grid h-24 w-24
              place-items-center
              rounded-full
              bg-campus-lime
              text-4xl
              font-extrabold
              text-campus-black
            "
          >
            {student.name.charAt(0)}
          </div>

          {/* Name */}
          <h1
            className="
              mt-4
              flex
              items-center
              gap-1.5
              text-2xl
              font-extrabold
              text-campus-black
            "
          >
            {student.name}

            <BadgeCheck
              size={19}
              fill="#FFF3A3"
              className="text-campus-black"
            />
          </h1>

          <p className="mt-1 text-sm text-campus-muted">
            {student.common}
          </p>

          {/* Match */}
          <span
            className="
              mt-3
              rounded-full
              bg-campus-yellow
              px-3
              py-1
              text-xs
              font-bold
              text-campus-black
            "
          >
            {student.score}% match
          </span>
        </div>

        {/* Location */}
        <div
          className="
            mt-6
            flex
            items-center
            justify-center
            gap-2
            text-sm
            text-campus-muted
          "
        >
          <MapPin size={16} />
          <span>Campus community</span>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">

          <Button
            variant="gold"
            onClick={() => toast('Connection request sent')}
            className="flex items-center justify-center gap-2"
          >
            <UserPlus size={17} />
            Connect
          </Button>

          <Button
            variant="ghost"
            onClick={() => toast('Chat opened')}
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle size={17} />
            Message
          </Button>

        </div>
      </section>

      {/* About */}
      <section>
        <h3 className="text-sm font-bold text-campus-black">
          About
        </h3>

        <p className="mt-2 text-sm leading-6 text-campus-muted">
          Student at CampusX. Interested in learning,
          collaborating and connecting with other students.
        </p>
      </section>

      {/* Common */}
      <section
        className="
          rounded-campus
          bg-campus-gray
          p-5
        "
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-campus-muted">
          Why you matched
        </p>

        <p className="mt-2 font-bold text-campus-black">
          {student.common}
        </p>

        <p className="mt-1 text-sm text-campus-muted">
          You have similar academic interests.
        </p>
      </section>

    </div>
  )
}