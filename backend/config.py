import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

_db_url = os.environ.get("DATABASE_URL")
IS_PRODUCTION = bool(_db_url)

if IS_PRODUCTION:
    # Some hosts hand out "postgres://", but SQLAlchemy needs "postgresql://".
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    # Name the driver we installed (psycopg2), because SQLAlchemy 2.1 defaults to a newer one.
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    for _name in ("SECRET_KEY", "JWT_SECRET_KEY", "FRONTEND_ORIGIN"):
        if not os.environ.get(_name):
            raise RuntimeError(f"{_name} must be set when DATABASE_URL is set")
else:
    _db_url = f"sqlite:///{os.path.join(BASE_DIR, 'akiba.db')}"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")
# end of file
