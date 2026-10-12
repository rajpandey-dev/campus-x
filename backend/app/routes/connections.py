
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.connection_request import ConnectionRequest


router = APIRouter(
    prefix="/connections",
    tags=["Connections"],
)


class ConnectionRequestCreate(BaseModel):
    receiver_id: int = Field(gt=0)


def format_request(request, student=None):
    result = {
        "id": request.id,
        "sender_id": request.sender_id,
        "receiver_id": request.receiver_id,
        "status": request.status,
        "created_at": request.created_at,
    }

    if student is not None:
        result["sender"] = {
            "id": student.id,
            "name": student.name,
            "college": student.college,
            "course": student.course,
            "year": student.year,
            "bio": student.bio,
        }

    return result


def format_student(student):
    return {
        "id": student.id,
        "name": student.name,
        "college": student.college,
        "course": student.course,
        "year": student.year,
        "bio": student.bio,
    }


@router.post(
    "/request",
    status_code=status.HTTP_201_CREATED,
)
def send_connection_request(
    data: ConnectionRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.receiver_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot connect with yourself.",
        )

    receiver = db.get(User, data.receiver_id)

    if receiver is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    reverse_request = db.scalar(
        select(ConnectionRequest).where(
            ConnectionRequest.sender_id == receiver.id,
            ConnectionRequest.receiver_id == current_user.id,
        )
    )

    if reverse_request and reverse_request.status == "pending":
        raise HTTPException(
            status_code=409,
            detail=(
                "This student has already sent you a request. "
                "Check your incoming requests."
            ),
        )

    if reverse_request and reverse_request.status == "accepted":
        raise HTTPException(
            status_code=409,
            detail="You are already connected.",
        )

    existing_request = db.scalar(
        select(ConnectionRequest).where(
            ConnectionRequest.sender_id == current_user.id,
            ConnectionRequest.receiver_id == receiver.id,
        )
    )

    if existing_request:
        if existing_request.status == "pending":
            raise HTTPException(
                status_code=409,
                detail="You have already sent a request.",
            )

        if existing_request.status == "accepted":
            raise HTTPException(
                status_code=409,
                detail="You are already connected.",
            )

        existing_request.status = "pending"
        existing_request.created_at = datetime.utcnow()

        db.commit()
        db.refresh(existing_request)

        return format_request(existing_request)

    new_request = ConnectionRequest(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        status="pending",
    )

    db.add(new_request)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A request already exists between these students.",
        )

    db.refresh(new_request)

    return format_request(new_request)


@router.get("/requests")
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = db.scalars(
        select(ConnectionRequest)
        .where(
            ConnectionRequest.receiver_id == current_user.id,
            ConnectionRequest.status == "pending",
        )
        .order_by(ConnectionRequest.created_at.desc())
    ).all()

    results = []

    for request in requests:
        sender = db.get(User, request.sender_id)

        if sender is not None:
            results.append(
                format_request(request, student=sender)
            )

    return results


@router.get("/sent")
def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = db.scalars(
        select(ConnectionRequest)
        .where(
            ConnectionRequest.sender_id == current_user.id,
        )
        .order_by(ConnectionRequest.created_at.desc())
    ).all()

    return [
        format_request(request)
        for request in requests
    ]



@router.get("/accepted")
def get_accepted_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = db.scalars(
        select(ConnectionRequest)
        .where(
            ConnectionRequest.status == "accepted",
            or_(
                ConnectionRequest.sender_id == current_user.id,
                ConnectionRequest.receiver_id == current_user.id,
            ),
        )
        .order_by(ConnectionRequest.created_at.desc())
    ).all()

    results = []

    for request in requests:
        if request.sender_id == current_user.id:
            other_student_id = request.receiver_id
        else:
            other_student_id = request.sender_id

        student = db.get(User, other_student_id)

        if student is not None:
            results.append(format_student(student))

    return results



def change_request_status(
    request_id: int,
    new_status: str,
    db: Session,
    current_user: User,
):
    request = db.get(ConnectionRequest, request_id)

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Connection request not found.",
        )

    if request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot manage this request.",
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This request is no longer pending.",
        )

    request.status = new_status
    db.commit()
    db.refresh(request)

    return format_request(request)


@router.post("/{request_id}/accept")
def accept_connection_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return change_request_status(
        request_id=request_id,
        new_status="accepted",
        db=db,
        current_user=current_user,
    )


@router.post("/{request_id}/decline")
def decline_connection_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return change_request_status(
        request_id=request_id,
        new_status="declined",
        db=db,
        current_user=current_user,
    )