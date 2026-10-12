from app.database import Base, engine

# Import every model so SQLAlchemy registers its tables.
from app.models.user import User
from app.models.connection_request import ConnectionRequest
from app.models.event import Event, EventRegistration
from app.models.message import Message


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    create_tables()
