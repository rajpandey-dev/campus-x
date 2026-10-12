
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.connection_request import ConnectionRequest
from app.models.message import Message
from app.models.user import User


router = APIRouter(prefix="/chat", tags=["Chat"])


# -------------------- REQUEST SCHEMA --------------------

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


# -------------------- CONVERSATION HELPERS --------------------

def get_connected_student(
    db: Session,
    current_user_id: int,
    student_id: int,
) -> User:
    """Return a student only if they are an accepted connection."""

    if current_user_id == student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot chat with yourself.",
        )

    student = db.get(User, student_id)

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    connection = db.scalar(
        select(ConnectionRequest.id)
        .where(
            ConnectionRequest.status == "accepted",
            or_(
                and_(
                    ConnectionRequest.sender_id == current_user_id,
                    ConnectionRequest.receiver_id == student_id,
                ),
                and_(
                    ConnectionRequest.sender_id == student_id,
                    ConnectionRequest.receiver_id == current_user_id,
                ),
            ),
        )
        .limit(1)
    )

    if connection is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can message only accepted connections.",
        )

    return student


def conversation_filter(user_id: int, student_id: int):
    """Match messages belonging to exactly these two users."""

    return or_(
        and_(
            Message.sender_id == user_id,
            Message.receiver_id == student_id,
        ),
        and_(
            Message.sender_id == student_id,
            Message.receiver_id == user_id,
        ),
    )


def serialize_message(message: Message) -> dict:
    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "created_at": message.created_at,
    }


def serialize_student(student: User) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "college": student.college,
        "course": student.course,
        "year": student.year,
        "bio": student.bio,
    }


def sortable_datetime(value):
    """Convert a datetime to a comparable UTC timestamp."""

    if value is None:
        return float("-inf")

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.timestamp()


# -------------------- CONVERSATION LIST --------------------

@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List accepted connections and each conversation's latest message."""

    connections = db.scalars(
        select(ConnectionRequest).where(
            ConnectionRequest.status == "accepted",
            or_(
                ConnectionRequest.sender_id == current_user.id,
                ConnectionRequest.receiver_id == current_user.id,
            ),
        )
    ).all()

    # Use unique student IDs so duplicate connection rows do not
    # create duplicate entries in the conversation list.
    student_ids = set()

    for connection in connections:
        if connection.sender_id == current_user.id:
            student_ids.add(connection.receiver_id)
        else:
            student_ids.add(connection.sender_id)

    conversations = []

    for student_id in student_ids:
        student = db.get(User, student_id)

        if student is None:
            continue

        latest_message = db.scalar(
            select(Message)
            .where(conversation_filter(current_user.id, student_id))
            .order_by(
                Message.created_at.desc(),
                Message.id.desc(),
            )
            .limit(1)
        )

        conversations.append(
            {
                "student": serialize_student(student),
                "last_message": (
                    serialize_message(latest_message)
                    if latest_message is not None
                    else None
                ),
            }
        )

    # Conversations with recent messages appear first.
    # Empty conversations remain at the bottom.
    conversations.sort(
        key=lambda item: sortable_datetime(
            item["last_message"]["created_at"]
            if item["last_message"] is not None
            else None
        ),
        reverse=True,
    )

    return conversations


# -------------------- MESSAGE HISTORY --------------------

@router.get("/{student_id}/messages")
def get_messages(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return only the authenticated user's messages with one student."""

    get_connected_student(db, current_user.id, student_id)

    messages = db.scalars(
        select(Message)
        .where(conversation_filter(current_user.id, student_id))
        .order_by(
            Message.created_at.asc(),
            Message.id.asc(),
        )
    ).all()

    return [serialize_message(message) for message in messages]


# -------------------- SEND MESSAGE --------------------

@router.post(
    "/{student_id}/messages",
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    student_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a message between the authenticated user and one student."""

    get_connected_student(db, current_user.id, student_id)

    content = message_data.content.strip()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty.",
        )

    message = Message(
        sender_id=current_user.id,
        receiver_id=student_id,
        content=content,
    )

    try:
        db.add(message)
        db.commit()
        db.refresh(message)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send the message. Please try again.",
        )

    return serialize_message(message)