import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DB_PARAMS = {
    "dbname": os.getenv("DB_NAME", "organization"),
    "user": os.getenv("DB_USER", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "password": os.getenv("DB_PASSWORD", "mysecretpassword"),
    "port": os.getenv("DB_PORT", "5432"),
}

DATABASE_URL = (
    f"postgresql://{DB_PARAMS['user']}:{DB_PARAMS['password']}"
    f"@{DB_PARAMS['host']}:{DB_PARAMS['port']}/{DB_PARAMS['dbname']}"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
