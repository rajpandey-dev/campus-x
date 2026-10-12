
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.event import Event, EventRegistration
from app.models.user import User


router = APIRouter(prefix="/events", tags=["Events"])


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    event_date: str = Field(min_length=10, max_length=10)
    event_time: str = Field(min_length=5, max_length=5)
    venue: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)


def format_event(event: Event, registration_status=None):
    return {
        "id": event.id,
        "title": event.title,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "when": f"{event.event_date} · {event.event_time}",
        "venue": event.venue,
        "description": event.description,
        "creator_id": event.creator_id,
        "created_at": event.created_at,
        "registration_status": registration_status,
    }


def format_student(student: User):
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "college": student.college,
        "course": student.course,
        "year": student.year,
        "bio": student.bio,
    }


def format_registration(registration, student=None):
    result = {
        "id": registration.id,
        "event_id": registration.event_id,
        "student_id": registration.student_id,
        "status": registration.status,
        "created_at": registration.created_at,
    }

    if student is not None:
        result["student"] = format_student(student)

    return result


@router.get("/")
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = db.scalars(
        select(Event).order_by(Event.created_at.desc())
    ).all()

    registrations = db.scalars(
        select(EventRegistration).where(
            EventRegistration.student_id == current_user.id
        )
    ).all()

    status_by_event = {
        registration.event_id: registration.status
        for registration in registrations
    }

    return [
        format_event(event, status_by_event.get(event.id))
        for event in events
    ]


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        datetime.strptime(data.event_date, "%Y-%m-%d")
        datetime.strptime(data.event_time, "%H:%M")
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Use date YYYY-MM-DD and time HH:MM.",
        )

    event = Event(
        title=data.title.strip(),
        event_date=data.event_date,
        event_time=data.event_time,
        venue=data.venue.strip(),
        description=data.description,
        creator_id=current_user.id,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return format_event(event)


@router.post(
    "/{event_id}/register",
    status_code=status.HTTP_201_CREATED,
)
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.creator_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot register for your own event.",
        )

    existing = db.scalar(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.student_id == current_user.id,
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"You already have a {existing.status} request for this event.",
        )

    registration = EventRegistration(
        event_id=event_id,
        student_id=current_user.id,
        status="pending",
    )

    db.add(registration)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="You already have a request for this event.",
        )

    db.refresh(registration)
    return format_registration(registration)


@router.get("/my-requests")
def my_event_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    registrations = db.scalars(
        select(EventRegistration)
        .where(EventRegistration.student_id == current_user.id)
        .order_by(EventRegistration.created_at.desc())
    ).all()

    results = []

    for registration in registrations:
        event = db.get(Event, registration.event_id)

        if event is not None:
            results.append({
                **format_registration(registration),
                "event": format_event(event, registration.status),
            })

    return results


@router.get("/{event_id}/applicants")
def event_applicants(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.creator_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the event creator can view applicants.",
        )

    registrations = db.scalars(
        select(EventRegistration)
        .where(EventRegistration.event_id == event_id)
        .order_by(EventRegistration.created_at.desc())
    ).all()

    results = []

    for registration in registrations:
        student = db.get(User, registration.student_id)

        if student is not None:
            results.append(format_registration(registration, student))

    return results


def change_registration_status(
    event_id: int,
    registration_id: int,
    new_status: str,
    db: Session,
    current_user: User,
):
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.creator_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the event creator can manage applicants.",
        )

    registration = db.get(EventRegistration, registration_id)

    if registration is None or registration.event_id != event_id:
        raise HTTPException(
            status_code=404,
            detail="Registration not found for this event.",
        )

    if registration.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This registration has already been reviewed.",
        )

    registration.status = new_status
    db.commit()
    db.refresh(registration)

    student = db.get(User, registration.student_id)
    return format_registration(registration, student)


@router.post("/{event_id}/applicants/{registration_id}/accept")
def accept_applicant(
    event_id: int,
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return change_registration_status(
        event_id,
        registration_id,
        "accepted",
        db,
        current_user,
    )


@router.post("/{event_id}/applicants/{registration_id}/deny")
def deny_applicant(
    event_id: int,
    registration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return change_registration_status(
        event_id,
        registration_id,
        "denied",
        db,
        current_user,
    )