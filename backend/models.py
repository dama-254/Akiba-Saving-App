import secrets
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

MAX_FAILED_LOGINS = 5
LOCK_MINUTES = 15


def generate_account_number():
    return "".join(secrets.choice("0123456789") for _ in range(10))


def generate_reference():
    return "AKB" + secrets.token_hex(5).upper()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    pin_hash = db.Column(db.String(255), nullable=False)
    failed_logins = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    account = db.relationship(
        "Account", backref="owner", uselist=False, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def set_pin(self, pin):
        self.pin_hash = generate_password_hash(pin)

    def check_pin(self, pin):
        return check_password_hash(self.pin_hash, pin)

    def is_locked(self):
        return self.locked_until is not None and self.locked_until > datetime.utcnow()

    def register_failed_login(self):
        self.failed_logins += 1
        if self.failed_logins >= MAX_FAILED_LOGINS:
            self.locked_until = datetime.utcnow() + timedelta(minutes=LOCK_MINUTES)
            self.failed_logins = 0

    def reset_failed_logins(self):
        self.failed_logins = 0
        self.locked_until = None

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}


class Account(db.Model):
    __tablename__ = "accounts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    account_number = db.Column(
        db.String(10), unique=True, nullable=False, index=True, default=generate_account_number
    )
    balance_cents = db.Column(db.BigInteger, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    transactions = db.relationship(
        "Transaction",
        backref="account",
        cascade="all, delete-orphan",
        order_by="Transaction.created_at.desc()",
    )

    def to_dict(self):
        return {
            "account_number": self.account_number,
            "balance_cents": self.balance_cents,
            "owner_name": self.owner.name,
            "opened": self.created_at.isoformat(),
        }


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey("accounts.id"), nullable=False, index=True)
    kind = db.Column(db.String(20), nullable=False)  # deposit, withdrawal, transfer_in, transfer_out
    amount_cents = db.Column(db.BigInteger, nullable=False)  # always positive
    balance_after_cents = db.Column(db.BigInteger, nullable=False)
    reference = db.Column(db.String(20), nullable=False, default=generate_reference)
    description = db.Column(db.String(255), nullable=True)
    counterparty_account = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "amount_cents": self.amount_cents,
            "balance_after_cents": self.balance_after_cents,
            "reference": self.reference,
            "description": self.description,
            "counterparty_account": self.counterparty_account,
            "created_at": self.created_at.isoformat(),
        }
