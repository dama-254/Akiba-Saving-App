from datetime import datetime
from decimal import Decimal, InvalidOperation
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Account, Transaction, generate_reference

account_bp = Blueprint("account", __name__, url_prefix="/api/account")

MAX_TRANSACTION_CENTS = 100_000_000  # KES 1,000,000 per transaction
AMOUNT_ERROR = "amount must be a positive number, with at most 2 decimal places, up to KES 1,000,000"


def with_user(fn):
    """Requires a valid token and hands the logged-in User to the route."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = db.session.get(User, int(get_jwt_identity()))
        if not user:
            return jsonify({"error": "user not found"}), 401
        return fn(user, *args, **kwargs)
    return wrapper


def parse_amount_cents(value):
    """'1250.50' -> 125050. Returns None if the amount is not acceptable."""
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    if not amount.is_finite() or amount <= 0:
        return None
    cents = amount * 100
    if cents != cents.to_integral_value():
        return None  # more than 2 decimal places
    cents = int(cents)
    if cents > MAX_TRANSACTION_CENTS:
        return None
    return cents


def _locked_response(user):
    seconds = (user.locked_until - datetime.utcnow()).total_seconds()
    minutes = max(1, int(seconds // 60) + 1)
    return jsonify(
        {"error": f"account locked after too many failed attempts. Try again in {minutes} minute(s)"}
    ), 423


def _check_pin(user, pin):
    """Returns an error response if the PIN is not accepted, otherwise None."""
    if user.is_locked():
        return _locked_response(user)
    if not user.check_pin(str(pin or "")):
        user.register_failed_login()
        db.session.commit()
        if user.is_locked():
            return _locked_response(user)
        return jsonify({"error": "incorrect PIN"}), 403
    user.reset_failed_logins()
    return None


def _locked_account(account_id):
    """Loads an account row and locks it so two requests can't change it at once."""
    return db.session.query(Account).filter_by(id=account_id).with_for_update().one()


def _clean(text, default):
    return str(text or "").strip()[:100] or default


@account_bp.get("")
@with_user
def summary(user):
    return jsonify(user.account.to_dict()), 200


@account_bp.get("/transactions")
@with_user
def transactions(user):
    limit = min(max(request.args.get("limit", 20, type=int), 1), 100)
    offset = max(request.args.get("offset", 0, type=int), 0)
    kind = request.args.get("kind")

    query = Transaction.query.filter_by(account_id=user.account.id)
    if kind:
        query = query.filter_by(kind=kind)
    total = query.count()
    items = (
        query.order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return jsonify({"total": total, "transactions": [t.to_dict() for t in items]}), 200


@account_bp.post("/deposit")
@with_user
def deposit(user):
    data = request.get_json(silent=True) or {}
    cents = parse_amount_cents(data.get("amount"))
    if cents is None:
        return jsonify({"error": AMOUNT_ERROR}), 400

    account = _locked_account(user.account.id)
    account.balance_cents += cents
    txn = Transaction(
        account_id=account.id,
        kind="deposit",
        amount_cents=cents,
        balance_after_cents=account.balance_cents,
        description=_clean(data.get("description"), "Deposit"),
    )
    db.session.add(txn)
    db.session.commit()
    return jsonify({"transaction": txn.to_dict(), "balance_cents": account.balance_cents}), 201


@account_bp.post("/withdraw")
@with_user
def withdraw(user):
    data = request.get_json(silent=True) or {}
    cents = parse_amount_cents(data.get("amount"))
    if cents is None:
        return jsonify({"error": AMOUNT_ERROR}), 400

    pin_error = _check_pin(user, data.get("pin"))
    if pin_error:
        return pin_error

    account = _locked_account(user.account.id)
    if account.balance_cents < cents:
        return jsonify({"error": "insufficient funds"}), 400

    account.balance_cents -= cents
    txn = Transaction(
        account_id=account.id,
        kind="withdrawal",
        amount_cents=cents,
        balance_after_cents=account.balance_cents,
        description=_clean(data.get("description"), "Withdrawal"),
    )
    db.session.add(txn)
    db.session.commit()
    return jsonify({"transaction": txn.to_dict(), "balance_cents": account.balance_cents}), 201


@account_bp.post("/transfer")
@with_user
def transfer(user):
    data = request.get_json(silent=True) or {}
    cents = parse_amount_cents(data.get("amount"))
    if cents is None:
        return jsonify({"error": AMOUNT_ERROR}), 400

    pin_error = _check_pin(user, data.get("pin"))
    if pin_error:
        return pin_error

    to_number = str(data.get("to_account") or "").strip()
    recipient = Account.query.filter_by(account_number=to_number).first()
    if not recipient:
        return jsonify({"error": "recipient account not found"}), 404
    if recipient.id == user.account.id:
        return jsonify({"error": "you cannot transfer to your own account"}), 400

    # Lock both rows in a fixed order so two opposite transfers can't deadlock.
    ids = sorted([user.account.id, recipient.id])
    locked = {a.id: a for a in (_locked_account(ids[0]), _locked_account(ids[1]))}
    sender, receiver = locked[user.account.id], locked[recipient.id]

    if sender.balance_cents < cents:
        return jsonify({"error": "insufficient funds"}), 400

    sender.balance_cents -= cents
    receiver.balance_cents += cents
    reference = generate_reference()
    note = _clean(data.get("description"), "Transfer")

    out_txn = Transaction(
        account_id=sender.id, kind="transfer_out", amount_cents=cents,
        balance_after_cents=sender.balance_cents, reference=reference,
        description=note, counterparty_account=receiver.account_number,
    )
    in_txn = Transaction(
        account_id=receiver.id, kind="transfer_in", amount_cents=cents,
        balance_after_cents=receiver.balance_cents, reference=reference,
        description=note, counterparty_account=sender.account_number,
    )
    db.session.add_all([out_txn, in_txn])
    db.session.commit()
    return jsonify({"transaction": out_txn.to_dict(), "balance_cents": sender.balance_cents}), 201
