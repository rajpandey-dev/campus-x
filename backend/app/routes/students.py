
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


class StudentProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=100)
    college: str | None = Field(default=None, max_length=150)
    course: str | None = Field(default=None, max_length=150)
    year: str | None = Field(default=None, max_length=20)
    bio: str | None = Field(default=None, max_length=2000)


def profile_response(student: User) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "college": student.college,
        "course": student.course,
        "year": student.year,
        "bio": student.bio,
    }


@router.patch("/me")
def update_my_profile(
    profile: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Trim text and convert empty optional fields to None.
    name = profile.name.strip()

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Name cannot be empty.",
        )

    current_user.name = name
    current_user.college = (
        profile.college.strip() or None
        if profile.college is not None
        else None
    )
    current_user.course = (
        profile.course.strip() or None
        if profile.course is not None
        else None
    )
    current_user.year = (
        profile.year.strip() or None
        if profile.year is not None
        else None
    )
    current_user.bio = (
        profile.bio.strip() or None
        if profile.bio is not None
        else None
    )

    db.commit()
    db.refresh(current_user)

    return profile_response(current_user)


@router.get("")
def list_students(
    q: str = Query(default="", max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(User).where(
        User.id != current_user.id
    )

    search = q.strip()

    if search:
        pattern = f"%{search}%"

        statement = statement.where(
            or_(
                User.name.ilike(pattern),
                User.college.ilike(pattern),
                User.course.ilike(pattern),
                User.year.ilike(pattern),
                User.bio.ilike(pattern),
            )
        )

    statement = statement.order_by(User.name.asc())

    students = db.scalars(statement).all()

    return [
        {
            "id": student.id,
            "name": student.name,
            "college": student.college,
            "course": student.course,
            "year": student.year,
            "bio": student.bio,
            "common": " ".join(
                value
                for value in [
                    student.college,
                    student.course,
                    student.year,
                ]
                if value
            ) or "CampusX student",
        }
        for student in students
    ]